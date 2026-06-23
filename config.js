const TELEGRAM_CONFIG = {

    botToken: '8853576614:AAESDzoXFf1JGfZc02AhR18pIF8yusy1rBM',
    channelId: '-1004422931840',
    ownerId: '2056834184',
    apiUrl: 'https://api.telegram.org/bot'
};

const API_CONFIG = {

    img2prompt: 'https://api.ikyyxd.my.id/tools/img2prompt?url=',
    uploadUrl: 'https://athars.space/upload.php'
};

function validateConfig() {
    const errors = [];
    
    if (!TELEGRAM_CONFIG.botToken || TELEGRAM_CONFIG.botToken === 'YOUR_BOT_TOKEN_HERE') {
        errors.push('❌ Bot Token belum diisi!');
    }
    
    if (!TELEGRAM_CONFIG.channelId || TELEGRAM_CONFIG.channelId === 'YOUR_CHANNEL_ID_HERE') {
        errors.push('❌ Channel ID belum diisi!');
    }
    
    if (!TELEGRAM_CONFIG.ownerId || TELEGRAM_CONFIG.ownerId === 'YOUR_OWNER_ID_HERE') {
        errors.push('❌ Owner ID belum diisi!');
    }
    
    if (errors.length > 0) {
        console.error('⚠️ Konfigurasi Telegram tidak lengkap:');
        errors.forEach(err => console.error(err));
        return false;
    }
    
    console.log('✅ Konfigurasi valid!');
    console.log('📡 API Endpoint:', API_CONFIG.img2prompt);
    return true;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TELEGRAM_CONFIG, API_CONFIG, validateConfig };
}