/**
 * WhatsApp Gateway Microservice (Dual-Engine: Baileys & whatsapp-web.js)
 * Politeknik Mardira Indonesia — MARDIRA WA Engine
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const axios = require('axios');
const pino = require('pino');

// Import Baileys
const baileys = require('@whiskeysockets/baileys');
const makeWASocket = baileys.default || baileys.makeWASocket;
const { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, proto } = baileys;

// In-memory message store for satisfying WhatsApp Signal protocol retry requests (prevents "Menunggu pesan ini...")
const messageStore = new Map();
const MAX_STORED_MESSAGES = 2000;

function storeMessage(keyId, message) {
    if (!keyId || !message) return;
    if (messageStore.size >= MAX_STORED_MESSAGES) {
        const oldestKey = messageStore.keys().next().value;
        messageStore.delete(oldestKey);
    }
    messageStore.set(keyId, message);
}

function getStoredMessage(keyId) {
    return messageStore.get(keyId) || null;
}

// Import whatsapp-web.js
const { Client, LocalAuth, MessageMedia, Poll, Buttons, List } = require('whatsapp-web.js');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

// Read secret from root .env if present
let rootSecret = process.env.INTERNAL_SECRET;
try {
    const rootEnvPath = path.join(__dirname, '../.env');
    if (!rootSecret && fs.existsSync(rootEnvPath)) {
        const envContent = fs.readFileSync(rootEnvPath, 'utf8');
        const match = envContent.match(/^WHATSAPP_NODE_SECRET=(.+)$/m);
        if (match) {
            rootSecret = match[1].trim().replace(/^['"]|['"]$/g, '');
        }
    }
} catch (e) {
    // Ignore env read failure
}

const INTERNAL_SECRET = rootSecret || 'internal_secret_token';
const LARAVEL_URL = process.env.LARAVEL_URL || 'http://127.0.0.1:8001';

// Base sessions directory
const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// In-memory active sessions store
const activeSessions = new Map();

// In-memory inbound message deduplication store
const processedInboundIds = new Set();
function isDuplicateInbound(msgId) {
    if (!msgId) return false;
    if (processedInboundIds.has(msgId)) return true;
    processedInboundIds.add(msgId);
    if (processedInboundIds.size > 1000) {
        const first = processedInboundIds.values().next().value;
        processedInboundIds.delete(first);
    }
    return false;
}

// Persistent LID <-> Phone Number Mapping Store
const LID_MAPPINGS_FILE = path.join(SESSIONS_DIR, 'lid_mappings.json');
const lidToPhoneMap = new Map();
const phoneToLidMap = new Map();

function loadLidMappings() {
    try {
        if (fs.existsSync(LID_MAPPINGS_FILE)) {
            const raw = JSON.parse(fs.readFileSync(LID_MAPPINGS_FILE, 'utf8'));
            for (const [k, v] of Object.entries(raw)) {
                const normLid = String(k).replace(/[^0-9]/g, '');
                let normPhone = String(v).replace(/[^0-9]/g, '');
                if (!normPhone.startsWith('+')) normPhone = '+' + normPhone;
                lidToPhoneMap.set(normLid, normPhone);
                phoneToLidMap.set(normPhone, normLid);
            }
            console.log(`[LID Store] Loaded ${lidToPhoneMap.size} LID-to-phone mappings from disk.`);
        }
    } catch (e) {
        console.warn('[LID Store] Error loading mappings:', e.message);
    }
}

let saveLidTimeout = null;
function persistLidMappings() {
    if (saveLidTimeout) clearTimeout(saveLidTimeout);
    saveLidTimeout = setTimeout(() => {
        try {
            const obj = {};
            for (const [lid, phone] of lidToPhoneMap.entries()) {
                obj[lid] = phone;
            }
            fs.writeFileSync(LID_MAPPINGS_FILE, JSON.stringify(obj, null, 2), 'utf8');
        } catch (e) {
            console.warn('[LID Store] Failed to persist mappings:', e.message);
        }
    }, 1000);
}

function saveLidMapping(rawLid, rawPhone) {
    if (!rawLid || !rawPhone) return;
    const cleanLid = String(rawLid).replace(/[^0-9]/g, '');
    let cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('+')) cleanPhone = '+' + cleanPhone;

    if (cleanLid && cleanPhone && cleanLid !== cleanPhone.replace('+', '')) {
        lidToPhoneMap.set(cleanLid, cleanPhone);
        phoneToLidMap.set(cleanPhone, cleanLid);
        persistLidMappings();
    }
}

function getPhoneByLid(rawLid) {
    if (!rawLid) return null;
    const cleanLid = String(rawLid).replace(/[^0-9]/g, '');
    return lidToPhoneMap.get(cleanLid) || null;
}

function getLidByPhone(rawPhone) {
    if (!rawPhone) return null;
    let cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('+')) cleanPhone = '+' + cleanPhone;
    return phoneToLidMap.get(cleanPhone) || null;
}

// Initial load of mappings
loadLidMappings();

/**
 * Safely extract clean E.164 phone number from any JID
 * E.g. '628386012467:1@s.whatsapp.net' -> '+628386012467'
 */
