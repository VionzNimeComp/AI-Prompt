const axios = require('axios');

const TELEGRAM_CONFIG = {
    botToken: '8727885486:AAE1cjgW03D49rWTqNDM0kWgR1ZI0JhRYmM',
    ownerId: '2056834184', // Ganti dengan ID Anda
    apiUrl: 'https://api.telegram.org/bot'
};

module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { errorType, errorMessage, errorDetails = {} } = req.body;

        if (!TELEGRAM_CONFIG.ownerId || TELEGRAM_CONFIG.ownerId === 'YOUR_OWNER_ID_HERE') {
            return res.json({ success: false, error: 'Owner ID not configured' });
        }

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

        let msg = `❌ ERROR AI Prompt • ShiroNekoAI Art\n\n`;
        msg += `🆔 ID: ${errorDetails.requestId || 'N/A'}\n`;
        msg += `⏰ Time: ${timeStr} WIB\n\n`;
        msg += `📝 Error Message:\n"${errorMessage}"\n\n`;
        
        if (errorDetails.url) msg += `📎 URL: ${errorDetails.url}\n`;
        if (errorDetails.fileName) msg += `🖼 File: ${errorDetails.fileName}\n`;
        if (errorDetails.responseData) {
            const responseStr = typeof errorDetails.responseData === 'string' 
                ? errorDetails.responseData.substring(0, 300)
                : JSON.stringify(errorDetails.responseData, null, 2).substring(0, 300);
            msg += `📄 Response:\n${responseStr}...\n`;
        }
        if (errorDetails.errorStack) {
            const stack = errorDetails.errorStack.substring(0, 500);
            msg += `\n📄 Stack Trace:\n${stack}...\n`;
        }
        
        if (errorDetails.ip) msg += `\n🌐 IP: ${errorDetails.ip}\n`;
        if (errorDetails.userAgent) msg += `🌐 User-Agent:\n${errorDetails.userAgent.substring(0, 200)}...`;

        const url = `${TELEGRAM_CONFIG.apiUrl}${TELEGRAM_CONFIG.botToken}/sendMessage`;
        const response = await axios.post(url, {
            chat_id: TELEGRAM_CONFIG.ownerId,
            text: msg,
            parse_mode: 'HTML'
        });

        res.json({ success: true, data: response.data });

    } catch (error) {
        console.error('❌ Send Error Log Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
