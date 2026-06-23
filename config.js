// ============================================
// KONFIGURASI TELEGRAM BOT
// ============================================

const TELEGRAM_CONFIG = {
    // Token Bot dari @BotFather
    botToken: '8727885486:AAE1cjgW03D49rWTqNDM0kWgR1ZI0JhRYmM',
    
    // Chat ID Channel/Group
    channelId: '-1003700985529',
    
    // Chat ID Owner (GANTI DENGAN ID TELEGRAM ANDA)
    ownerId: '2056834184',
    
    // URL API Telegram
    apiUrl: 'https://api.telegram.org/bot'
};

// ============================================
// VALIDASI KONFIGURASI
// ============================================

function validateConfig() {
    const errors = [];
    
    if (!TELEGRAM_CONFIG.botToken || TELEGRAM_CONFIG.botToken === 'YOUR_BOT_TOKEN_HERE') {
        errors.push('❌ Bot Token belum diisi!');
    }
    
    if (!TELEGRAM_CONFIG.channelId || TELEGRAM_CONFIG.channelId === 'YOUR_CHANNEL_ID_HERE') {
        errors.push('❌ Channel ID belum diisi!');
    }
    
    if (!TELEGRAM_CONFIG.ownerId || TELEGRAM_CONFIG.ownerId === 'YOUR_OWNER_ID_HERE') {
        errors.push('❌ Owner ID belum diisi! (untuk error log)');
    }
    
    if (errors.length > 0) {
        console.error('⚠️ Konfigurasi tidak lengkap:');
        errors.forEach(err => console.error(err));
        return false;
    }
    
    console.log('✅ Konfigurasi valid!');
    return true;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TELEGRAM_CONFIG, validateConfig };
}
