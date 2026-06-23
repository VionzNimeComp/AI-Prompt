// ============================================
// MAIN APPLICATION LOGIC
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
        
        // ✅ SERVER URL (OTOMATIS DETECT)
        this.serverUrl = window.location.origin;
        
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
        if (typeof TELEGRAM_CONFIG === 'undefined') {
            this.showStatus('❌ File config.js tidak ditemukan!', 'error');
            return;
        }
        
        if (!validateConfig()) {
            this.showStatus('⚠️ Silakan isi Token Bot dan Chat ID di file config.js', 'error');
            this.generateBtn.disabled = true;
            return;
        }
        
        console.log('📡 Server URL:', this.serverUrl);
        
        // Event listeners
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
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
        document.getElementById('menuSource').addEventListener('click', (e) => {
            e.preventDefault();
            this.closeMenuSidebar();
            window.open('https://github.com/VionzNimeComp/AI-Prompt', '_blank');
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
        
        // Update ID display
        this.fileId.textContent = this.generatedId;
        
        // Cek cooldown
        this.checkCooldownOnLoad();
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
        this.fileInput.value = '';
    }
    
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
            let timeMsg = minutes > 0 ? `${minutes} menit ${seconds} detik` : `${seconds} detik`;
            this.showStatus(`⏳ Tunggu ${timeMsg} lagi sebelum upload!`, 'info');
            return;
        }
        
        this.imageFile = file;
        this.imageName = file.name;
        this.imageSize = (file.size / 1024 / 1024).toFixed(2);
        
        // Generate ID baru
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
        
        // ✅ UPLOAD LANGSUNG KE ATHARS (TANPA SERVER)
        this.uploadToAthars(file);
        
        this.generateBtn.disabled = false;
    }
    
    // ===== UPLOAD TO ATHARS.SPACE (LANGSUNG DARI BROWSER) =====
    async uploadToAthars(file) {
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

            console.log('📤 Uploading to Athars:', file.name);

            const response = await fetch('https://athars.space/upload.php', options);
            const result = await response.text();

            console.log('📥 Response:', result);

            // Parse URL dari response
            const urlMatch = result.match(/https:\/\/athars\.space\/uploads\/[a-f0-9]+\.(jpg|jpeg|png|gif|webp)/i);
            if (urlMatch) {
                this.imageUrl = urlMatch[0];
                this.fileUrl.textContent = this.imageUrl;
                this.lastUploadTime = Date.now();
                localStorage.setItem('lastUploadTime', String(Date.now()));
                console.log('✅ Upload berhasil:', this.imageUrl);
                this.showStatus('✅ Gambar berhasil diupload!', 'success');
            } else {
                throw new Error('Gagal mendapatkan URL dari response');
            }
        } catch (error) {
            console.error('❌ Upload error:', error);
            this.fileUrl.textContent = 'Gagal upload';
            this.showStatus(`❌ Gagal upload gambar: ${error.message}`, 'error');
            
            await this.sendErrorToOwner('Upload Error', error.message, {
                fileName: file?.name,
                errorStack: error.stack
            });
        }
    }
    
    // ===== GENERATE PROMPT VIA SERVER =====
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
            const response = await fetch(`${this.serverUrl}/api/generate-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    imageUrl: this.imageUrl
                })
            });
            
            const data = await response.json();
            console.log('📥 Response:', data);
            
            if (data.success && data.prompt) {
                this.promptResult = data.prompt;
                this.displayPrompt(data.prompt);
                this.showStatus('✅ Prompt berhasil dihasilkan!', 'success');
                
                await this.sendToTelegram(data.prompt);
            } else {
                throw new Error(data.error || 'Gagal menghasilkan prompt');
            }
        } catch (error) {
            console.error('❌ Generate error:', error);
            this.showStatus(`❌ Error: ${error.message}`, 'error');
            
            await this.sendErrorToOwner('Generate Error', error.message, {
                url: this.imageUrl,
                fileName: this.imageName,
                errorStack: error.stack
            });
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
    
    // ===== SEND TO TELEGRAM VIA SERVER =====
    async sendToTelegram(prompt) {
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
            
            let channelMsg = `✨ AI Prompt • ShiroNekoAI Art\n\n`;
            channelMsg += `🆔 ID: ${this.generatedId}\n`;
            channelMsg += `🖼 File: ${this.imageName}\n`;
            channelMsg += `📎 Url: ${this.imageUrl}\n`;
            channelMsg += `📏 Size: ${this.imageSize} MB\n`;
            channelMsg += `⏰ Time: ${timeStr} WIB\n\n`;
            channelMsg += `📝 Prompt:\n`;
            channelMsg += `"${prompt}"\n\n`;
            channelMsg += `#Img2PromptV3 #AI #Prompt`;
            
            let ownerMsg = channelMsg + `\n\n🌐 IP: ${ip}\n`;
            ownerMsg += `🌐 User-Agent:\n${userAgent}`;
            
            await fetch(`${this.serverUrl}/api/send-to-telegram`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: TELEGRAM_CONFIG.channelId,
                    message: channelMsg,
                    imageUrl: this.imageUrl,
                    requestId: this.generatedId
                })
            });
            
            await fetch(`${this.serverUrl}/api/send-to-telegram`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: TELEGRAM_CONFIG.ownerId,
                    message: ownerMsg,
                    imageUrl: this.imageUrl,
                    requestId: this.generatedId
                })
            });
            
            this.showStatus('✅ Notifikasi terkirim ke Telegram!', 'success');
        } catch (error) {
            console.error('❌ Telegram error:', error);
            this.showStatus('⚠️ Prompt berhasil, tapi gagal kirim notifikasi!', 'error');
            
            await this.sendErrorToOwner('Telegram Error', error.message, {
                url: this.imageUrl,
                fileName: this.imageName,
                errorStack: error.stack
            });
        }
    }
    
    // ===== SEND ERROR TO OWNER VIA SERVER =====
    async sendErrorToOwner(errorType, errorMessage, errorDetails = {}) {
        try {
            const ip = await this.getIP();
            const userAgent = navigator.userAgent;
            
            await fetch(`${this.serverUrl}/api/send-error-log`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    errorType: errorType,
                    errorMessage: errorMessage,
                    errorDetails: {
                        ...errorDetails,
                        requestId: this.generatedId,
                        url: this.imageUrl,
                        fileName: this.imageName,
                        ip: ip,
                        userAgent: userAgent
                    }
                })
            });
            
            console.log('✅ Error log terkirim ke Owner');
        } catch (error) {
            console.error('❌ Gagal kirim error log:', error);
        }
    }
    
    // ===== GET IP =====
    async getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip || 'Unknown';
        } catch {
            return 'Unknown';
        }
    }
    
    // ===== COOLDOWN =====
    getCooldownRemaining() {
        const now = Date.now();
        const lastUpload = parseInt(localStorage.getItem('lastUploadTime')) || 0;
        
        if (lastUpload === 0) return 0;
        
        const elapsed = now - lastUpload;
        const remaining = this.cooldownTime - elapsed;
        
        return remaining > 0 ? remaining : 0;
    }
    
    checkCooldownOnLoad() {
        const remaining = this.getCooldownRemaining();
        if (remaining > 0) {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            let timeMsg = minutes > 0 ? `${minutes} menit ${seconds} detik` : `${seconds} detik`;
            this.showStatus(`⏳ Cooldown: ${timeMsg} tersisa`, 'info');
            this.generateBtn.disabled = true;
            
            this.cooldownInterval = setInterval(() => {
                const remain = this.getCooldownRemaining();
                if (remain <= 0) {
                    clearInterval(this.cooldownInterval);
                    this.clearStatus();
                    this.showStatus('✅ Cooldown selesai! Silakan upload lagi.', 'success');
                    this.generateBtn.disabled = false;
                    setTimeout(() => this.clearStatus(), 3000);
                } else {
                    const mins = Math.floor(remain / 60000);
                    const secs = Math.floor((remain % 60000) / 1000);
                    let msg = mins > 0 ? `${mins} menit ${secs} detik` : `${secs} detik`;
                    this.showStatus(`⏳ Cooldown: ${msg} tersisa`, 'info');
                }
            }, 1000);
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
    try {
        const app = new AIPromptApp();
        window.aiPromptApp = app;
        console.log('✅ AI Prompt App initialized!');
        console.log('📡 Server URL:', app.serverUrl);
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        alert('Terjadi error saat memuat aplikasi. Silakan refresh halaman.');
    }
});
