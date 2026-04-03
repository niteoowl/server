const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
    // 1. CORS 헤더 강제 설정 (어떤 상황에서도 응답이 가도록)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: "videoId가 없습니다." });
    }

    try {
        console.log(`Fetching transcript for: ${videoId}`);
        
        // 2. 자막 가져오기 실행 (타임아웃 대비 10초 제한 로직은 라이브러리 내장)
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (!transcript) {
            throw new Error("유튜브에서 자막 데이터를 응답하지 않습니다.");
        }

        return res.status(200).json(transcript);

    } catch (error) {
        console.error("Critical Error:", error.message);

        // 3. 500 에러가 나더라도 JSON으로 에러 메시지를 보내서 브라우저의 'CORS' 오해 방지
        return res.status(500).json({ 
            error: "자막 추출 실패", 
            reason: error.message,
            tip: "유튜브가 서버 IP를 차단했을 수 있습니다. 잠시 후 다시 시도하세요."
        });
    }
};
