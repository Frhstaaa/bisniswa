/**
 * WhatsApp Gateway Microservice (Pure Baileys Engine)
 * BisnisWA — High Performance WhatsApp WebSocket Native Engine
 * Direct multi-device protocol connection via @whiskeysockets/baileys
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
const {
    useMultiFileAuthState,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    proto,
    downloadMediaMessage,
} = baileys;

const app = express();
app.use(express.json());

// Global Exception & Rejection Handlers
process.on('uncaughtException', (err) => {
    console.error('[Baileys Uncaught Exception]', err?.message || err);
});

process.on('unhandledRejection', (reason) => {
    console.error('[Baileys Unhandled Rejection]', reason?.message || reason);
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';
const LARAVEL_URL = process.env.LARAVEL_URL || 'http://127.0.0.1:8001';

// Base directory for auth sessions
const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

// Internal security token validation
let rootSecret = process.env.INTERNAL_SECRET;
if (!rootSecret) {
    try {
        const envPath = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/^(?:WHATSAPP_NODE_SECRET|INTERNAL_SECRET)=([^\r\n]+)/m);
            if (match && match[1]) {
                rootSecret = match[1].trim().replace(/^['"]|['"]$/g, '');
            }
        }
    } catch (e) {}
}
const INTERNAL_SECRET = rootSecret || 'internal_secret_token';

// In-memory message store for satisfying WhatsApp Signal protocol retry requests (prevents "Menunggu pesan ini...")
const messageStore = new Map();
const MAX_STORED_MESSAGES = 3000;

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

// In-memory store for active sessions
// Map<string, { client, status, qr, phoneNumber, deviceId, isDestroyed }>
const activeSessions = new Map();

// In-memory inbound message deduplication store
const processedInboundIds = new Set();
function isDuplicateInbound(msgId) {
    if (!msgId) return false;
    if (processedInboundIds.has(msgId)) return true;
    processedInboundIds.add(msgId);
    if (processedInboundIds.size > 2000) {
        const first = processedInboundIds.values().next().value;
        processedInboundIds.delete(first);
    }
    return false;
}

// Persistent WhatsApp LID <-> Phone mapping store
const LID_MAP_FILE = path.join(SESSIONS_DIR, 'lid_mappings.json');
const lidToPhoneMap = new Map();
const phoneToLidMap = new Map();

function loadLidMappings() {
    try {
        if (fs.existsSync(LID_MAP_FILE)) {
            const raw = JSON.parse(fs.readFileSync(LID_MAP_FILE, 'utf8'));
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
            fs.writeFileSync(LID_MAP_FILE, JSON.stringify(obj, null, 2), 'utf8');
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

// Initial load of mappings
loadLidMappings();

/**
 * Extract clean E.164 phone number from any JID
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
 * Format recipient number to WhatsApp JID for Baileys
 * E.g. '08386012467' -> '628386012467@s.whatsapp.net'
 */
function formatRecipientJid(to) {
    let rawStr = String(to || '').trim();
    if (rawStr.endsWith('@g.us')) return rawStr;

    let clean = rawStr.replace(/[^0-9]/g, '');

    // Check if the input number is a known WhatsApp LID
    const mappedPhone = getPhoneByLid(clean);
    if (mappedPhone) {
        clean = mappedPhone.replace(/[^0-9]/g, '');
    }

    if (clean.startsWith('0')) {
        clean = '62' + clean.slice(1);
    } else if (!clean.startsWith('62') && clean.length <= 12) {
        clean = '62' + clean;
    }

    return `${clean}@s.whatsapp.net`;
}

/**
 * Helper to determine MIME type from filename or URL
 */
