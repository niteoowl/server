const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId가 필요합니다." });

    try {
        // 자막 추출 시도 (언어 설정을 빼고 기본으로 시도해봅니다)
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);

        // 결과 반환 (단위 변환 및 포맷 정리)
        const formattedTranscript = transcript.map(item => ({
            start: item.offset / 1000,
            duration: item.duration / 1000,
            text: item.text
        }));

        return res.status(200).json(formattedTranscript);

    } catch (error) {
        // 서버가 죽지 않게 에러 메시지를 JSON으로 반환
        console.error("Transcript Error:", error.message);
        return res.status(500).json({ 
            error: "자막 추출 실패", 
            message: error.message,
            videoId: videoId
        });
    }
};
