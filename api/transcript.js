const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
    // 1. CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId가 필요합니다." });

    try {
        // 2. 자막 추출 시도 (한국어 우선)
        // 이 라이브러리는 내부적으로 유튜브의 다른 엔드포인트를 찔러서 차단을 피합니다.
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: 'ko'
        });

        // 3. 결과 반환 (기존 앱과 호환되도록 포맷 유지)
        const formattedTranscript = transcript.map(item => ({
            start: item.offset / 1000,
            duration: item.duration / 1000,
            text: item.text
        }));

        return res.status(200).json(formattedTranscript);

    } catch (error) {
        console.error("Transcript Error:", error.message);
        
        return res.status(500).json({ 
            error: "자막 추출 최종 실패", 
            reason: error.message,
            tip: "영상에 자막(CC)이 활성화되어 있는지 확인하세요."
        });
    }
};
