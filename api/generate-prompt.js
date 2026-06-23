const axios = require('axios');

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
        const { imageUrl } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ 
                success: false, 
                error: 'imageUrl is required' 
            });
        }

        console.log('📤 Generating prompt for:', imageUrl);

        const apiUrl = `https://api.ikyyxd.my.id/tools/img2prompt?url=${encodeURIComponent(imageUrl)}`;
        
        const response = await axios.get(apiUrl, {
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        console.log('📥 Response from API:', response.data);

        if (response.data && response.data.result && response.data.result.prompt) {
            res.json({
                success: true,
                prompt: response.data.result.prompt,
                data: response.data
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Invalid response from AI API',
                data: response.data
            });
        }

    } catch (error) {
        console.error('❌ Generate Prompt Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data || null
        });
    }
};
