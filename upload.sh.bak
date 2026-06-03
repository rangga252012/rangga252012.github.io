#!/bin/bash

# ==============================================================================
# SFA BOT - GITHUB AUTO PUSH SCRIPT (ULTRA SECURE & STABLE EDITION)
# ==============================================================================

C_RED='\033[1;31m'
C_GREEN='\033[1;32m'
C_YELLOW='\033[1;33m'
C_BLUE='\033[1;34m'
C_CYAN='\033[1;36m'
C_WHITE='\033[1;37m'
C_RESET='\033[0m'

log_info() { echo -e "${C_CYAN}[INFO]${C_RESET} $1"; }
log_success() { echo -e "${C_GREEN}[SUCCESS]${C_RESET} $1"; }
log_warning() { echo -e "${C_YELLOW}[WARNING]${C_RESET} $1"; }
log_error() { echo -e "${C_RED}[ERROR]${C_RESET} $1"; }
log_process() { echo -e "${C_BLUE}[PROCESS]${C_RESET} $1"; }

print_banner() {
    clear
    echo -e "${C_GREEN}"
    echo "███████╗███████╗ █████╗     ██████╗  ██████╗ ████████╗"
    echo "██╔════╝██╔════╝██╔══██╗    ██╔══██╗██╔═══██╗╚══██╔══╝"
    echo "███████╗█████╗  ███████║    ██████╔╝██║   ██║   ██║   "
    echo "╚════██║██╔══╝  ██╔══██║    ██╔══██╗██║   ██║   ██║   "
    echo "███████║██║     ██║  ██║    ██████╔╝╚██████╔╝   ██║   "
    echo "╚══════╝╚═╝     ╚═╝  ╚═╝    ╚═════╝  ╚═════╝    ╚═╝   "
    echo -e "======================================================${C_RESET}\n"
    sleep 1
}

check_network() {
    log_process "Menginisiasi tes koneksi..."
    ping -c 2 github.com > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_success "Koneksi stabil."
    else
        log_error "Koneksi terputus!"
        exit 1
    fi
}

setup_git_config() {
    log_process "Menerapkan konfigurasi..."
    
    # DATA ANDA
    local USERNAME="rangga252012"
    local EMAIL="sofyantorangga028@gmail.com"
    local REPO="https://github.com/rangga252012/rangga252012.github.io.git"

    git config --global user.name "$USERNAME"
    git config --global user.email "$EMAIL"
    git config --global core.autocrlf input
    git config --global --add safe.directory '*'
    
    if [ ! -d ".git" ]; then
        git init
        git branch -M main
    fi
    
    if git remote | grep -q "origin"; then
        git remote set-url origin "$REPO"
    else
        git remote add origin "$REPO"
    fi
    log_success "Konfigurasi selesai."
}

stage_and_commit() {
    git add .
    local TIMESTAMP=$(date +'%d-%m-%Y %H:%M:%S')
    local COMMIT_MSG="Update: $TIMESTAMP"
    git commit -m "$COMMIT_MSG" > /dev/null 2>&1
    log_success "File siap diunggah."
}

push_to_server() {
    echo -e "\n${C_YELLOW}[!] Masukkan username: rangga252012${C_RESET}"
    echo -e "${C_YELLOW}[!] Masukkan password: (PASTE TOKEN PAT ANDA)${C_RESET}\n"
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo -e "\n${C_GREEN}[✓] UPLOAD SUKSES TOTAL!${C_RESET}"
    else
        echo -e "\n${C_RED}[X] UPLOAD GAGAL!${C_RESET}"
    fi
}

main() {
    print_banner
    check_network
    setup_git_config
    stage_and_commit
    push_to_server
}

main