function extractCleanPhone(raw) {
    if (!raw) return null;
    const str = String(raw).trim();
    const userPart = str.split('@')[0].split(':')[0];
    const digits = userPart.replace(/[^0-9]/g, '');
    return digits ? '+' + digits : null;
}

/**
 * Format recipient number to WhatsApp JID
 * E.g. '08386012467' -> '628386012467@s.whatsapp.net'
 */
function formatRecipientJid(to, engine = 'baileys') {
    let rawStr = String(to || '').trim();
    let clean = rawStr.replace(/[^0-9]/g, '');

    // Check if the input number is a known WhatsApp LID
    const mappedPhone = getPhoneByLid(clean);
    if (mappedPhone) {
        console.log(`[JID Formatter] Automatically resolved LID ${clean} to mapped phone: ${mappedPhone}`);
        clean = mappedPhone.replace(/[^0-9]/g, '');
    }

    if (clean.startsWith('0')) {
        clean = '62' + clean.slice(1);
    } else if (!clean.startsWith('62') && clean.length <= 12) {
        clean = '62' + clean;
    }

    if (engine === 'wwebjs') {
        return `${clean}@c.us`;
    }
    return `${clean}@s.whatsapp.net`;
}

// Helper: notify Laravel backend of device status updates
async function notifyLaravelStatus(deviceId, payload) {
    try {
        await axios.post(`${LARAVEL_URL}/api/internal/devices/webhook`, {
            device_id: deviceId,
            ...payload,
        }, {
            headers: { 'X-Internal-Secret': INTERNAL_SECRET },
            timeout: 5000,
        });
        console.log(`[Laravel Notified] Device ${deviceId} ->`, payload.status);
    } catch (err) {
        // If device has been removed from Laravel DB (404), gracefully clean up session
        if (err.response && err.response.status === 404) {
            console.warn(`[Device Removed] Device ${deviceId} not found in Laravel. Stopping session.`);
            const sessionId = `device_${deviceId}`;
            const session = activeSessions.get(sessionId);
            if (session) {
                session.isDestroyed = true;
                if (session.client) {
                    try {
                        if (session.engine === 'baileys') session.client.end();
                        if (session.engine === 'wwebjs') session.client.destroy();
                    } catch (e) {}
                }
            }
            activeSessions.delete(sessionId);
            return;
        }
        console.warn(`[Webhook Notice] Device ${deviceId} status update: ${err.message}`);
    }
}

// Helper: forward incoming WhatsApp message to Laravel Inbox
async function notifyLaravelMessage(payload) {
    try {
        await axios.post(`${LARAVEL_URL}/api/internal/messages/receive`, payload, {
            headers: { 'X-Internal-Secret': INTERNAL_SECRET },
            timeout: 5000,
        });
        console.log(`[Inbound Message] From ${payload.sender} forwarded to Laravel`);
    } catch (err) {
        console.warn(`[Inbound Forward Notice] ${err.message}`);
    }
}

// Middleware: Authenticate internal requests from Laravel
app.use((req, res, next) => {
    // Health check endpoint is public for monitoring
    if (req.path === '/health') return next();

    const token = req.headers['x-internal-secret'];
    if (token !== INTERNAL_SECRET) {
        return res.status(403).json({ error: 'Forbidden: Invalid internal secret token.' });
    }
    next();
});

/**
 * Health Check Endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'MARDIRA WhatsApp Gateway Engine',
        uptime: Math.floor(process.uptime()),
        active_sessions: activeSessions.size,
        engines_supported: ['baileys', 'wwebjs'],
        timestamp: new Date().toISOString(),
    });
});

/**
 * Initialize a device session with selected engine
 */
app.post('/sessions/init', async (req, res) => {
    const { device_id, engine = 'baileys' } = req.body;
    if (!device_id) {
        return res.status(400).json({ error: 'device_id is required' });
    }

    const sessionId = `device_${device_id}`;
    let existing = activeSessions.get(sessionId);

    // If already connected, return connected immediately
    if (existing && existing.status === 'connected') {
        return res.json({
            status: 'connected',
            device_id,
            engine: existing.engine,
            phone_number: existing.phoneNumber,
        });
    }

    // If session already has an active QR code ready, return it
    if (existing && existing.qr && existing.status === 'qr_ready') {
        return res.json({
            status: 'qr_ready',
            device_id,
            engine: existing.engine,
            qr: existing.qr,
        });
    }

    try {
        if (engine === 'baileys') {
            await initBaileysSession(device_id);
        } else {
            await initWwebjsSession(device_id);
        }

        // Wait up to 6 seconds for initial QR emission or connection
        let attempts = 0;
        while (attempts < 24) {
            const current = activeSessions.get(sessionId);
            if (current && (current.qr || current.status === 'connected')) {
                return res.json({
                    status: current.status,
                    device_id,
                    engine,
                    qr: current.qr,
                    phone_number: current.phoneNumber,
                });
            }
            await new Promise((resolve) => setTimeout(resolve, 250));
            attempts++;
        }

        const current = activeSessions.get(sessionId);
        return res.json({
            status: current?.status || 'qr_ready',
            device_id,
            engine,
            qr: current?.qr || null,
        });
    } catch (err) {
        console.error(`[Session Init Error] Device ${device_id}:`, err);
        return res.status(500).json({
            status: 'error',
            error: err.message,
            device_id,
            engine,
        });
    }
});

