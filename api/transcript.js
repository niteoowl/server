const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
    // 1. CORS 및 응답 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) {
        return res.status(400).json({ error: "videoId가 필요합니다." });
    }

    try {
        // 2. 자막 추출 시도 (언어 강제 설정 없이 기본으로 먼저 시도)
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);

        if (!transcript || transcript.length === 0) {
            throw new Error("자막 데이터를 찾을 수 없습니다.");
        }

        // 3. 데이터 포맷 정리 (클라이언트가 쓰기 편하게 변환)
        const formattedTranscript = transcript.map(item => ({
            start: item.offset / 1000,
            duration: item.duration / 1000,
            text: item.text
        }));

        return res.status(200).json(formattedTranscript);

    } catch (error) {
        // 4. 에러 발생 시 서버가 죽지 않게 로그 출력 후 JSON 반환
        console.error("Transcript Fetch Error:", error.message);
        
        return res.status(500).json({ 
            error: "자막 추출 실패", 
            reason: error.message,
            videoId: videoId,
            tip: "영상에 자막(CC) 설정이 있는지 확인하거나 잠시 후 다시 시도하세요."
        });
    }
};
