const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
    // 1. 모든 접속 허용 (CORS 설정)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. 브라우저의 사전 확인(OPTIONS) 요청 시 즉시 응답
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { videoId } = req.query;

    // 3. videoId가 없을 때 서버가 터지지 않게 방어
    if (!videoId) {
        return res.status(400).json({ error: "videoId 파라미터가 필요합니다. (?videoId=ID)" });
    }

    try {
        console.log("자막 추출 시작:", videoId);
        // 4. 자막 추출 시도
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (!transcript || transcript.length === 0) {
            return res.status(404).json({ error: "해당 영상에 자막이 없습니다." });
        }

        return res.status(200).json(transcript);
    } catch (e) {
        console.error("자막 추출 에러:", e.message);
        // 5. 에러 발생 시 500 에러와 함께 메시지 전달 (서버 크래시 방지)
        return res.status(500).json({ 
            error: "유튜브 자막을 가져오는 데 실패했습니다.",
            details: e.message 
        });
    }
};
