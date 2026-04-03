const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
    // 1. CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. Preflight 요청 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: "videoId query parameter is required" });
    }

    try {
        // 3. 자막 가져오기
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (!transcript || transcript.length === 0) {
            return res.status(404).json({ error: "No transcript found for this video" });
        }

        return res.status(200).json(transcript);
    } catch (error) {
        console.error("Transcript Error:", error.message);
        return res.status(500).json({ 
            error: "Failed to fetch transcript", 
            message: error.message 
        });
    }
};
