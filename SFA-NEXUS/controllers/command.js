/**
 * ============================================================================
 * SFA-NEXUS - COMMAND CENTER (THE BRAIN) V2 [MEDIA EDITION]
 * Didesain khusus untuk SaaS Multi-Tenant. 
 * Menyortir perintah dan merespon dengan media (Gambar/GIF) secara elegan.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const pino = require('pino');
const logger = pino({ level: 'info' });

// ============================================================================
// 1. URL MEDIA DEFAULT (BISA LU GANTI NANTI SAMA LINK FOTO LU/GIF)
// ============================================================================
// Pake link telegra.ph atau link gambar langsung (jpg/png)
const DEFAULT_IMAGE_URL = 'https://telegra.ph/file/8c24f603cde0886bd7a1c.jpg'; 
const DEFAULT_GIF_URL = 'https://telegra.ph/file/c82dbdb6b5b9e07f6e8cc.mp4'; // Di WA, GIF itu aslinya MP4 yang di-loop

// ============================================================================
// 2. FUNGSI ALAT BANTU (HELPERS) KHUSUS COMMAND
// ============================================================================

// Mengecek apakah pengirim adalah Admin di grup tersebut
async function checkAdmin(sock, msg, senderId, groupId) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const participants = groupMetadata.participants;
        const adminList = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.id);
        return adminList.includes(senderId);
    } catch (error) {
        logger.error(`Gagal mengecek admin di grup ${groupId}`, error);
        return false;
    }
}

// Fungsi pengiriman teks biasa
async function reply(sock, msg, text) {
    await sock.sendMessage(msg.key.remoteJid, { text: text }, { quoted: msg });
}

// Fungsi pengiriman dengan Gambar atau GIF (Anti-Crash Fallback)
async function replyMedia(sock, msg, text, type = 'image') {
    try {
        // Biar keliatan ngetik & nge-upload media
        await sock.sendPresenceUpdate('composing', msg.key.remoteJid);
        
        if (type === 'gif') {
            await sock.sendMessage(msg.key.remoteJid, {
                video: { url: DEFAULT_GIF_URL },
                gifPlayback: true, // Ini yang bikin videonya jadi GIF muter-muter tanpa suara di WA
                caption: text
            }, { quoted: msg });
        } else {
            await sock.sendMessage(msg.key.remoteJid, {
                image: { url: DEFAULT_IMAGE_URL },
                caption: text
            }, { quoted: msg });
        }
    } catch (error) {
        logger.warn('⚠️ Gagal mengirim media (mungkin koneksi lemot). Mengubah ke mode teks biasa...');
        // Fallback: Kalau gambar gagal di-load, kirim teksnya aja biar gak error
        await reply(sock, msg, text);
    }
}

// ============================================================================
// 3. EKSEKUSI PERINTAH UTAMA
// ============================================================================
module.exports = {
    async execute(ctx) {
        const { sock, msg, sender, senderId, isGroup, isOwner, pushName, args, fullArgs, prefix, command, config, db, DB_PATH } = ctx;

        // Mengecek status grup di database
        let groupData = null;
        if (isGroup) {
            groupData = db.registeredGroups.find(g => g.id === sender);
        }

        const isRegisteredGroup = !!groupData;
        const isAdmin = isGroup ? await checkAdmin(sock, msg, senderId, sender) : false;

        // ============================================================================
        // 4. MENU & PENDAFTARAN 
        // ============================================================================
        switch (command) {
            
            case 'menu':
            case 'help':
                let menuText = `🌟 *SFA-NEXUS SAAS PORTAL* 🌟\n\n`;
                menuText += `Halo ${pushName}! SFA-NEXUS adalah bot premium multi-fungsi.\n\n`;

                if (isGroup && !isRegisteredGroup) {
                    menuText += `⚠️ *GRUP INI BELUM TERDAFTAR*\n`;
                    menuText += `Admin grup WAJIB mendaftarkan grup ini agar bot tidak keluar otomatis.\n\n`;
                    menuText += `*Cara Daftar (Hanya Admin):*\n`;
                    menuText += `Ketik: ${prefix}register <Pilihan Mode>\n\n`;
                    menuText += `*Pilihan Mode yang Tersedia:*\n`;
                    menuText += `1. *AI* (Fokus untuk edukasi & asisten pintar)\n`;
                    menuText += `2. *GUARD* (Fokus jaga grup, anti-link, kick, dll)\n`;
                    menuText += `3. *FUN* (Fokus mainan, stiker, hiburan)\n`;
                    menuText += `4. *ALL* (Paket komplit, harga sewa disesuaikan)\n`;
                } else if (isGroup && isRegisteredGroup) {
                    menuText += `✅ *GRUP TERDAFTAR (Mode: ${groupData.mode})*\n\n`;
                    if (groupData.mode === 'AI' || groupData.mode === 'ALL') {
                        menuText += `🤖 *Menu AI*\n- ${prefix}ai <pertanyaan>\n- ${prefix}gemini <pertanyaan>\n\n`;
                    }
                    if (groupData.mode === 'FUN' || groupData.mode === 'ALL') {
                        menuText += `🎮 *Menu Fun & Media*\n- ${prefix}sticker (Balas gambar)\n- ${prefix}meme\n\n`;
                    }
                    if (groupData.mode === 'GUARD' || groupData.mode === 'ALL') {
                        menuText += `🛡️ *Menu Guard (Admin)*\n- ${prefix}kick @user\n- ${prefix}antilink on/off\n\n`;
                    }
                } else {
                    menuText += `Gunakan bot ini di dalam grup untuk fitur maksimal!\n`;
                    if (isOwner) {
                        menuText += `\n👑 *MENU OWNER*\n- ${prefix}approve <id_grup> <mode>\n- ${prefix}reject <id_grup>\n- ${prefix}listgroup\n`;
                    }
                }
                
                // MENGIRIM MENU DENGAN GIF
                await replyMedia(sock, msg, menuText, 'gif');
                break;

            case 'register':
                if (!isGroup) return replyMedia(sock, msg, config.messages.groupOnly, 'image');
                if (!isAdmin && !isOwner) return replyMedia(sock, msg, config.messages.adminOnly, 'image');
                if (isRegisteredGroup) return replyMedia(sock, msg, `✅ Grup ini sudah terdaftar dengan mode: *${groupData.mode}*`, 'image');

                const requestedMode = args[0] ? args[0].toUpperCase() : null;
                const validModes = ['AI', 'GUARD', 'FUN', 'ALL'];

                if (!requestedMode || !validModes.includes(requestedMode)) {
                    return replyMedia(sock, msg, `❌ Format salah!\n\nKetik: *${prefix}register <mode>*\nPilihan mode: AI, GUARD, FUN, ALL.`, 'image');
                }

                const groupMetadata = await sock.groupMetadata(sender);
                const ownerNumber = `${config.ownerInfo.ownerNumber}@s.whatsapp.net`;
                
                let ticketMsg = `🔔 *PENDAFTARAN GRUP BARU*\n\nNama Grup: ${groupMetadata.subject}\nID Grup: ${sender}\nDiminta Oleh: @${senderId.split('@')[0]}\nMode Diminta: *${requestedMode}*\n\nKetik *${prefix}approve ${sender} ${requestedMode}* untuk menyetujui.`;
                await sock.sendMessage(ownerNumber, { text: ticketMsg, mentions: [senderId] });
                
                await replyMedia(sock, msg, `⏳ Permintaan pendaftaran dengan mode *${requestedMode}* telah dikirim ke Owner (${config.ownerInfo.ownerName}).\n\nMenunggu persetujuan...`, 'image');
                break;

            // ============================================================================
            // 5. MENU KHUSUS OWNER (MANAJEMEN SAAS)
            // ============================================================================
            case 'approve':
                if (!isOwner) return replyMedia(sock, msg, config.messages.ownerOnly, 'image');
                
                const targetGroupId = args[0];
                const targetMode = args[1] ? args[1].toUpperCase() : 'ALL';
                if (!targetGroupId) return replyMedia(sock, msg, `❌ Masukkan ID Grup! Contoh: ${prefix}approve 123456@g.us AI`, 'image');

                const cekGrup = db.registeredGroups.find(g => g.id === targetGroupId);
                if (cekGrup) return replyMedia(sock, msg, `❌ Grup tersebut sudah terdaftar!`, 'image');

                db.registeredGroups.push({ id: targetGroupId, mode: targetMode, approvedAt: new Date().toISOString() });
                fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

                await replyMedia(sock, msg, `✅ Sukses menyetujui grup ${targetGroupId} dengan mode ${targetMode}.`, 'image');
                
                try {
                    await sock.sendMessage(targetGroupId, { 
                        image: { url: DEFAULT_IMAGE_URL },
                        caption: `🎉 *PENDAFTARAN DISETUJUI* 🎉\n\nGrup ini resmi terdaftar di server SFA-NEXUS dengan mode: *${targetMode}*.\nKetik ${prefix}menu untuk melihat fitur.` 
                    });
                } catch (e) {
                    logger.warn(`Gagal mengirim notif ke grup ${targetGroupId}.`);
                }
                break;

            // ============================================================================
            // 6. FITUR BOT
            // ============================================================================
            case 'ai':
            case 'chat':
                if (isGroup && !isRegisteredGroup) return replyMedia(sock, msg, config.messages.unregisteredGroup, 'image');
                if (isGroup && groupData.mode !== 'AI' && groupData.mode !== 'ALL') {
                    return replyMedia(sock, msg, `❌ Fitur AI tidak tersedia di mode grup ini. Hubungi admin untuk upgrade ke mode AI/ALL.`, 'image');
                }
                if (!fullArgs) return replyMedia(sock, msg, `📌 Mau nanya apa? Contoh: ${prefix}ai buatan siapa kamu?`, 'image');
                
                await reply(sock, msg, config.messages.wait);
                
                setTimeout(async () => {
                    await replyMedia(sock, msg, `🤖 *SFA-NEXUS AI:*\n\nSistem AI sedang dalam tahap kalibrasi oleh Owner. Kunci API belum ditanamkan sepenuhnya.`, 'image');
                }, 2000);
                break;

            case 'kick':
                if (!isGroup) return replyMedia(sock, msg, config.messages.groupOnly, 'image');
                if (!isRegisteredGroup) return replyMedia(sock, msg, config.messages.unregisteredGroup, 'image');
                if (groupData.mode !== 'GUARD' && groupData.mode !== 'ALL') return replyMedia(sock, msg, `❌ Fitur Guard tidak tersedia di grup ini.`, 'image');
                if (!isAdmin && !isOwner) return replyMedia(sock, msg, config.messages.adminOnly, 'image');

                const isBotAdmin = await checkAdmin(sock, msg, sock.user.id.split(':')[0] + '@s.whatsapp.net', sender);
                if (!isBotAdmin) return replyMedia(sock, msg, `❌ SFA-NEXUS harus dijadikan Admin Grup terlebih dahulu untuk menendang anggota!`, 'image');

                const mentionedJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                if (mentionedJid.length === 0) return replyMedia(sock, msg, `📌 Tag orang yang mau ditendang!\nContoh: ${prefix}kick @orangnya`, 'image');

                await reply(sock, msg, `🔥 Mengeksekusi pemusnahan target...`);
                for (let target of mentionedJid) {
                    await sock.groupParticipantsUpdate(sender, [target], "remove");
                }
                await replyMedia(sock, msg, `✅ Target berhasil ditendang dari grup!`, 'image');
                break;

            default:
                break;
        }
    }
};
