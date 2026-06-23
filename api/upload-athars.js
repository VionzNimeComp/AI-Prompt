const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Konfigurasi multer untuk Vercel (memory storage)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

// Disable body parser untuk multer
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

    return new Promise((resolve, reject) => {
        upload.single('photo')(req, res, async (err) => {
            if (err) {
                console.error('Multer error:', err);
                return res.status(400).json({ success: false, error: err.message });
            }

            try {
                if (!req.file) {
                    return res.status(400).json({ success: false, error: 'No file uploaded' });
                }

                console.log('📤 Uploading to Athars:', req.file.originalname);

                const formData = new FormData();
                formData.append('file', req.file.buffer, req.file.originalname);

                const response = await fetch('https://athars.space/upload.php', {
                    method: 'POST',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
                        'Accept-Encoding': 'gzip, deflate, br, zstd',
                        'sec-ch-ua-platform': '"Android"',
                        'accept-language': 'en-ID,en;q=0.9',
                        'sec-ch-ua': '"Chromium";v="141", "Not?A_Brand";v="8"',
                        'sec-ch-ua-mobile': '?1',
                        'origin': 'https://athars.space',
                        'referer': 'https://athars.space/',
                        ...formData.getHeaders()
                    },
                    body: formData
                });

                const result = await response.text();

                // Parse URL dari response
                const urlMatch = result.match(/https:\/\/athars\.space\/uploads\/[a-f0-9]+\.(jpg|jpeg|png|gif|webp)/i);
                if (urlMatch) {
                    res.json({
                        success: true,
                        imageUrl: urlMatch[0]
                    });
                } else {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to parse image URL from response'
                    });
                }

            } catch (error) {
                console.error('❌ Upload Error:', error.message);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
            resolve();
        });
    });
};
