/**
 * ============================================================================
 * SFA-NEXUS - MASTER MESSAGE HANDLER (CONTROLLER)
 * Didesain khusus untuk menyortir miliaran pesan tanpa delay atau memory leak.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const pino = require('pino');

// Inisialisasi Logger khusus Handler
const logger = pino({ level: 'info' });

// ============================================================================
// 1. MEMUAT KONFIGURASI DAN DATABASE LOKAL
// ============================================================================
const CONFIG_PATH = path.join(__dirname, '../config/config.json');
const DB_PATH = path.join(__dirname, '../database.json');

let config;
try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
} catch (error) {
    logger.error('❌ [FATAL] File config.json tidak terbaca oleh Handler!');
    process.exit(1);
}

// Auto-create database.json jika belum ada (Untuk menyimpan data klien SaaS)
if (!fs.existsSync(DB_PATH)) {
    const defaultDB = {
        registeredGroups: [],
        bannedUsers: [],
        premiumUsers: [],
        usageLimit: {}
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
    logger.info('✅ File database.json berhasil dibuat secara otomatis.');
}

// ============================================================================
// 2. SISTEM KEAMANAN ANTI-SPAM (RATE LIMITER)
// Menyimpan riwayat panggilan per user di memory sementara (RAM)
// ============================================================================
const spamStore = new Map();

function isSpamming(sender) {
    const now = Date.now();
    const spamLimit = config.security.maxSpamLimit || 5; 
    const cooldown = 5000; // 5 Detik cooldown

    if (!spamStore.has(sender)) {
        spamStore.set(sender, { count: 1, lastMsg: now });
        return false;
    }

    const userData = spamStore.get(sender);
    
    // Jika masih dalam masa cooldown
    if (now - userData.lastMsg < cooldown) {
        userData.count += 1;
        if (userData.count >= spamLimit) {
            return true; // Terdeteksi SPAM!
        }
    } else {
        // Reset jika sudah lewat masa cooldown
        userData.count = 1;
        userData.lastMsg = now;
    }
    
    spamStore.set(sender, userData);
    return false;
}

// ============================================================================
// 3. LOGIKA UTAMA PENANGANAN PESAN MASUK
// ============================================================================
module.exports = {
    async handle(sock, msg, store) {
        try {
            // Evaluasi pengirim pesan
            const sender = msg.key.remoteJid;
            const isGroup = sender.endsWith('@g.us');
            const senderId = isGroup ? msg.key.participant : sender;
            const ownerNumber = `${config.ownerInfo.ownerNumber}@s.whatsapp.net`;
            const isOwner = senderId === ownerNumber;

            // Membaca database terkini
            const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

            // [SaaS PROTECT] Validasi Grup Legal
            if (isGroup) {
                const isRegistered = db.registeredGroups.includes(sender);
                // Jika grup tidak terdaftar, dan pesan bukan dari Owner
                if (!isRegistered && !isOwner) {
                    // Batasi aktivitas bot di grup ini (Diam/Ignore)
                    // Nanti sistem Auto-Leave di app.js yang akan mendepak bot keluar.
                    return; 
                }
            }

            // Ekstrak Tipe Pesan (Bisa teks murni, caption gambar, atau balas/reply)
            const type = Object.keys(msg.message)[0];
            let textMessage = '';

            if (type === 'conversation') {
                textMessage = msg.message.conversation;
            } else if (type === 'extendedTextMessage') {
                textMessage = msg.message.extendedTextMessage.text;
            } else if (type === 'imageMessage' && msg.message.imageMessage.caption) {
                textMessage = msg.message.imageMessage.caption;
            } else if (type === 'videoMessage' && msg.message.videoMessage.caption) {
                textMessage = msg.message.videoMessage.caption;
            } else if (type === 'documentMessage' && msg.message.documentMessage.caption) {
                textMessage = msg.message.documentMessage.caption;
            }

            // Bersihkan spasi kosong di awal dan akhir pesan
            textMessage = textMessage.trim();

            // ============================================================================
            // 4. PEMISAHAN PERINTAH DAN ARGUMEN
            // ============================================================================
            const prefix = config.botInfo.prefix;
            const isCommand = textMessage.startsWith(prefix);
            
            // Evaluasi Auto-Read (Bot membaca pesan masuk agar centang biru)
            // Bisa dimatikan jika tidak ingin bot terlihat terlalu fast-respon
            if (isCommand) {
                await sock.readMessages([msg.key]);
            } else {
                // Jika bukan perintah (chat biasa), evaluasi apakah butuh direspon AI (Nanti di command.js)
                // Untuk sekarang, hentikan proses.
                return;
            }

            // Memisahkan kata pertama (Command) dan kata selanjutnya (Argumen)
            const args = textMessage.slice(prefix.length).trim().split(/ +/);
            const command = args.shift().toLowerCase(); // Mengubah command jadi huruf kecil semua
            const fullArgs = args.join(' '); // Argumen utuh berbentuk string

            // ============================================================================
            // 5. DETEKSI SPAM & BANNED USER
            // ============================================================================
            if (db.bannedUsers.includes(senderId)) {
                return; // User diblokir dari sistem, abaikan total.
            }

            if (!isOwner && isSpamming(senderId)) {
                logger.warn(`🚨 [SPAM TERDETEKSI] dari ${senderId}. Memblokir respon sementara.`);
                await sock.sendMessage(sender, { 
                    text: `⚠️ *SISTEM ANTI-SPAM AKTIF*\n\nTerdeteksi pengiriman pesan berlebihan. Harap beri jeda 5 detik antar perintah!` 
                }, { quoted: msg });
                return;
            }

            // ============================================================================
            // 6. VISUALISASI LOG TERMINAL
            // ============================================================================
            const groupName = isGroup ? (await sock.groupMetadata(sender)).subject : 'Private Chat';
            const pushName = msg.pushName || 'Unknown User';
            
            console.log(`\n--------------------------------------------------`);
            console.log(`📩 [CMD] ${prefix}${command}`);
            console.log(`👤 Dari   : ${pushName} (${senderId.split('@')[0]})`);
            console.log(`🏠 Lokasi : ${isGroup ? groupName : 'Private Chat'}`);
            console.log(`--------------------------------------------------\n`);

            // ============================================================================
            // 7. DELEGASI KE COMMAND CONTROLLER
            // ============================================================================
            let commandHandler;
            try {
                commandHandler = require('./command.js');
            } catch (err) {
                logger.error('❌ File controllers/command.js belum dibuat atau rusak!', err.message);
                await sock.sendMessage(sender, { text: config.messages.error }, { quoted: msg });
                return;
            }

            // Siapkan objek context pembungkus agar rapi saat dilempar ke command.js
            const ctx = {
                sock,
                msg,
                store,
                sender,
                senderId,
                isGroup,
                isOwner,
                pushName,
                args,
                fullArgs,
                prefix,
                command,
                config,
                db,
                DB_PATH
            };

            // Jalankan fungsi eksekusi di command.js
            await commandHandler.execute(ctx);

        } catch (error) {
            logger.error('\n❌ [FATAL ERROR DI MESSAGE HANDLER]');
            console.error(error);
        }
    }
};
