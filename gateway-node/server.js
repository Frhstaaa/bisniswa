/**
 * WhatsApp Gateway Microservice (Single-Engine: whatsapp-web.js)
 * BisnisWA — High Performance Chromium WhatsApp Web Engine
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const axios = require('axios');
const { Client, LocalAuth, MessageMedia, Poll } = require('whatsapp-web.js');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';
const LARAVEL_URL = process.env.LARAVEL_URL || 'http://127.0.0.1:8001';

// Base directory for auth sessions
const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}
const WWEBJS_DIR = path.join(SESSIONS_DIR, 'wwebjs');
if (!fs.existsSync(WWEBJS_DIR)) {
    fs.mkdirSync(WWEBJS_DIR, { recursive: true });
}

// In-memory store for active sessions
// Map<string, { client, status, qr, phoneNumber, deviceId, keepAliveTimer }>
const activeSessions = new Map();

// Internal security token validation
let rootSecret = process.env.INTERNAL_SECRET;
if (!rootSecret) {
    try {
        const envPath = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/INTERNAL_SECRET=([^\r\n]+)/);
            if (match && match[1]) {
                rootSecret = match[1].trim();
            }
        }
    } catch (e) {}
}
const INTERNAL_SECRET = rootSecret || 'internal_secret_token';

// Persistent WhatsApp LID -> Phone mapping store
const LID_MAP_FILE = path.join(__dirname, 'lid_map.json');
let lidPhoneMap = new Map();

function loadLidMappings() {
    try {
        if (fs.existsSync(LID_MAP_FILE)) {
            const data = JSON.parse(fs.readFileSync(LID_MAP_FILE, 'utf8'));
            lidPhoneMap = new Map(Object.entries(data));
            console.log(`[LID Store] Loaded ${lidPhoneMap.size} LID-to-phone mappings from disk.`);
        }
    } catch (e) {
        console.warn('[LID Store Load Error]', e.message);
    }
}

function saveLidMapping(lid, phone) {
    if (!lid || !phone) return;
    const cleanLid = String(lid).replace(/[^0-9]/g, '');
    let cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('+')) cleanPhone = '+' + cleanPhone;

    if (cleanLid && cleanPhone && !lidPhoneMap.has(cleanLid)) {
        lidPhoneMap.set(cleanLid, cleanPhone);
        try {
            const obj = Object.fromEntries(lidPhoneMap);
            fs.writeFileSync(LID_MAP_FILE, JSON.stringify(obj, null, 2));
            console.log(`[LID Cache Saved] ${cleanLid} -> ${cleanPhone}`);
        } catch (e) {}
    }
}

function getPhoneByLid(lid) {
    if (!lid) return null;
    const cleanLid = String(lid).replace(/[^0-9]/g, '');
    return lidPhoneMap.get(cleanLid) || null;
}

loadLidMappings();

// Deduplication cache for incoming messages
const recentMsgIds = new Set();
function isDuplicateInbound(msgId) {
    if (!msgId) return false;
    if (recentMsgIds.has(msgId)) return true;
    recentMsgIds.add(msgId);
    setTimeout(() => recentMsgIds.delete(msgId), 30000);
    return false;
}

function extractCleanPhone(jid) {
    if (!jid) return null;
    const clean = String(jid).split('@')[0].replace(/[^0-9]/g, '');
    if (!clean) return null;
    return '+' + clean;
}

/**
 * Format recipient number to WhatsApp JID for whatsapp-web.js
 * E.g. '08386012467' -> '628386012467@c.us'
 */
function formatRecipientJid(to) {
    let rawStr = String(to || '').trim();
    let clean = rawStr.replace(/[^0-9]/g, '');

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

    return `${clean}@c.us`;
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
        if (err.response && err.response.status === 404) {
            console.warn(`[Device Removed] Device ${deviceId} not found in Laravel. Stopping session.`);
            const sessionId = `device_${deviceId}`;
            const session = activeSessions.get(sessionId);
            if (session) {
                session.isDestroyed = true;
                if (session.client) {
                    try {
                        session.client.destroy();
                    } catch (e) {}
                }
            }
            activeSessions.delete(sessionId);
            return;
        }
        console.warn(`[Webhook Notice] Device ${deviceId} status update: ${err.message}`);
    }
}

// Security Middleware
app.use((req, res, next) => {
    if (req.path === '/health') return next();

    const token = req.headers['x-internal-secret'];
    if (token !== INTERNAL_SECRET) {
        return res.status(403).json({ error: 'Forbidden: Invalid internal secret token.' });
    }
    next();
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        engine: 'wwebjs',
        active_sessions: activeSessions.size,
        engines_supported: ['wwebjs'],
        timestamp: new Date().toISOString(),
    });
});

/**
 * Initialize a device session using whatsapp-web.js
 */