/**
 * Initialize Baileys Engine
 */
async function initBaileysSession(deviceId) {
    const sessionId = `device_${deviceId}`;
    const authPath = path.join(SESSIONS_DIR, `baileys_${deviceId}`);

    // If existing active session is already connected, return it
    const existing = activeSessions.get(sessionId);
    if (existing && existing.status === 'connected' && existing.client) {
        return existing;
    }

    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const logger = pino({ level: 'silent' });

    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        logger,
        printQRInTerminal: false,
        browser: ['Ubuntu', 'Chrome', '22.04.4'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        // Crucial for solving "Menunggu pesan ini... / Waiting for this message":
        getMessage: async (key) => {
            if (key?.id) {
                const cached = getStoredMessage(key.id);
                if (cached) return cached;
            }
            return proto.Message.fromObject({});
        },
    });

    const sessionData = {
        client: sock,
        engine: 'baileys',
        status: 'initializing',
        qr: null,
        phoneNumber: state.creds?.me?.id ? '+' + state.creds.me.id.split(':')[0] : null,
        deviceId,
    };
    activeSessions.set(sessionId, sessionData);

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(`[Baileys QR Emitted] Device ${deviceId}`);
            try {
                const qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
                sessionData.qr = qrDataUrl;
                sessionData.status = 'qr_ready';
                notifyLaravelStatus(deviceId, { status: 'qr_ready', qr_code: qrDataUrl });
            } catch (qrErr) {
                console.error('QR Encode Error:', qrErr);
            }
        }

        if (connection === 'open') {
            const rawPhone = sock.user?.id ? sock.user.id.split(':')[0] : '6281298430911';
            let phone = rawPhone.replace(/[^0-9]/g, '');
            if (!phone.startsWith('+')) phone = '+' + phone;

            console.log(`[Baileys Connected] Device ${deviceId} Phone: ${phone}`);
            sessionData.status = 'connected';
            sessionData.qr = null;
            sessionData.phoneNumber = phone;

            notifyLaravelStatus(deviceId, {
                status: 'connected',
                phone_number: phone,
                qr_code: null,
            });
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log(`[Baileys Closed] Device ${deviceId} Status: ${statusCode}, Reconnect: ${shouldReconnect}`);
            if (shouldReconnect && !sessionData.isDestroyed) {
                setTimeout(() => {
                    if (!sessionData.isDestroyed && activeSessions.has(sessionId)) {
                        initBaileysSession(deviceId).catch((err) => {
                            console.warn(`[Baileys Reconnect Error] Device ${deviceId}: ${err.message}`);
                        });
                    }
                }, 3000);
            } else {
                sessionData.status = 'disconnected';
                sessionData.qr = null;
                notifyLaravelStatus(deviceId, { status: 'disconnected', qr_code: null });
            }
        }
    });

    // Inbound messages handler
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        // Cache all messages for Signal protocol retry requests (preventing "Menunggu pesan ini...")
        for (const msg of messages) {
            if (msg.key?.id && msg.message) {
                storeMessage(msg.key.id, msg.message);
            }
        }

        if (type !== 'notify') return;
        for (const msg of messages) {
            if (!msg.key.fromMe && msg.message) {
                const remoteJid = msg.key.remoteJid || '';

                // Filter out WhatsApp story/status updates and channels
                if (remoteJid === 'status@broadcast' || remoteJid.endsWith('@newsletter') || remoteJid.endsWith('@broadcast')) {
                    continue;
                }

                let senderJid = remoteJid;
                if (remoteJid.endsWith('@g.us') && msg.key.participant) {
                    senderJid = msg.key.participant;
                }

                let resolvedPhone = null;
                if (senderJid.endsWith('@s.whatsapp.net')) {
                    resolvedPhone = '+' + senderJid.replace(/[^0-9]/g, '');
                } else if (senderJid.endsWith('@lid')) {
                    const cached = getPhoneByLid(senderJid);
                    if (cached) {
                        resolvedPhone = cached;
                    }
                }

                if (!resolvedPhone) {
                    resolvedPhone = '+' + senderJid.replace(/[^0-9]/g, '');
                }

                const bodyText = msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    msg.message.imageMessage?.caption ||
                    (msg.message.imageMessage ? '[Gambar]' : (msg.message.documentMessage ? '[Dokumen]' : '[Media]'));

                const pushName = msg.pushName || '';

                notifyLaravelMessage({
                    device_id: deviceId,
                    sender: resolvedPhone,
                    sender_name: pushName,
                    message: bodyText,
                    timestamp: new Date().toISOString(),
                });
            }
        }
    });

    // Listen to phone number share events in Baileys for automatic LID mapping
    sock.ev.on('chats.phoneNumberShare', ({ lid, jid }) => {
        if (lid && jid) {
            const cleanPhone = '+' + jid.replace(/[^0-9]/g, '');
            saveLidMapping(lid, cleanPhone);
            console.log(`[Baileys LID Mapped] ${lid} <=> ${cleanPhone}`);
        }
    });

    return sessionData;
}

/**
 * Clean up existing WWebJS browser, active pages, lock files and lingering processes
 */
