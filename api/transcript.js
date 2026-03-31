const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
    // CORS 허용 (내 사이트에서 접속 가능하게)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { videoId } = req.query;

    if (!videoId) return res.status(400).json({ error: "videoId가 필요합니다." });

    try {
        // 유튜브에서 자막 데이터 추출
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        res.status(200).json(transcript);
    } catch (e) {
        res.status(500).json({ error: "자막을 찾을 수 없거나 추출에 실패했습니다." });
    }
};
