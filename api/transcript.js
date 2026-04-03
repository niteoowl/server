const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
    // CORS 헤더를 무조건 최상단에 배치 (에러가 나도 브라우저가 인식할 수 있게)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId가 필요합니다." });

    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        return res.status(200).json(transcript);
    } catch (error) {
        console.error("Server Error:", error.message);
        return res.status(500).json({ error: "자막 추출 실패", message: error.message });
    }
};