async function cleanupWwebjsBrowser(deviceId) {
    const sessionId = `device_${deviceId}`;
    const session = activeSessions.get(sessionId);

    // Stop keep-alive heartbeat if active
    if (session?.keepAliveTimer) {
        clearInterval(session.keepAliveTimer);
        session.keepAliveTimer = null;
    }

    if (session?.client) {
        try {
            if (session.client.pupPage && !session.client.pupPage.isClosed()) {
                await session.client.pupPage.close().catch(() => {});
            }
        } catch (e) {}

        try {
            if (session.client.pupBrowser) {
                await session.client.pupBrowser.close().catch(() => {});
            }
        } catch (e) {}

        try {
            await session.client.destroy().catch(() => {});
        } catch (e) {}
    }

    // Inspect and clean Chromium lock files and processes in session dir
    const sessionDir = path.join(SESSIONS_DIR, 'wwebjs', `session-device_${deviceId}`);
    if (fs.existsSync(sessionDir)) {
        const lockPath = path.join(sessionDir, 'SingletonLock');
        try {
            if (fs.existsSync(lockPath) || fs.lstatSync(lockPath).isSymbolicLink()) {
                const target = fs.readlinkSync(lockPath);
                const parts = target.split('-');
                const pidStr = parts[parts.length - 1];
                const pid = parseInt(pidStr, 10);
                if (pid && !isNaN(pid)) {
                    try {
                        process.kill(pid, 0); // check if alive
                        console.log(`[WWebJS Cleanup] Terminating zombie Chromium PID ${pid} for Device ${deviceId}`);
                        process.kill(pid, 'SIGKILL');
                    } catch (e) {
                        // process is already dead
                    }
                }
            }
        } catch (err) {
            // lock may not exist or readlink error
        }

        // Remove stale lock symlinks and devtools port
        for (const file of ['SingletonLock', 'SingletonCookie', 'SingletonSocket', 'DevToolsActivePort']) {
            const fPath = path.join(sessionDir, file);
            try {
                fs.unlinkSync(fPath);
            } catch (e) {}
        }
    }
}

/**
 * Initialize whatsapp-web.js Engine
 */
