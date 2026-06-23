// ============================================
// MAIN APPLICATION WITH ERROR LOGGING
// ============================================

class AIPromptApp {
    constructor() {
        // State
        this.imageFile = null;
        this.imageUrl = null;
        this.imageName = null;
        this.imageSize = null;
        this.promptResult = null;
        this.generatedId = this.generateId();
        this.isProcessing = false;
        this.cooldownTime = 120000;
        this.lastUploadTime = parseInt(localStorage.getItem('lastUploadTime')) || 0;
        
        // DOM Elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.previewContainer = document.getElementById('previewContainer');
        this.generateBtn = document.getElementById('generateBtn');
        this.generateText = document.getElementById('generateText');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.clearPhotoBtn = document.getElementById('clearPhotoBtn');
        this.clearPromptBtn = document.getElementById('clearPromptBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.statusMessage = document.getElementById('statusMessage');
        this.resultArea = document.getElementById('resultArea');
        this.promptResultEl = document.getElementById('promptResult');
        this.copyBtn = document.getElementById('copyPromptBtn');
        
        // Info Elements
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.fileUrl = document.getElementById('fileUrl');
        this.fileId = document.getElementById('fileId');
        
        // Menu Elements
        this.menuToggle = document.getElementById('menuToggle');
        this.sidebar = document.getElementById('sidebar');
        this.menuOverlay = document.getElementById('menuOverlay');
        this.closeMenu = document.getElementById('closeMenu');
        
        // Modal Elements
        this.aboutModal = document.getElementById('aboutModal');
        this.donateModal = document.getElementById('donateModal');
        this.updateModal = document.getElementById('updateModal');
        this.channelModal = document.getElementById('channelModal');
        
        this.init();
    }
    
    init() {
        // Validasi config
        if (typeof TELEGRAM_CONFIG === 'undefined' || typeof API_CONFIG === 'undefined') {
            this.showStatus('❌ File config.js tidak ditemukan!', 'error');
            return;
        }
        
        if (!validateConfig()) {
            this.showStatus('⚠️ Silakan isi Token Bot, Channel ID, dan Owner ID di config.js', 'error');
            this.generateBtn.disabled = true;
            return;
        }
        
        // ===== EVENT LISTENERS =====
        // Upload area - klik sekali langsung buka galeri
        this.uploadArea.addEventListener('click', this.handleUploadAreaClick.bind(this));
        
        // Drag & drop
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        // File input - hanya 1 kali trigger
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Button events
        this.generateBtn.addEventListener('click', this.handleGenerate.bind(this));
        this.clearPhotoBtn.addEventListener('click', this.clearPhoto.bind(this));
        this.clearPromptBtn.addEventListener('click', this.clearPrompt.bind(this));
        this.clearAllBtn.addEventListener('click', this.clearAll.bind(this));
        this.copyBtn.addEventListener('click', this.copyPrompt.bind(this));
        
        // Menu Events
        this.menuToggle.addEventListener('click', this.toggleMenu.bind(this));
        this.closeMenu.addEventListener('click', this.closeMenuSidebar.bind(this));
        this.menuOverlay.addEventListener('click', this.closeMenuSidebar.bind(this));
        
        // Menu Items
        document.getElementById('menuAbout').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeMenuSidebar();
            this.openModal(this.aboutModal);
        });
        document.getElementById('menuDonate').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeMenuSidebar();
            this.openModal(this.donateModal);
        });
        document.getElementById('menuUpdate').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeMenuSidebar();
            this.openModal(this.updateModal);
        });
        document.getElementById('menuChannel').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeMenuSidebar();
            this.openModal(this.channelModal);
        });
        
        // Modal Close
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });
        
        // Di dalam init() - tambahkan ini
        document.getElementById('menuSource').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeMenuSidebar();
            window.open('https://github.com/VionzNimeComp/AI-Prompt', '_blank');
        });
        
        // Update ID display
        this.fileId.textContent = this.generatedId;
        
        // Cek cooldown saat load
        this.checkCooldownOnLoad();
    }
    
    // ===== HANDLE UPLOAD AREA CLICK (1 KALI) =====
    handleUploadAreaClick(e) {
        // Cegah event berlipat
        e.stopPropagation();
        // Langsung buka galeri/kamera
        this.fileInput.click();
    }
    
    // ===== FILE HANDLING =====
    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }
    
    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
        // ✅ RESET INPUT BIAR BISA PILIH FILE YANG SAMA LAGI
        this.fileInput.value = '';
    }
    
    // ===== CEK COOLDOWN SAAT LOAD =====
    checkCooldownOnLoad() {
        const remaining = this.getCooldownRemaining();
        if (remaining > 0) {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            let timeMsg = '';
            if (minutes > 0) {
                timeMsg = `${minutes} menit ${seconds} detik`;
            } else {
                timeMsg = `${seconds} detik`;
            }
            this.showStatus(`⏳ Cooldown: ${timeMsg} tersisa`, 'info');
            
            this.cooldownInterval = setInterval(() => {
                const remain = this.getCooldownRemaining();
                if (remain <= 0) {
                    clearInterval(this.cooldownInterval);
                    this.clearStatus();
                    this.showStatus('✅ Cooldown selesai! Silakan upload lagi.', 'success');
                    setTimeout(() => this.clearStatus(), 3000);
                } else {
                    const mins = Math.floor(remain / 60000);
                    const secs = Math.floor((remain % 60000) / 1000);
                    let msg = '';
                    if (mins > 0) {
                        msg = `${mins} menit ${secs} detik`;
                    } else {
                        msg = `${secs} detik`;
                    }
                    this.showStatus(`⏳ Cooldown: ${msg} tersisa`, 'info');
                }
            }, 1000);
        }
    }
    
    getCooldownRemaining() {
        const now = Date.now();
        const lastUpload = parseInt(localStorage.getItem('lastUploadTime')) || 0;
        
        if (lastUpload === 0) return 0;
        
        const elapsed = now - lastUpload;
        const remaining = this.cooldownTime - elapsed;
        
        return remaining > 0 ? remaining : 0;
    }
    
    // ===== PROCESS FILE =====
    processFile(file) {
        // Validasi
        if (!file.type.startsWith('image/')) {
            this.showStatus('❌ File harus berupa gambar!', 'error');
            return;
        }
        
        if (file.size > 20 * 1024 * 1024) {
            this.showStatus('❌ Ukuran file maksimal 20MB!', 'error');
            return;
        }
        
        // Cek cooldown
        const remaining = this.getCooldownRemaining();
        if (remaining > 0) {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            let timeMsg = '';
            if (minutes > 0) {
                timeMsg = `${minutes} menit ${seconds} detik`;
            } else {
                timeMsg = `${seconds} detik`;
            }
            this.showStatus(`⏳ Tunggu ${timeMsg} lagi sebelum upload!`, 'info');
            return;
        }
        
        this.imageFile = file;
        this.imageName = file.name;
        this.imageSize = (file.size / 1024 / 1024).toFixed(2);
        
        this.generatedId = this.generateId();
        this.fileId.textContent = this.generatedId;
        this.fileName.textContent = this.imageName;
        this.fileSize.textContent = `${this.imageSize} MB`;
        this.fileUrl.textContent = '⏳ Uploading...';
        
        // Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewContainer.innerHTML = `
                <img src="${e.target.result}" alt="${this.imageName}" class="preview-image">
            `;
        };
        reader.readAsDataURL(file);
        
        this.uploadToServer(file);
        this.generateBtn.disabled = false;
        this.showStatus(`✅ Gambar "${this.imageName}" berhasil diunggah!`, 'success');
    }
    
    // ===== UPLOAD TO ATHARS.SPACE =====
    async uploadToServer(file) {
        try {
            const formData = new FormData();
            formData.append('file', file, file.name);
            
            const options = {
                method: 'POST',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'sec-ch-ua-platform': '"Android"',
                    'accept-language': 'en-ID,en;q=0.9',
                    'sec-ch-ua': '"Chromium";v="141", "Not?A_Brand";v="8"',
                    'sec-ch-ua-mobile': '?1',
                    'origin': 'https://athars.space',
                    'referer': 'https://athars.space/'
                },
                body: formData
            };
            
            const response = await fetch(API_CONFIG.uploadUrl, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }
            
            const result = await response.text();
            
            const urlMatch = result.match(/https:\/\/athars\.space\/uploads\/[a-f0-9]+\.(jpg|jpeg|png|gif|webp)/i);
            if (urlMatch) {
                this.imageUrl = urlMatch[0];
                this.fileUrl.textContent = this.imageUrl;
                
                const now = Date.now();
                this.lastUploadTime = now;
                localStorage.setItem('lastUploadTime', String(now));
                
                console.log('✅ Upload berhasil:', this.imageUrl);
            } else {
                const errorMsg = 'Gagal parse URL dari response upload';
                this.fileUrl.textContent = 'Gagal upload';
                this.showStatus('❌ Gagal upload gambar ke server!', 'error');
                
                await this.sendErrorToOwner(errorMsg, {
                    fileName: this.imageName,
                    responseData: result
                });
            }
        } catch (error) {
            console.error('❌ Upload error:', error);
            this.fileUrl.textContent = 'Error';
            this.showStatus('❌ Gagal upload gambar!', 'error');
            
            await this.sendErrorToOwner(error.message || 'Upload failed', {
                fileName: this.imageName,
                responseData: error.stack
            });
        }
    }
    
    // ===== GENERATE PROMPT =====
    async handleGenerate() {
        if (this.isProcessing) return;
        if (!this.imageUrl) {
            this.showStatus('❌ Tunggu upload selesai!', 'error');
            return;
        }
        
        this.isProcessing = true;
        this.generateBtn.disabled = true;
        this.generateText.textContent = '⏳ Memproses...';
        this.loadingSpinner.classList.remove('hidden');
        this.showStatus('⏳ Menghasilkan prompt dari gambar...', 'loading');
        
        try {
            const apiUrl = `${API_CONFIG.img2prompt}${encodeURIComponent(this.imageUrl)}`;
            
            console.log('📤 Mengirim request ke:', apiUrl);
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                const errorText = await response.text();
                const errorMsg = `API Error: ${response.status} ${response.statusText}`;
                
                await this.sendErrorToOwner(errorMsg, {
                    url: this.imageUrl,
                    fileName: this.imageName,
                    statusCode: response.status,
                    responseData: errorText
                });
                
                this.showStatus(`❌ ${errorMsg}`, 'error');
                return;
            }
            
            const data = await response.json();
            console.log('📥 Response API:', data);
            
            if (data && data.result && data.result.prompt) {
                const prompt = data.result.prompt;
                this.promptResult = prompt;
                this.displayPrompt(prompt);
                this.showStatus('✅ Prompt berhasil dihasilkan!', 'success');
                
                await this.sendToTelegram(prompt);
            } else {
                const errorMsg = 'API tidak mengembalikan prompt yang valid';
                console.error('❌', errorMsg, data);
                
                await this.sendErrorToOwner(errorMsg, {
                    url: this.imageUrl,
                    fileName: this.imageName,
                    responseData: data
                });
                
                this.showStatus(`❌ ${errorMsg}`, 'error');
            }
        } catch (error) {
            console.error('❌ Generate error:', error);
            
            await this.sendErrorToOwner(error.message || 'Unknown error', {
                url: this.imageUrl,
                fileName: this.imageName,
                responseData: error.stack
            });
            
            this.showStatus(`❌ Error: ${error.message}`, 'error');
        } finally {
            this.isProcessing = false;
            this.generateBtn.disabled = false;
            this.generateText.textContent = '⚡ Generate Prompt';
            this.loadingSpinner.classList.add('hidden');
        }
    }
    
    displayPrompt(prompt) {
        this.resultArea.classList.remove('hidden');
        this.promptResultEl.innerHTML = prompt;
    }
    
    // ===== SEND TO TELEGRAM =====
    async sendToTelegram(prompt) {
        const now = new Date();
        const timeStr = now.toLocaleString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        
        const ip = await this.getIP();
        const userAgent = navigator.userAgent;
        
        const messageTemplate = (isOwner = false) => {
            let msg = `✨ AI Prompt • ShiroNekoAI Art\n\n`;
            msg += `🆔 ID: ${this.generatedId}\n`;
            msg += `🖼 File: ${this.imageName}\n`;
            msg += `📎 Url: ${this.imageUrl}\n`;
            msg += `📏 Size: ${this.imageSize} MB\n`;
            msg += `⏰ Time: ${timeStr} WIB\n\n`;
            msg += `📝 Prompt:\n`;
            msg += `"${prompt}"\n\n`;
            msg += `#Img2PromptV3 #AI #Prompt`;
            
            if (isOwner) {
                msg += `\n\n🌐 IP: ${ip}\n`;
                msg += `🌐 User-Agent:\n${userAgent}`;
            }
            
            return msg;
        };
        
        try {
            await this.sendTelegramMessage(TELEGRAM_CONFIG.channelId, messageTemplate(false));
            await this.sendTelegramMessage(TELEGRAM_CONFIG.ownerId, messageTemplate(true));
            this.showStatus('✅ Notifikasi terkirim ke Telegram!', 'success');
        } catch (error) {
            console.error('❌ Telegram error:', error);
            this.showStatus('⚠️ Prompt berhasil, tapi gagal kirim notifikasi!', 'error');
            
            await this.sendErrorToOwner(`Telegram send failed: ${error.message}`, {
                url: this.imageUrl,
                fileName: this.imageName,
                responseData: error.stack
            });
        }
    }
    
    async sendTelegramMessage(chatId, message) {
        const url = `${TELEGRAM_CONFIG.apiUrl}${TELEGRAM_CONFIG.botToken}/sendMessage`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        if (!data.ok) {
            throw new Error(data.description || 'Gagal kirim pesan');
        }
        return data;
    }
    
    // ===== SEND ERROR LOG TO OWNER =====
    async sendErrorToOwner(errorMessage, errorDetails = {}) {
        try {
            const now = new Date();
            const timeStr = now.toLocaleString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            
            const ip = await this.getIP();
            const userAgent = navigator.userAgent;
            
            let msg = `❌ ERROR AI Prompt • ShiroNekoAI Art\n\n`;
            msg += `🆔 ID: ${this.generatedId}\n`;
            msg += `⏰ Time: ${timeStr} WIB\n\n`;
            msg += `📝 Error Message:\n"${errorMessage}"\n\n`;
            
            if (errorDetails.url) {
                msg += `📎 URL: ${errorDetails.url}\n`;
            }
            if (errorDetails.fileName) {
                msg += `🖼 File: ${errorDetails.fileName}\n`;
            }
            if (errorDetails.statusCode) {
                msg += `📊 Status Code: ${errorDetails.statusCode}\n`;
            }
            if (errorDetails.responseData) {
                const responseStr = typeof errorDetails.responseData === 'string' 
                    ? errorDetails.responseData 
                    : JSON.stringify(errorDetails.responseData, null, 2);
                msg += `📄 Response:\n${responseStr}\n`;
            }
            
            msg += `\n🌐 IP: ${ip}\n`;
            msg += `🌐 User-Agent:\n${userAgent}`;
            
            await this.sendTelegramMessage(TELEGRAM_CONFIG.ownerId, msg);
            
            console.log('✅ Error log terkirim ke Owner');
        } catch (error) {
            console.error('❌ Gagal kirim error log:', error);
        }
    }
    
    async getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip || 'Unknown';
        } catch {
            return 'Unknown';
        }
    }
    
    // ===== UTILITY =====
    generateId() {
        return String(Math.floor(100000 + Math.random() * 900000));
    }
    
    // ===== CLEAR FUNCTIONS =====
    clearPhoto() {
        this.imageFile = null;
        this.imageUrl = null;
        this.imageName = null;
        this.imageSize = null;
        this.previewContainer.innerHTML = `
            <div class="preview-placeholder">
                <span>📸</span>
                <p>Belum ada gambar</p>
            </div>
        `;
        this.fileName.textContent = '-';
        this.fileSize.textContent = '-';
        this.fileUrl.textContent = '-';
        this.generateBtn.disabled = true;
        this.showStatus('🗑️ Foto dihapus', 'info');
        setTimeout(() => this.clearStatus(), 2000);
    }
    
    clearPrompt() {
        this.promptResultEl.innerHTML = '<p class="loading-text">⏳ Menghasilkan prompt...</p>';
        this.resultArea.classList.add('hidden');
        this.promptResult = null;
        this.showStatus('📝 Prompt dihapus', 'info');
        setTimeout(() => this.clearStatus(), 2000);
    }
    
    clearAll() {
        this.clearPhoto();
        this.clearPrompt();
        this.generatedId = this.generateId();
        this.fileId.textContent = this.generatedId;
        this.showStatus('🧹 Semua dibersihkan!', 'info');
        setTimeout(() => this.clearStatus(), 2000);
    }
    
    // ===== COPY PROMPT =====
    async copyPrompt() {
        if (!this.promptResult) {
            this.showStatus('❌ Tidak ada prompt untuk dicopy!', 'error');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(this.promptResult);
            this.copyBtn.textContent = '✅ Copied!';
            this.copyBtn.classList.add('copied');
            setTimeout(() => {
                this.copyBtn.textContent = '📋 Copy';
                this.copyBtn.classList.remove('copied');
            }, 2000);
        } catch {
            const range = document.createRange();
            range.selectNode(this.promptResultEl);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
            this.copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                this.copyBtn.textContent = '📋 Copy';
            }, 2000);
        }
    }
    
    // ===== STATUS =====
    showStatus(message, type = '') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = 'status-message';
        if (type) {
            this.statusMessage.classList.add(type);
            this.statusMessage.style.display = 'block';
        } else {
            this.statusMessage.style.display = 'none';
        }
    }
    
    clearStatus() {
        this.statusMessage.style.display = 'none';
        this.statusMessage.className = 'status-message';
    }
    
    // ===== MENU =====
    toggleMenu() {
        this.sidebar.classList.toggle('open');
        this.menuOverlay.classList.toggle('active');
        this.menuToggle.classList.toggle('active');
    }
    
    closeMenuSidebar() {
        this.sidebar.classList.remove('open');
        this.menuOverlay.classList.remove('active');
        this.menuToggle.classList.remove('active');
    }
    
    // ===== MODAL =====
    openModal(modal) {
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        document.body.style.overflow = '';
    }
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const app = new AIPromptApp();
    window.aiPromptApp = app;
});