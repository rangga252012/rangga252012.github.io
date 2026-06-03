/**
 * ============================================================================
 * MAIN APPLICATION SCRIPT - WHATSAPP BOT (STABLE & ANTI-CRASH EDITION)
 * Didesain khusus untuk operasi 24/7 tanpa memory leak.
 * ============================================================================
 */

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    Browsers,
    makeCacheableSignalKeyStore,
    isJidBroadcast
} = require('@adiwajshing/baileys');

const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache');

// ============================================================================
// 1. IMPORT KONFIGURASI & KONTROLER EKSTERNAL
// Sesuai dengan struktur folder yang sudah kita tata
// ============================================================================
let config;
try {
    config = require('./config/config.json');
} catch (error) {
    console.warn('⚠️ File config.json belum ada di folder config/. Memakai pengaturan default sementara.');
    config = { prefix: '!' }; // Fallback jika belum dibuat
}

// Handler pesan akan di-load dari file eksternal (controller)
let messageHandler;
try {
    messageHandler = require('./controllers/messageHandler');
} catch (error) {
    console.warn('⚠️ File controllers/messageHandler.js belum siap. Pesan tidak akan direspon sementara waktu.');
}

// ============================================================================
// 2. KONFIGURASI CACHE & LOGGER
// ============================================================================

// Logger menggunakan pino, diset ke level 'info' agar terminal tidak banjir log sampah
const logger = pino({ level: 'info' });

// NodeCache untuk menyimpan counter retry pesan (mencegah spam request saat error)
const msgRetryCounterCache = new NodeCache({
    stdTTL: 100,
    checkperiod: 20,
    useClones: false
});

// Direktori untuk menyimpan sesi login (JANGAN DIHAPUS MANUAL KECUALI ERROR)
const AUTH_DIR = path.join(__dirname, 'auth_info');
if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// ============================================================================
// 3. PENGELOLAAN MEMORI (IN-MEMORY STORE)
// Menyimpan riwayat chat sementara untuk merespon pesan dengan cepat
// ============================================================================

const store = makeInMemoryStore({
    logger: pino().child({ level: 'silent', stream: 'store' })
});

const STORE_PATH = path.join(__dirname, 'baileys_store_multi.json');
store.readFromFile(STORE_PATH);

// Simpan store secara berkala setiap 10 detik agar data tidak hilang saat restart
setInterval(() => {
    try {
        store.writeToFile(STORE_PATH);
    } catch (err) {
        logger.error('Gagal menyimpan bailey store ke disk:', err.message);
    }
}, 10000);

// ============================================================================
// 4. FUNGSI UTAMA: KONEKSI KE WHATSAPP (AUTO-RECONNECT LOGIC)
// ============================================================================