async function initWwebjsSession(deviceId) {
    const sessionId = `device_${deviceId}`;

    // Clean up any stale browser or lock files first
    await cleanupWwebjsBrowser(deviceId);

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: sessionId,
            dataPath: path.join(SESSIONS_DIR, 'wwebjs'),
        }),
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1051682431-alpha.html',
        },
        puppeteer: {
            headless: 'new',
            protocolTimeout: 120000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-features=IsolateOrigins,site-per-process,Translate,BackForwardCache,AcceptCHFrame,AvoidUnnecessaryBeforeUnloadCheckSync',
                '--disable-site-isolation-trials',
                '--disable-extensions',
                '--disable-software-rasterizer',
                '--disable-renderer-backgrounding',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-ipc-flooding-protection',
                '--disable-breakpad',
                '--disable-component-update',
                '--disable-default-apps',
                '--disable-hang-monitor',
                '--disable-prompt-on-repost',
                '--disable-sync',
                '--metrics-recording-only',
                '--no-default-browser-check',
                '--safebrowsing-disable-auto-update',
                '--enable-features=NetworkService,NetworkServiceInProcess',
            ],
        },
    });

    const sessionData = {
        client,
        engine: 'wwebjs',
        status: 'initializing',
        qr: null,
        phoneNumber: null,
        deviceId,
        keepAliveTimer: null,
    };
    activeSessions.set(sessionId, sessionData);

    client.on('qr', async (qr) => {
        console.log(`[WWebJS QR Emitted] Device ${deviceId}`);
        try {
            const qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
            sessionData.qr = qrDataUrl;
            sessionData.status = 'qr_ready';
            notifyLaravelStatus(deviceId, { status: 'qr_ready', qr_code: qrDataUrl });
        } catch (e) {
            console.error(e);
        }
    });

    client.on('authenticated', () => {
        console.log(`[WWebJS Authenticated] Device ${deviceId} authenticated successfully.`);
    });

    client.on('auth_failure', (msg) => {
        console.error(`[WWebJS Auth Failure] Device ${deviceId}:`, msg);
    });

    client.on('loading_screen', (percent, message) => {
        console.log(`[WWebJS Loading] Device ${deviceId}: ${percent}% - ${message}`);
    });

    client.on('ready', () => {
        const rawUser = client.info?.wid?.user || '6281298430911';
        let phone = rawUser.replace(/[^0-9]/g, '');
        if (!phone.startsWith('+')) phone = '+' + phone;

        console.log(`[WWebJS Connected] Device ${deviceId} Phone: ${phone}`);
        sessionData.status = 'connected';
        sessionData.qr = null;
        sessionData.phoneNumber = phone;

        notifyLaravelStatus(deviceId, {
            status: 'connected',
            phone_number: phone,
            qr_code: null,
        });

        // Proactive keep-alive heartbeat every 15s to prevent frame detachment and trigger auto-recovery
        if (sessionData.keepAliveTimer) clearInterval(sessionData.keepAliveTimer);
        sessionData.keepAliveTimer = setInterval(async () => {
            try {
                if (sessionData.client?.pupPage && !sessionData.client.pupPage.isClosed()) {
                    await sessionData.client.pupPage.evaluate(() => window.WWebJS ? true : false);
                }
            } catch (err) {
                if (err.message && (
                    err.message.includes('detached Frame') ||
                    err.message.includes('Execution context was destroyed') ||
                    err.message.includes('Session closed') ||
                    err.message.includes('Protocol error')
                )) {
                    console.warn(`[Keepalive Auto-Recovery] Detected detached frame on Device ${deviceId}: ${err.message}. Restarting session cleanly...`);
                    if (sessionData.keepAliveTimer) {
                        clearInterval(sessionData.keepAliveTimer);
                        sessionData.keepAliveTimer = null;
                    }
                    cleanupWwebjsBrowser(deviceId).then(() => initWwebjsSession(deviceId)).catch(e => {
                        console.error(`[Keepalive Recovery Err] Device ${deviceId}:`, e.message);
                    });
                }
            }
        }, 15000);
    });

    const handleIncomingWWebJSMessage = async (msg) => {
        if (!msg || msg.fromMe) return;

        // Ignore WhatsApp status updates, channel newsletters, and broadcasts
        if (msg.from === 'status@broadcast' || msg.from?.endsWith('@newsletter') || msg.broadcast) {
            return;
        }

        const msgId = msg.id?._serialized || (msg.id?.id ? `${msg.from}_${msg.id.id}` : null);
        if (isDuplicateInbound(msgId)) return;

        let rawSender = msg.from;
        if (msg.from?.endsWith('@g.us') && msg.author) {
            rawSender = msg.author;
        }

        let resolvedPhone = null;

        // If it's a standard user phone JID: e.g. 628xxx@c.us
        if (rawSender?.endsWith('@c.us')) {
            resolvedPhone = extractCleanPhone(rawSender);

            // Learn contact LID mapping in background
            try {
                if (typeof client.getContactLidAndPhone === 'function') {
                    client.getContactLidAndPhone([rawSender]).then((results) => {
                        if (results && results.length > 0 && results[0].lid && results[0].pn) {
                            saveLidMapping(results[0].lid, resolvedPhone);
                        }
                    }).catch(() => {});
                }
            } catch (e) {}
        }
        // If it's a WhatsApp LID: e.g. 83842123694137@lid
        else if (rawSender?.endsWith('@lid') || (!rawSender?.endsWith('@c.us') && !rawSender?.endsWith('@g.us'))) {
            // 1. Check local persistent mapping store
            const cachedPhone = getPhoneByLid(rawSender);
            if (cachedPhone) {
                resolvedPhone = cachedPhone;
                console.log(`[WWebJS LID Hit] Mapped ${rawSender} -> ${resolvedPhone}`);
            } else {
                // 2. Query whatsapp-web.js internal mapping
                try {
                    if (typeof client.getContactLidAndPhone === 'function') {
                        const results = await client.getContactLidAndPhone([rawSender]);
                        if (results && results.length > 0 && results[0].pn) {
                            const clean = results[0].pn.replace(/[^0-9]/g, '');
                            if (clean) {
                                resolvedPhone = '+' + clean;
                                saveLidMapping(rawSender, resolvedPhone);
                                console.log(`[WWebJS LID Resolved] Successfully mapped ${rawSender} -> ${resolvedPhone}`);
                            }
                        }
                    }
                } catch (resolveErr) {
                    console.warn(`[WWebJS LID Resolution Err] ${rawSender}:`, resolveErr.message);
                }

                // 3. Fallback: query Contact object
                if (!resolvedPhone) {
                    try {
                        const contact = await msg.getContact();
                        if (contact && contact.number) {
                            const clean = contact.number.replace(/[^0-9]/g, '');
                            if (clean && !contact.id?._serialized?.endsWith('@lid')) {
                                resolvedPhone = '+' + clean;
                                saveLidMapping(rawSender, resolvedPhone);
                            }
                        }
                    } catch (contactErr) {}
                }
            }
        }

        // Final fallback: extract clean digits if resolution was not possible
        if (!resolvedPhone) {
            resolvedPhone = extractCleanPhone(rawSender);
        }

        const bodyText = msg.body ||
            msg.selectedButtonId ||
            msg.selectedRowId ||
            (msg.hasMedia ? '[Media]' : '[Pesan]');

        const pushName = msg._data?.notifyName || msg.notifyName || '';

        notifyLaravelMessage({
            device_id: deviceId,
            sender: resolvedPhone,
            sender_name: pushName,
            message: bodyText,
            timestamp: new Date().toISOString(),
        });
    };

    client.on('message', handleIncomingWWebJSMessage);
    client.on('message_create', handleIncomingWWebJSMessage);

    // Listen to real-time interactive Poll votes (User tapped menu button on mobile/web WhatsApp)
    client.on('vote_update', async (vote) => {
        try {
            console.log(`[WWebJS Vote Event] Device ${deviceId} vote received`);
            let option = vote.selectedOptions?.[0]?.name;
            const localId = vote.selectedOptions?.[0]?.localId ?? vote.selectedOptionLocalIds?.[0];
            if (!option && localId !== undefined && vote.parentMessage?.pollOptions) {
                const optObj = vote.parentMessage.pollOptions.find(o => o.localId === localId);
                if (optObj?.name) option = optObj.name;
            }
            if (!option && localId !== undefined) {
                option = String(localId + 1);
            }
            if (!option) return;

            let rawSender = vote.voter || vote.author || vote.parentMessage?.to || vote.parentMessage?.from || '';
            let resolvedPhone = null;
            if (rawSender.endsWith('@lid')) {
                resolvedPhone = getPhoneByLid(rawSender);
            }
            if (!resolvedPhone) {
                resolvedPhone = extractCleanPhone(rawSender);
            }

            console.log(`[WWebJS Poll Vote Received] User ${resolvedPhone} tapped interactive option: "${option}"`);
            notifyLaravelMessage({
                device_id: deviceId,
                sender: resolvedPhone,
                message: option,
                timestamp: new Date().toISOString(),
            });
        } catch (vErr) {
            console.warn(`[WWebJS Vote Notice] ${vErr.message}`);
        }
    });

    client.on('disconnected', (reason) => {
        console.log(`[WWebJS Disconnected] Device ${deviceId}: ${reason}`);
        if (sessionData.keepAliveTimer) {
            clearInterval(sessionData.keepAliveTimer);
            sessionData.keepAliveTimer = null;
        }
        sessionData.status = 'disconnected';
        sessionData.qr = null;
        notifyLaravelStatus(deviceId, { status: 'disconnected', qr_code: null });
    });

    client.initialize().catch((err) => {
        console.warn(`[WWebJS Init Warn] Device ${deviceId}: ${err.message}`);
    });

    return sessionData;
}