app.post('/sessions/init', async (req, res) => {
    const { device_id } = req.body;
    if (!device_id) {
        return res.status(400).json({ error: 'device_id is required' });
    }

    const sessionId = `device_${device_id}`;
    let existing = activeSessions.get(sessionId);

    if (existing && existing.status === 'connected') {
        return res.json({
            status: 'connected',
            device_id,
            engine: 'wwebjs',
            phone_number: existing.phoneNumber,
        });
    }

    if (existing && existing.qr && existing.status === 'qr_ready') {
        return res.json({
            status: 'qr_ready',
            device_id,
            engine: 'wwebjs',
            qr: existing.qr,
        });
    }

    try {
        await initWwebjsSession(device_id);

        let attempts = 0;
        while (attempts < 24) {
            const current = activeSessions.get(sessionId);
            if (current && (current.qr || current.status === 'connected')) {
                return res.json({
                    status: current.status,
                    device_id,
                    engine: 'wwebjs',
                    qr: current.qr,
                    phone_number: current.phoneNumber,
                });
            }
            await new Promise((resolve) => setTimeout(resolve, 250));
            attempts++;
        }

        const fallback = activeSessions.get(sessionId);
        return res.json({
            status: fallback?.status || 'initializing',
            device_id,
            engine: 'wwebjs',
            qr: fallback?.qr || null,
            phone_number: fallback?.phoneNumber || null,
        });
    } catch (err) {
        console.error(`Failed to init session for Device ${device_id}:`, err);
        return res.status(500).json({ error: err.message });
    }
});

/**
 * Helper: Clean up Chromium locks and dead browser instances
 */
async function cleanupWwebjsBrowser(deviceId) {
    const sessionId = `device_${deviceId}`;
    const session = activeSessions.get(sessionId);

    if (session && session.keepAliveTimer) {
        clearInterval(session.keepAliveTimer);
        session.keepAliveTimer = null;
    }

    if (session && session.client) {
        try {
            await session.client.destroy();
        } catch (e) {}
    }

    // Remove stale Chromium Singleton locks if any
    const sessionPath = path.join(WWEBJS_DIR, `session-device_${deviceId}`);
    if (fs.existsSync(sessionPath)) {
        const lockFiles = ['SingletonLock', 'SingletonCookie', 'SingletonSocket'];
        for (const lock of lockFiles) {
            const p = path.join(sessionPath, lock);
            try {
                if (fs.existsSync(p)) fs.unlinkSync(p);
            } catch (e) {}
        }
    }
}

/**
 * ============================================================================
 * SINGLE ENGINE: whatsapp-web.js (Headless Chromium via LocalAuth)
 * ============================================================================
 */