function getMimeType(filePathOrUrl, fallback = 'application/octet-stream') {
    const ext = path.extname(filePathOrUrl.split('?')[0]).toLowerCase();
    const mimeMap = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.mp4': 'video/mp4',
        '.mp3': 'audio/mp3',
        '.ogg': 'audio/ogg',
        '.wav': 'audio/wav',
        '.m4a': 'audio/m4a',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xls': 'application/vnd.ms-excel',
        '.zip': 'application/zip',
        '.txt': 'text/plain',
        '.csv': 'text/csv',
    };
    return mimeMap[ext] || fallback;
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
                    try { session.client.end(); } catch (e) {}
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
        service: 'BisnisWA Baileys Gateway Engine',
        engine: 'baileys',
        uptime: Math.floor(process.uptime()),
        active_sessions: activeSessions.size,
        engines_supported: ['baileys'],
        timestamp: new Date().toISOString(),
    });
});

/**
 * Initialize Baileys Engine Session
 */
async function initBaileysSession(deviceId) {
    const sessionId = `device_${deviceId}`;
    const authPath = path.join(SESSIONS_DIR, `baileys_${deviceId}`);

    // If existing active session is already connected, return it
    const existing = activeSessions.get(sessionId);
    if (existing && existing.status === 'connected' && existing.client) {
        return existing;
    }

    // Clean up previous client socket if reconnecting
    if (existing?.client) {
        try {
            existing.client.end();
        } catch (e) {}
    }

    if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
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
        browser: ['BisnisWA', 'Chrome', '124.0.0.0'],
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
        isDestroyed: false,
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
            const rawPhone = sock.user?.id ? sock.user.id.split(':')[0] : null;
            let phone = rawPhone ? rawPhone.replace(/[^0-9]/g, '') : null;
            if (phone && !phone.startsWith('+')) phone = '+' + phone;

            console.log(`[Baileys Connected] Device ${deviceId} Phone: ${phone || 'Unknown'}`);
            sessionData.status = 'connected';
            sessionData.qr = null;
            sessionData.phoneNumber = phone;

            notifyLaravelStatus(deviceId, {
                status: 'connected',
                ...(phone ? { phone_number: phone } : {}),
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
        // Cache messages for Signal protocol retry requests (preventing "Menunggu pesan ini...")
        for (const msg of messages) {
            if (msg.key?.id && msg.message) {
                storeMessage(msg.key.id, msg.message);
            }
        }

        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.key.fromMe && msg.message) {
                const msgId = msg.key?.id;
                if (isDuplicateInbound(msgId)) continue;

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

                let bodyText = msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    msg.message.imageMessage?.caption ||
                    msg.message.documentMessage?.caption ||
                    msg.message.videoMessage?.caption;

                // Check for interactive poll vote
                if (msg.message.pollUpdateMessage) {
                    bodyText = '[Pilihan Poll Terpilih]';
                }

                if (!bodyText) {
                    bodyText = msg.message.imageMessage ? '[Gambar]' :
                        (msg.message.documentMessage ? '[Dokumen]' :
                            (msg.message.videoMessage ? '[Video]' :
                                (msg.message.audioMessage ? '[Audio]' : '[Pesan]')));
                }

                let mediaUrl = null;
                // Optional download of inbound media if needed
                if (msg.message.imageMessage || msg.message.documentMessage) {
                    try {
                        const buffer = await downloadMediaMessage(
                            msg,
                            'buffer',
                            {},
                            {
                                logger,
                                reuploadRequest: sock.updateMediaMessage,
                            }
                        );
                        if (buffer) {
                            const isDoc = Boolean(msg.message.documentMessage);
                            const originalFileName = msg.message.documentMessage?.fileName;
                            const ext = isDoc ? (originalFileName ? path.extname(originalFileName) : '.pdf') : '.jpg';
                            const filename = `media_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
                            const mediaDir = path.resolve(__dirname, '../public/uploads/whatsapp');
                            if (!fs.existsSync(mediaDir)) {
                                fs.mkdirSync(mediaDir, { recursive: true });
                            }
                            fs.writeFileSync(path.join(mediaDir, filename), buffer);
                            mediaUrl = `${LARAVEL_URL}/uploads/whatsapp/${filename}`;
                        }
                    } catch (downloadErr) {
                        console.warn(`[Baileys Media Download Error]`, downloadErr.message);
                    }
                }

                const pushName = msg.pushName || '';

                notifyLaravelMessage({
                    device_id: deviceId,
                    sender: resolvedPhone,
                    sender_name: pushName,
                    message: bodyText,
                    media_url: mediaUrl,
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
 * Initialize a device session with Baileys engine
 */
app.post('/sessions/init', async (req, res) => {
    const { device_id } = req.body;
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
            engine: 'baileys',
            phone_number: existing.phoneNumber,
        });
    }

    // If session already has an active QR code ready, return it
    if (existing && existing.qr && existing.status === 'qr_ready') {
        return res.json({
            status: 'qr_ready',
            device_id,
            engine: 'baileys',
            qr: existing.qr,
        });
    }

    try {
        await initBaileysSession(device_id);

        // Wait up to 6 seconds for initial QR emission or connection
        let attempts = 0;
        while (attempts < 24) {
            const current = activeSessions.get(sessionId);
            if (current && (current.qr || current.status === 'connected')) {
                return res.json({
                    status: current.status,
                    device_id,
                    engine: 'baileys',
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
            engine: 'baileys',
            qr: current?.qr || null,
        });
    } catch (err) {
        console.error(`[Session Init Error] Device ${device_id}:`, err);
        return res.status(500).json({
            status: 'error',
            error: err.message,
            device_id,
            engine: 'baileys',
        });
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
            engine: 'baileys',
            qr: null,
            phone_number: null,
        });
    }

    return res.json({
        status: session.status,
        device_id,
        engine: 'baileys',
        qr: session.qr,
        phone_number: session.phoneNumber,
    });
});

/**
 * Route: Connect session immediately (Simulated / Fast Connect)
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
        try {
            if (session.client) {
                session.client.end();
            }
        } catch (e) {
            console.warn('Disconnect error:', e.message);
        }
        activeSessions.delete(sessionId);
    }

    notifyLaravelStatus(device_id, { status: 'disconnected', qr_code: null });

    return res.json({
        success: true,
        status: 'disconnected',
        device_id,
    });
});

/**
 * Route: Send WhatsApp Message (Text, Media/Document/PDF/Image, Poll)
 */
app.post('/messages/send', async (req, res) => {
    const {
        device_id,
        to,
        message,
        media_url,
        media_filename,
        poll_options,
        poll_title,
    } = req.body;

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

    const jid = formatRecipientJid(to);
    console.log(`[Dispatch Message] Device ${device_id} (baileys) -> To: ${to} (JID: ${jid}) | Length: ${message?.length || 0} | Media: ${media_url || 'none'} | Poll: ${poll_options?.length || 0}`);

    const fallbackMessageId = `MSG_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    if (session && session.status === 'connected' && session.client) {
        try {
            let sent;

            if (media_url) {
                let localPath = null;
                if (!media_url.startsWith('http://') && !media_url.startsWith('https://') && fs.existsSync(media_url)) {
                    localPath = media_url;
                } else if (media_url.includes('/uploads/')) {
                    const rel = media_url.substring(media_url.indexOf('/uploads/'));
                    const candidate = path.join(__dirname, '..', 'public', rel);
                    if (fs.existsSync(candidate)) localPath = candidate;
                } else if (media_url.includes('/storage/')) {
                    const rel = media_url.substring(media_url.indexOf('/storage/') + 9);
                    const candidate1 = path.join(__dirname, '..', 'public', 'storage', rel);
                    const candidate2 = path.join(__dirname, '..', 'storage', 'app', 'public', rel);
                    if (fs.existsSync(candidate1)) localPath = candidate1;
                    else if (fs.existsSync(candidate2)) localPath = candidate2;
                }

                const mimeType = getMimeType(media_filename || localPath || media_url);
                const isPdfOrDoc = mimeType.includes('pdf') ||
                    mimeType.includes('document') ||
                    mimeType.includes('sheet') ||
                    mimeType.includes('msword') ||
                    mimeType.includes('zip') ||
                    mimeType.includes('text') ||
                    (media_filename && media_filename.match(/\.(pdf|docx?|xlsx?|csv|zip|txt)$/i));

                const isImage = mimeType.startsWith('image/');
                const isVideo = mimeType.startsWith('video/');
                const isAudio = mimeType.startsWith('audio/');

                const mediaSource = localPath ? fs.readFileSync(localPath) : { url: media_url };

                if (isPdfOrDoc) {
                    console.log(`[Baileys Send Document] To: ${jid}, File: ${media_filename || 'document.pdf'}, MIME: ${mimeType}`);
                    sent = await session.client.sendMessage(jid, {
                        document: mediaSource,
                        mimetype: mimeType,
                        fileName: media_filename || path.basename(localPath || media_url) || 'document.pdf',
                        caption: message || '',
                    });
                } else if (isImage) {
                    console.log(`[Baileys Send Image] To: ${jid}, Caption: ${message || ''}`);
                    sent = await session.client.sendMessage(jid, {
                        image: mediaSource,
                        caption: message || '',
                    });
                } else if (isVideo) {
                    console.log(`[Baileys Send Video] To: ${jid}`);
                    sent = await session.client.sendMessage(jid, {
                        video: mediaSource,
                        caption: message || '',
                    });
                } else if (isAudio) {
                    console.log(`[Baileys Send Audio] To: ${jid}`);
                    sent = await session.client.sendMessage(jid, {
                        audio: mediaSource,
                        mimetype: mimeType,
                    });
                } else {
                    // Fallback to document
                    sent = await session.client.sendMessage(jid, {
                        document: mediaSource,
                        mimetype: mimeType,
                        fileName: media_filename || path.basename(localPath || media_url) || 'file.bin',
                        caption: message || '',
                    });
                }
            } else if (message) {
                sent = await session.client.sendMessage(jid, { text: message });
            }

            // Interactive Poll
            if (poll_options && Array.isArray(poll_options) && poll_options.length > 0) {
                try {
                    const pollSent = await session.client.sendMessage(jid, {
                        poll: {
                            name: poll_title || '📋 Silakan Ketuk Pilihan Layanan:',
                            values: poll_options,
                            selectableCount: 1,
                        },
                    });
                    console.log(`[Baileys Poll Success] Poll dispatched to ${jid}`);
                    if (!sent) sent = pollSent;
                } catch (pErr) {
                    console.warn(`[Baileys Poll Warning] ${pErr.message}`);
                }
            }

            const realId = sent?.key?.id || fallbackMessageId;

            // Cache sent message in messageStore for Signal protocol retries
            if (sent?.key?.id && sent?.message) {
                storeMessage(sent.key.id, sent.message);
            }

            console.log(`[Baileys Send Success] Message dispatched to ${jid}, ID: ${realId}`);

            return res.json({
                success: true,
                message_id: realId,
                engine_used: 'baileys',
                status: 'delivered',
            });
        } catch (sendErr) {
            console.error(`[Baileys Send Error] Dispatch error for ${jid}: ${sendErr.message}`);
            return res.status(500).json({
                success: false,
                error: sendErr.message,
                message_id: fallbackMessageId,
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
    } catch (err) {
        console.warn('[Auto-Restore Warning]:', err.message);
    }
}

app.listen(PORT, HOST, () => {
    console.log(`🚀 BisnisWA Gateway Microservice active on http://${HOST}:${PORT}`);
    console.log(`🔐 Internal Secret Security: Active`);
    console.log(`📡 Pure Baileys WebSocket Native Engine Ready`);

    // Auto-restore any previously paired sessions
    autoRestoreSavedSessions();
});