app.get('/debug/chat', async (req, res) => {
    const { device_id, phone } = req.query;
    const session = activeSessions.get(`device_${device_id}`);
    if (!session || !session.client) return res.json({ error: 'Session not found' });
    try {
        const chats = await session.client.pupPage.evaluate(() => {
            const models = window.require('WAWebCollections').Chat.models;
            return models.slice(0, 5).map(c => ({
                id: c.id._serialized,
                name: c.name,
                unreadCount: c.unreadCount,
                lastMsg: c.lastReceivedKey?._serialized,
                msgsCount: c.msgs?.length,
                last5Msgs: c.msgs ? c.msgs.models.slice(-5).map(m => ({
                    id: m.id._serialized,
                    type: m.type,
                    fromMe: m.id.fromMe,
                    body: m.body?.slice(0, 50),
                    ack: m.ack,
                })) : []
            }));
        });
        return res.json({ chats });
    } catch (e) {
        return res.json({ error: e.message });
    }
});

/**
 * Route: Check session status (polling by frontend/Laravel)
 */
app.get('/sessions/status', async (req, res) => {
    const { device_id } = req.query;
    if (!device_id) {
        return res.status(400).json({ error: 'device_id is required' });
    }

    const sessionId = `device_${device_id}`;
    let session = activeSessions.get(sessionId);

    // If not in memory but credentials exist on disk, auto-restore
    if (!session) {
        const authPath = path.join(SESSIONS_DIR, `baileys_${device_id}`);
        if (fs.existsSync(path.join(authPath, 'creds.json'))) {
            initBaileysSession(device_id).catch(() => {});
            session = activeSessions.get(sessionId);
        }
    }

    if (!session) {
        return res.json({
            status: 'disconnected',
            device_id,
            qr: null,
            phone_number: null,
        });
    }

    return res.json({
        status: session.status,
        device_id,
        engine: session.engine,
        qr: session.qr,
        phone_number: session.phoneNumber,
    });
});

/**
 * Route: Connect session immediately (Simulated/Fast Connect)
 */
app.post('/sessions/connect', async (req, res) => {
    const { device_id, phone_number } = req.body;
    const sessionId = `device_${device_id}`;

    let session = activeSessions.get(sessionId);
    const assignedPhone = phone_number || '+62812' + Math.floor(10000000 + Math.random() * 90000000);

    if (!session) {
        session = {
            engine: 'baileys',
            deviceId: device_id,
        };
        activeSessions.set(sessionId, session);
    }

    session.status = 'connected';
    session.qr = null;
    session.phoneNumber = assignedPhone;

    notifyLaravelStatus(device_id, {
        status: 'connected',
        phone_number: assignedPhone,
        qr_code: null,
    });

    return res.json({
        success: true,
        status: 'connected',
        device_id,
        phone_number: assignedPhone,
    });
});

/**
 * Route: Disconnect / Logout Session
 */
app.post('/sessions/disconnect', async (req, res) => {
    const { device_id } = req.body;
    const sessionId = `device_${device_id}`;
    const session = activeSessions.get(sessionId);

    if (session) {
        session.isDestroyed = true;
        if (session.keepAliveTimer) {
            clearInterval(session.keepAliveTimer);
            session.keepAliveTimer = null;
        }
        try {
            if (session.engine === 'baileys' && session.client) {
                session.client.end();
            } else if (session.engine === 'wwebjs') {
                await cleanupWwebjsBrowser(device_id);
            }
        } catch (e) {
            console.warn('Disconnect error:', e.message);
        }
        activeSessions.delete(sessionId);
    } else {
        await cleanupWwebjsBrowser(device_id);
    }

    notifyLaravelStatus(device_id, { status: 'disconnected', qr_code: null });

    return res.json({
        success: true,
        status: 'disconnected',
        device_id,
    });
});

/**
 * Route: Send WhatsApp Message
 */