async function initWwebjsSession(deviceId) {
    const sessionId = `device_${deviceId}`;

    await cleanupWwebjsBrowser(deviceId);

    const client = new Client({
        authStrategy: new LocalAuth({
            clientId: sessionId,
            dataPath: WWEBJS_DIR,
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
        const rawUser = client.info?.wid?.user || '';
        let phone = rawUser ? rawUser.replace(/[^0-9]/g, '') : null;
        if (phone && !phone.startsWith('+')) phone = '+' + phone;

        console.log(`[WWebJS Connected] Device ${deviceId} Phone: ${phone || 'Unknown'}`);
        sessionData.status = 'connected';
        sessionData.qr = null;
        sessionData.phoneNumber = phone;

        notifyLaravelStatus(deviceId, {
            status: 'connected',
            ...(phone ? { phone_number: phone } : {}),
            qr_code: null,
        });

        // Proactive keep-alive heartbeat every 15s to maintain frame and auto-recover
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

        if (rawSender?.endsWith('@c.us')) {
            resolvedPhone = extractCleanPhone(rawSender);
            try {
                if (typeof client.getContactLidAndPhone === 'function') {
                    client.getContactLidAndPhone([rawSender]).then((results) => {
                        if (results && results.length > 0 && results[0].lid && results[0].pn) {
                            saveLidMapping(results[0].lid, resolvedPhone);
                        }
                    }).catch(() => {});
                }
            } catch (e) {}
        } else if (rawSender?.endsWith('@lid') || (!rawSender?.endsWith('@c.us') && !rawSender?.endsWith('@g.us'))) {
            const cachedPhone = getPhoneByLid(rawSender);
            if (cachedPhone) {
                resolvedPhone = cachedPhone;
                console.log(`[WWebJS LID Hit] Mapped ${rawSender} -> ${resolvedPhone}`);
            } else {
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
                    } catch (cErr) {}
                }
            }
        }

        if (!resolvedPhone) {
            resolvedPhone = extractCleanPhone(rawSender);
        }

        let text = msg.body || '';
        let mediaUrl = null;

        if (msg.hasMedia) {
            try {
                const media = await msg.downloadMedia();
                if (media) {
                    const ext = media.mimetype ? media.mimetype.split('/')[1]?.split(';')[0] || 'bin' : 'bin';
                    const filename = `media_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                    const mediaDir = path.resolve(__dirname, '../public/uploads/whatsapp');
                    if (!fs.existsSync(mediaDir)) {
                        fs.mkdirSync(mediaDir, { recursive: true });
                    }
                    fs.writeFileSync(path.join(mediaDir, filename), Buffer.from(media.data, 'base64'));
                    mediaUrl = `${LARAVEL_URL}/uploads/whatsapp/${filename}`;
                }
            } catch (mediaErr) {
                console.warn(`[WWebJS Media Download Err]`, mediaErr.message);
            }
        }

        try {
            await axios.post(`${LARAVEL_URL}/api/internal/messages/inbound`, {
                device_id: deviceId,
                from: resolvedPhone,
                text,
                media_url: mediaUrl,
                raw_payload: {
                    id: msg.id?._serialized,
                    from: msg.from,
                    sender_jid: rawSender,
                    type: msg.type,
                    timestamp: msg.timestamp,
                },
            }, {
                headers: { 'X-Internal-Secret': INTERNAL_SECRET },
                timeout: 5000,
            });
            console.log(`[Inbound Message] From ${resolvedPhone} forwarded to Laravel`);
        } catch (err) {
            console.error(`[Inbound Error] Failed to forward to Laravel:`, err.message);
        }
    };

    client.on('message', handleIncomingWWebJSMessage);
    client.on('message_create', handleIncomingWWebJSMessage);

    client.on('disconnected', async (reason) => {
        console.warn(`[WWebJS Disconnected] Device ${deviceId}:`, reason);
        sessionData.status = 'disconnected';
        sessionData.qr = null;
        if (sessionData.keepAliveTimer) {
            clearInterval(sessionData.keepAliveTimer);
            sessionData.keepAliveTimer = null;
        }
        notifyLaravelStatus(deviceId, { status: 'disconnected', qr_code: null });
        await cleanupWwebjsBrowser(deviceId);
    });

    client.initialize().catch((err) => {
        console.error(`[WWebJS Init Failed] Device ${deviceId}:`, err);
    });
}

/**
 * Route: Check Session Status
 */
app.get('/sessions/status', async (req, res) => {
    const { device_id } = req.query;
    if (!device_id) {
        return res.status(400).json({ error: 'device_id is required' });
    }

    const sessionId = `device_${device_id}`;
    let session = activeSessions.get(sessionId);

    if (!session) {
        const wwebPath = path.join(WWEBJS_DIR, `session-device_${device_id}`);
        if (fs.existsSync(wwebPath)) {
            initWwebjsSession(device_id).catch(() => {});
            session = activeSessions.get(sessionId);
        }
    }

    if (!session) {
        return res.json({
            status: 'disconnected',
            device_id,
            engine: 'wwebjs',
            qr: null,
            phone_number: null,
        });
    }

    return res.json({
        status: session.status,
        device_id,
        engine: 'wwebjs',
        qr: session.qr,
        phone_number: session.phoneNumber,
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
        await cleanupWwebjsBrowser(device_id);
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
    const { device_id, to, message, media_url, poll_options, poll_title } = req.body;
    const sessionId = `device_${device_id}`;
    let session = activeSessions.get(sessionId);

    // If session not in memory but session folder exists on disk, auto-restore
    if (!session || !session.client) {
        const wwebPath = path.join(WWEBJS_DIR, `session-device_${device_id}`);
        if (fs.existsSync(wwebPath)) {
            console.log(`[Auto-Restore] Restoring WWebJS session for Device ${device_id}...`);
            await initWwebjsSession(device_id);
            let waits = 0;
            while (waits < 30) {
                session = activeSessions.get(sessionId);
                if (session && session.status === 'connected' && session.client) break;
                await new Promise((r) => setTimeout(r, 500));
                waits++;
            }
        }
    }

    const jid = formatRecipientJid(to);
    console.log(`[Dispatch Message] Device ${device_id} (wwebjs) -> To: ${to} (JID: ${jid}) | Length: ${message?.length || 0} | Poll: ${poll_options?.length || 0}`);

    const messageId = `MSG_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    if (session && session.status === 'connected' && session.client) {
        try {
            let sent;
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

            const realId = sent?.id?._serialized || sent?.id?.id || messageId;
            console.log(`[Send Success] Real WWebJS message dispatched to ${jid}, ID: ${realId}`);

            if (sent?.to && sent?.to.endsWith('@lid')) {
                saveLidMapping(sent.to, to);
                console.log(`[LID Cached on Send] ${sent.to} <=> ${to}`);
            }

            return res.json({
                success: true,
                message_id: realId,
                engine_used: 'wwebjs',
                status: 'delivered',
            });
        } catch (err) {
            console.error(`[WWebJS Send Error] ${err.message}`);
            return res.status(500).json({
                success: false,
                error: err.message,
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
        if (fs.existsSync(WWEBJS_DIR)) {
            const wwebFiles = fs.readdirSync(WWEBJS_DIR);
            for (const file of wwebFiles) {
                if (file.startsWith('session-device_')) {
                    const deviceId = file.replace('session-device_', '');
                    if (deviceId === '3') continue; // Skip obsolete test device
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
    console.log(`🚀 BisnisWA WhatsApp Gateway Microservice active on http://${HOST}:${PORT}`);
    console.log(`🔐 Internal Secret Security: Active`);
    console.log(`✨ Single Engine: whatsapp-web.js (Chromium Headless) Ready`);

    autoRestoreSavedSessions();
});
