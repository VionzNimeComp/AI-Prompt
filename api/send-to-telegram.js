const axios = require('axios');

const TELEGRAM_CONFIG = {
    botToken: '8727885486:AAE1cjgW03D49rWTqNDM0kWgR1ZI0JhRYmM',
    channelId: '-1003700985529',
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
        const { chatId, message, imageUrl, requestId } = req.body;

        if (!chatId || !message) {
            return res.status(400).json({ success: false, error: 'chatId and message are required' });
        }

        // Kirim pesan teks
        const textUrl = `${TELEGRAM_CONFIG.apiUrl}${TELEGRAM_CONFIG.botToken}/sendMessage`;
        const textResponse = await axios.post(textUrl, {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });

        // Kirim foto jika ada
        if (imageUrl) {
            try {
                const photoUrl = `${TELEGRAM_CONFIG.apiUrl}${TELEGRAM_CONFIG.botToken}/sendPhoto`;
                await axios.post(photoUrl, {
                    chat_id: chatId,
                    photo: imageUrl,
                    caption: `🖼 Gambar untuk ID: ${requestId || 'N/A'}`
                });
            } catch (photoError) {
                console.warn('⚠️ Gagal kirim foto:', photoError.message);
            }
        }

        res.json({ success: true, data: textResponse.data });

    } catch (error) {
        console.error('❌ Send to Telegram Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