app.post('/messages/send', async (req, res) => {
    const { device_id, engine, to, message, media_url, poll_options, poll_title, list_button, list_sections, list_title, list_footer } = req.body;
    const sessionId = `device_${device_id}`;
    let session = activeSessions.get(sessionId);

    // If session not in memory but credentials exist on disk, auto-restore
    if (!session || !session.client) {
        const authPath = path.join(SESSIONS_DIR, `baileys_${device_id}`);
        if (fs.existsSync(path.join(authPath, 'creds.json'))) {
            console.log(`[Auto-Restore] Restoring Baileys session for Device ${device_id}...`);
            await initBaileysSession(device_id);
            // Wait up to 5s for socket open
            let waits = 0;
            while (waits < 20) {
                session = activeSessions.get(sessionId);
                if (session && session.status === 'connected' && session.client) break;
                await new Promise((r) => setTimeout(r, 250));
                waits++;
            }
        }
    }

    const jid = formatRecipientJid(to, session?.engine || engine);
    console.log(`[Dispatch Message] Device ${device_id} (${session?.engine || engine}) -> To: ${to} (JID: ${jid}) | Length: ${message?.length || 0} | List: ${list_sections?.length || 0} | Poll: ${poll_options?.length || 0}`);

    const messageId = `MSG_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    if (session && session.status === 'connected' && session.client) {
        try {
            if (session.engine === 'baileys') {
                let sent;
                if (media_url) {
                    sent = await session.client.sendMessage(jid, {
                        image: { url: media_url },
                        caption: message,
                    });
                } else if (message) {
                    sent = await session.client.sendMessage(jid, { text: message });
                }

                if (poll_options && Array.isArray(poll_options) && poll_options.length > 0) {
                    try {
                        const pollSent = await session.client.sendMessage(jid, {
                            poll: {
                                name: poll_title || '📋 Silakan Ketuk Pilihan Layanan:',
                                values: poll_options,
                                selectableCount: 1,
                            },
                        });
                        console.log(`[Baileys Poll Success] Real interactive option buttons dispatched to ${jid}`);
                        if (!sent) sent = pollSent;
                    } catch (pErr) {
                        console.warn(`[Baileys Poll Warning] ${pErr.message}`);
                    }
                }

                if (sent?.key?.id && sent.message) {
                    storeMessage(sent.key.id, sent.message);
                }

                const realId = sent?.key?.id || messageId;
                console.log(`[Send Success] Real message dispatched to ${jid}, ID: ${realId}`);
                return res.json({
                    success: true,
                    message_id: realId,
                    engine_used: 'baileys',
                    status: 'delivered',
                });
            } else if (session.engine === 'wwebjs') {
                let sent;
                try {
                    if (media_url) {
                        const media = await MessageMedia.fromUrl(media_url, { unsafeMime: true });
                        sent = await session.client.sendMessage(jid, media, { caption: message });
                    } else if (message) {
                        sent = await session.client.sendMessage(jid, message);
                    }

                    if (poll_options && Array.isArray(poll_options) && poll_options.length > 0) {
                        try {
                            const poll = new Poll(poll_title || '📋 Silakan Ketuk Pilihan Layanan:', poll_options, { allowMultipleAnswers: false });
                            const pollSent = await session.client.sendMessage(jid, poll);
                            console.log(`[WWebJS Poll Success] Real interactive option buttons dispatched to ${jid}`);
                            if (!sent) sent = pollSent;
                        } catch (pErr) {
                            console.warn(`[WWebJS Poll Warning] ${pErr.message}`);
                        }
                    }
                } catch (firstErr) {
                    if (firstErr.message && firstErr.message.includes('No LID for user')) {
                        console.warn(`[Send Fallback] Encountered 'No LID for user' for ${jid}. Checking mappings...`);
                        const mappedPhone = getPhoneByLid(to);
                        if (mappedPhone) {
                            const retryJid = formatRecipientJid(mappedPhone, 'wwebjs');
                            console.log(`[Send Fallback] Retrying send to mapped phone JID: ${retryJid}`);
                            if (media_url) {
                                const media = await MessageMedia.fromUrl(media_url, { unsafeMime: true });
                                sent = await session.client.sendMessage(retryJid, media, { caption: message });
                            } else if (message) {
                                sent = await session.client.sendMessage(retryJid, message);
                            }
                            if (poll_options && Array.isArray(poll_options) && poll_options.length > 0) {
                                const poll = new Poll(poll_title || '📋 Silakan Ketuk Pilihan Layanan:', poll_options, { allowMultipleAnswers: false });
                                sent = await session.client.sendMessage(retryJid, poll);
                            }
                        } else {
                            throw firstErr;
                        }
                    } else if (firstErr.message && (
                        firstErr.message.includes('detached Frame') ||
                        firstErr.message.includes('Execution context was destroyed') ||
                        firstErr.message.includes('Session closed') ||
                        firstErr.message.includes('Protocol error')
                    )) {
                        console.warn(`[Send Recovery] Frame/context issue on Device ${device_id}: ${firstErr.message}. Attempting page recovery...`);
                        let recovered = false;
                        try {
                            if (session.client && session.client.pupBrowser) {
                                const pages = await session.client.pupBrowser.pages();
                                const activePage = pages.find((p) => p.url().includes('whatsapp.com')) || pages[0];
                                if (activePage && !activePage.isClosed()) {
                                    session.client.pupPage = activePage;
                                    await session.client.inject();
                                    await new Promise((r) => setTimeout(r, 1000));
                                    console.log(`[Send Recovery] Re-attached & injected. Retrying sendMessage...`);
                                    if (media_url) {
                                        const media = await MessageMedia.fromUrl(media_url, { unsafeMime: true });
                                        sent = await session.client.sendMessage(jid, media, { caption: message });
                                    } else if (message) {
                                        sent = await session.client.sendMessage(jid, message);
                                    }
                                    if (poll_options && Array.isArray(poll_options) && poll_options.length > 0) {
                                        const poll = new Poll(poll_title || '📋 Silakan Ketuk Pilihan Layanan:', poll_options, { allowMultipleAnswers: false });
                                        sent = await session.client.sendMessage(jid, poll);
                                    }
                                    recovered = true;
                                }
                            }
                        } catch (reinjectErr) {
                            console.warn(`[Send Recovery] In-place re-injection failed: ${reinjectErr.message}`);
                        }

                        if (!recovered) {
                            console.error(`[Send Recovery] In-place recovery failed. Triggering clean session restart in background...`);
                            setTimeout(async () => {
                                try {
                                    await cleanupWwebjsBrowser(device_id);
                                    await initWwebjsSession(device_id);
                                } catch (e) {
                                    console.error(`[Send Recovery Restart Err] Device ${device_id}:`, e.message);
                                }
                            }, 500);
                            throw firstErr;
                        }
                    } else {
                        throw firstErr;
                    }
                }

                // Learn contact LID mapping in background for future inbound replies
                try {
                    if (typeof session.client.getContactLidAndPhone === 'function') {
                        session.client.getContactLidAndPhone([jid]).then((results) => {
                            if (results && results.length > 0 && results[0].lid && results[0].pn) {
                                const cleanPn = '+' + results[0].pn.replace(/[^0-9]/g, '');
                                saveLidMapping(results[0].lid, cleanPn);
                                console.log(`[LID Cached on Send] ${results[0].lid} <=> ${cleanPn}`);
                            }
                        }).catch(() => {});
                    }
                } catch (e) {}

                console.log(`[Send Success] Real WWebJS message dispatched to ${jid}`);
                return res.json({
                    success: true,
                    message_id: sent?.id?._serialized || messageId,
                    engine_used: 'wwebjs',
                    status: 'delivered',
                });
            }
        } catch (sendErr) {
            console.error(`[Send Error] Real dispatch error for ${jid}: ${sendErr.message}`);
            return res.status(500).json({
                success: false,
                error: sendErr.message,
                message_id: messageId,
                status: 'failed',
            });
        }
    }

    console.warn(`[Send Warning] Device ${device_id} is not connected to WhatsApp.`);
    return res.status(400).json({
        success: false,
        error: `Perangkat WhatsApp (Device ${device_id}) belum terhubung. Pastikan sesi sudah dipindai QR atau aktif.`,
        status: 'failed',
    });
});

/**
 * Auto-restore saved sessions on server boot
 */
async function autoRestoreSavedSessions() {
    try {
        const files = fs.readdirSync(SESSIONS_DIR);
        for (const file of files) {
            if (file.startsWith('baileys_')) {
                const deviceId = file.replace('baileys_', '');
                if (deviceId === '2') continue; // Skip obsolete device
                const credsPath = path.join(SESSIONS_DIR, file, 'creds.json');
                if (fs.existsSync(credsPath)) {
                    console.log(`[Auto-Restore] Found saved Baileys session for Device ${deviceId}. Initializing...`);
                    initBaileysSession(deviceId).catch((err) => {
                        console.warn(`[Auto-Restore Error] Device ${deviceId}:`, err.message);
                    });
                }
            }
        }

        // Auto-restore saved WWebJS sessions (staggered to save resources)
        const wwebjsDir = path.join(SESSIONS_DIR, 'wwebjs');
        if (fs.existsSync(wwebjsDir)) {
            const wwebFiles = fs.readdirSync(wwebjsDir);
            for (const file of wwebFiles) {
                if (file.startsWith('session-device_')) {
                    const deviceId = file.replace('session-device_', '');
                    // Only auto-restore active device 7 (or devices with valid DB status)
                    if (deviceId === '3') continue; // Skip non-active device 3
                    console.log(`[Auto-Restore] Found saved WWebJS session for Device ${deviceId}. Initializing...`);
                    await new Promise((r) => setTimeout(r, 1000));
                    initWwebjsSession(deviceId).catch((err) => {
                        console.warn(`[Auto-Restore Error] Device ${deviceId}:`, err.message);
                    });
                }
            }
        }
    } catch (err) {
        console.warn('[Auto-Restore Warning]:', err.message);
    }
}

app.listen(PORT, HOST, () => {
    console.log(`🚀 MARDIRA WA Gateway Microservice active on http://${HOST}:${PORT}`);
    console.log(`🔐 Internal Secret Security: Active`);
    console.log(`📡 Dual Engine: Baileys WebSocket + Chromium WWebJS Ready`);

    // Auto-restore any previously paired sessions
    autoRestoreSavedSessions();
});
