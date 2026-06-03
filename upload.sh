#!/bin/bash

# ==============================================================================
# SFA BOT - AUTO PUSH GITHUB (STABLE VERSION - AUTOMATIC AUTH)
# ==============================================================================

C_GREEN='\033[1;32m'
C_RED='\033[1;31m'
C_RESET='\033[0m'

echo -e "${C_GREEN}[*] Memulai proses upload otomatis...${C_RESET}"

# Konfigurasi Identitas
git config --global user.name "rangga252012"
git config --global user.email "sofyantorangga028@gmail.com"
git config --global --add safe.directory '*'

# Reset remote agar bisa dimasukkan link yang sudah ada tokennya
git remote remove origin > /dev/null 2>&1

# Link yang sudah mengandung Token PAT (Jalur pintas agar tidak minta password)
REPO_URL="https://rangga252012:ghp_vTHK1Jxom9kYAgmM4UCoPoEptd1yeQ3miT9g@github.com/rangga252012/rangga252012.github.io.git"

git remote add origin "$REPO_URL"

# Proses Upload
if [ ! -d ".git" ]; then
    git init
    git branch -M main
fi

git add .
git commit -m "Update Otomatis: $(date +'%Y-%m-%d %H:%M:%S')" > /dev/null 2>&1
git push -u origin main

if [ $? -eq 0 ]; then
    echo -e "${C_GREEN}[✓] UPLOAD SUKSES TOTAL!${C_RESET}"
else
    echo -e "${C_RED}[X] UPLOAD GAGAL! Silakan periksa koneksi atau validitas token.${C_RESET}"
fi
