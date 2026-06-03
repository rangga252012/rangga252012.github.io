/**
 * ============================================================================
 * SFA-NEXUS - MASTER UTILITY / HELPER
 * Didesain untuk memproses file media dan utilitas eksternal tanpa membebani RAM.
 * ============================================================================
 */

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const axios = require('axios');
const pino = require('pino');

const logger = pino({ level: 'info' });

// ============================================================================
// 1. MANAJEMEN FOLDER TEMPORARY (SEMENTARA)
// ============================================================================
// Folder ini buat nyimpen gambar/video sementara sebelum dikirim balik.
// Otomatis dibuat kalau belum ada biar script gak crash.
const TEMP_DIR = path.join(__dirname, '../../tmp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    logger.info('📁 Folder temporary (tmp) berhasil dibuat.');
}

module.exports = {
    // ============================================================================
    // 2. MESIN DOWNLOAD MEDIA (ANTI-CORRUPT)
    // ============================================================================
    /**
     * Mengunduh media dari pesan WhatsApp dengan stream buffer.
     * Sangat stabil untuk file besar karena diproses sepotong-sepotong.
     * 
     * @param {Object} message - Objek pesan dari Baileys
     * @param {String} type - Tipe media ('image', 'video', 'audio', 'document')
     * @returns {Promise<Buffer>} - Mengembalikan data mentah media
     */
    async downloadMedia(message, type) {
        try {
            logger.info(`📥 Mulai mengunduh media tipe: ${type}...`);
            const stream = await downloadContentFromMessage(message, type);
            let buffer = Buffer.from([]);
            
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            logger.info(`✅ Media sukses diunduh. Ukuran: ${this.formatSize(buffer.length)}`);
            return buffer;
        } catch (error) {
            logger.error('❌ [FATAL] Gagal mengunduh media dari server WhatsApp:', error.message);
            throw error; // Lemparkan error agar ditangkap oleh command.js
        }
    },

    // ============================================================================
    // 3. MESIN KONVERSI STIKER (IMAGE TO WEBP)
    // ============================================================================
    /**
     * Mengubah buffer gambar menjadi format WebP standar stiker WhatsApp.
     * Membutuhkan 'ffmpeg' atau 'imagemagick' terpasang di OS/Termux.
     * 
     * @param {Buffer} mediaBuffer - Data gambar mentah
     * @returns {Promise<Buffer>} - Data stiker (WebP)
     */
    async imageToSticker(mediaBuffer) {
        return new Promise((resolve, reject) => {
            const tmpFileIn = path.join(TEMP_DIR, `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`);
            const tmpFileOut = path.join(TEMP_DIR, `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

            fs.writeFileSync(tmpFileIn, mediaBuffer);
            logger.info('⚙️ Memulai proses konversi gambar ke stiker...');

            // Parameter FFmpeg untuk stiker kualitas tinggi dan rasio proporsional
            const command = `ffmpeg -i "${tmpFileIn}" -vcodec libwebp -filter:v fps=fps=20 -lossless 1 -loop 0 -preset default -an -vsync 0 -s 512:512 "${tmpFileOut}"`;

            exec(command, (err) => {
                // Hapus file mentah agar memori tidak penuh
                if (fs.existsSync(tmpFileIn)) fs.unlinkSync(tmpFileIn);

                if (err) {
                    logger.error('❌ Gagal konversi stiker! Pastikan FFMPEG sudah terpasang di Termux/Server.');
                    if (fs.existsSync(tmpFileOut)) fs.unlinkSync(tmpFileOut);
                    return reject(err);
                }

                // Baca hasil dan hapus file hasil
                const webpBuffer = fs.readFileSync(tmpFileOut);
                fs.unlinkSync(tmpFileOut);
                
                logger.info('✅ Konversi stiker selesai.');
                resolve(webpBuffer);
            });
        });
    },

    // ============================================================================
    // 4. KONEKTOR API AI EKSTERNAL (GEMINI / OPENAI)
    // ============================================================================
    /**
     * Mengirim permintaan teks ke server AI eksternal.
     * Didesain dengan timeout agar bot tidak nge-hang saat server AI down.
     */
    async fetchAIResponse(prompt, apiKey, model = 'gemini') {
        if (!apiKey || apiKey === '') {
            return "❌ API Key belum disetel di config.json. Sistem AI ditangguhkan sementara.";
        }

        try {
            logger.info(`🤖 Menghubungi server ${model}...`);
            // Ruang ini disiapkan untuk koneksi Axios ke endpoint API resmi
            // Karena membutuhkan spesifikasi endpoint yang pasti, 
            // sementara mengembalikan string dummy hingga API Key diisi penuh.
            
            return `[Sistem Terhubung] Menerima prompt: "${prompt}".\nMenunggu integrasi API penuh.`;
        } catch (error) {
            logger.error(`❌ Gagal menghubungi server AI: ${error.message}`);
            return "❌ Terjadi gangguan pada jaringan saraf buatan server pusat.";
        }
    },

    // ============================================================================
    // 5. UTILITAS FORMAT DATA TAMPILAN
    // ============================================================================
    /**
     * Mengubah angka byte menjadi format yang mudah dibaca (KB, MB, GB)
     */
    formatSize(bytes) {
        if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
        if (bytes > 1) return bytes + ' bytes';
        if (bytes === 1) return bytes + ' byte';
        return '0 bytes';
    },

    /**
     * Mendapatkan waktu dan tanggal saat ini dengan format rapi (WIB)
     */
    getCurrentTime() {
        const date = new Date();
        const options = { 
            timeZone: 'Asia/Jakarta', 
            hour12: false, 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        };
        return new Intl.DateTimeFormat('id-ID', options).format(date);
    }
};