async function connectToWhatsApp() {
    logger.info('Mempersiapkan mesin Bot WhatsApp...');

    try {
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        const { version, isLatest } = await fetchLatestBaileysVersion();
        
        logger.info(`Memakai WA versi v${version.join('.')}, isLatest: ${isLatest}`);

        const sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: true,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            browser: Browsers.macOS('Desktop'),
            msgRetryCounterCache,
            generateHighQualityLinkPreview: true,
            // Fungsi ini berguna agar bot mengenali pesan yang baru di-load
            getMessage: async (key) => {
                if (store) {
                    const msg = await store.loadMessage(key.remoteJid, key.id);
                    return msg?.message || undefined;
                }
                return { conversation: 'Sedang memuat pesan...' };
            },
            // Menambal bug pesan tombol/list di WA versi terbaru
            patchMessageBeforeSending: (message) => {
                const requiresPatch = !!(
                    message.buttonsMessage ||
                    message.templateMessage ||
                    message.listMessage
                );
                if (requiresPatch) {
                    message = {
                        viewOnceMessage: {
                            message: {
                                messageContextInfo: {
                                    deviceListMetadataVersion: 2,
                                    deviceListMetadata: {},
                                },
                                ...message,
                            },
                        },
                    };
                }
                return message;
            }
        });

        // Binding event emitter ke in-memory store
        store.bind(sock.ev);

        // ============================================================================
        // 5. PENANGANAN KONEKSI (RECONNECT REASONING)
        // Kunci utama kestabilan bot ada di fungsi ini
        // ============================================================================
        
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                logger.info('Scan QR Code di atas menggunakan aplikasi WhatsApp Anda!');
            }

            if (connection === 'close') {
                const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
                logger.warn(`Koneksi terputus. Kode alasan: ${reason}`);

                switch (reason) {
                    case DisconnectReason.badSession:
                        logger.error('Sesi buruk. Folder auth_info rusak. Tolong hapus foldernya dan scan QR lagi.');
                        process.exit(1);
                        break;
                    case DisconnectReason.connectionClosed:
                        logger.warn('Koneksi ditutup secara sepihak. Menghubungkan ulang...');
                        connectToWhatsApp();
                        break;
                    case DisconnectReason.connectionLost:
                        logger.warn('Koneksi internet hilang. Menghubungkan ulang...');
                        connectToWhatsApp();
                        break;
                    case DisconnectReason.connectionReplaced:
                        logger.error('Sesi ini ditimpa oleh sesi lain. Matikan bot yang jalan di tempat lain.');
                        process.exit(1);
                        break;
                    case DisconnectReason.loggedOut:
                        logger.error('Perangkat dikeluarkan dari WhatsApp. Hapus auth_info dan scan ulang.');
                        process.exit(1);
                        break;
                    case DisconnectReason.restartRequired:
                        logger.info('WhatsApp meminta restart sistem. Melakukan restart...');
                        connectToWhatsApp();
                        break;
                    case DisconnectReason.timedOut:
                        logger.warn('Waktu koneksi habis (Timeout). Menghubungkan ulang...');
                        connectToWhatsApp();
                        break;
                    default:
                        logger.error(`Diskoneksi tak terduga (Kode: ${reason}). Memaksa menghubungkan ulang...`);
                        connectToWhatsApp();
                        break;
                }
            } else if (connection === 'open') {
                logger.info('✅ BOT BERHASIL TERHUBUNG KE WHATSAPP!');
                // Bersihkan cache retry jika koneksi sukses agar hemat RAM
                msgRetryCounterCache.flushAll();
            }
        });

        // ============================================================================
        // 6. UPDATE CREDENTIALS LOGIC
        // ============================================================================
        
        sock.ev.on('creds.update', saveCreds);

        // ============================================================================
        // 7. MESSAGE ROUTING (MENERIMA PESAN MASUK)
        // ============================================================================
        
        sock.ev.on('messages.upsert', async (m) => {
            try {
                const msg = m.messages[0];
                
                // Abaikan pesan dari sistem, dari diri sendiri, atau broadcast status WA
                if (!msg.message) return;
                if (msg.key.fromMe) return;
                if (isJidBroadcast(msg.key.remoteJid)) return;

                // Jika controller belum siap, batalkan eksekusi
                if (!messageHandler || typeof messageHandler.handle !== 'function') {
                    return;
                }

                // Lemparkan pesan kotor ke file controller untuk diproses
                // Ini bikin app.js tetap bersih dari if-else chat bot
                await messageHandler.handle(sock, msg, store);

            } catch (error) {
                logger.error('Terjadi error saat memproses pesan:', error);
            }
        });

        return sock;

    } catch (error) {
        logger.fatal('GAGAL TOTAL saat merakit mesin bot:', error);
    }
}

// ============================================================================
// 8. SISTEM ANTI-CRASH (ERROR CATCHER TINGKAT DEWA)
// Mencegah server mati mendadak jika ada error sepele di dalam kode
// ============================================================================

process.on('uncaughtException', function (err) {
    console.error('\n[🚨 ANTI-CRASH] Tertangkap Uncaught Exception:');
    console.error(err);
    console.error('Server tetap berjalan dan tidak dimatikan.\n');
});

process.on('unhandledRejection', function (reason, promise) {
    console.error('\n[🚨 ANTI-CRASH] Unhandled Rejection pada Promise:');
    console.error(promise);
    console.error('Alasan:', reason);
    console.error('Server tetap berjalan dan tidak dimatikan.\n');
});

// ============================================================================
// 9. MONITORING PENGGUNAAN RAM OTOMATIS
// ============================================================================
setInterval(() => {
    const memoryData = process.memoryUsage();
    const memoryUsageMB = Math.round((memoryData.rss / 1024 / 1024) * 100) / 100;
    
    // Memberi peringatan log jika penggunaan memori mendekati batas rawan (misal 500MB)
    if (memoryUsageMB > 500) {
        logger.warn(`⚠️ PERINGATAN MEMORI: Bot memakai ${memoryUsageMB} MB RAM. Pertimbangkan untuk merestart sistem.`);
    }
}, 60000); // Cek setiap 1 menit

// ============================================================================
// 10. GRACEFUL SHUTDOWN HANDLER
// Mencegah file korup jika server dimatikan secara manual (Ctrl + C)
// ============================================================================
function gracefulShutdown() {
    logger.info('\nMemulai proses pemadaman mesin yang aman...');
    try {
        if (store) {
            store.writeToFile(STORE_PATH);
            logger.info('Data memori sukses disimpan sebelum mati.');
        }
    } catch (e) {
        logger.error('Gagal menyimpan memori saat shutdown:', e);
    }
    logger.info('Server dimatikan. Sampai jumpa!');
    process.exit(0);
}

process.on('SIGINT', gracefulShutdown); // Ctrl+C
process.on('SIGTERM', gracefulShutdown); // Kill command

// ============================================================================
// EKSEKUSI UTAMA
// ============================================================================
connectToWhatsApp();
