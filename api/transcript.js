// 라이브러리 로드 방식 변경 (SyntaxError 방지)
const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
    // 1. 모든 응답에 CORS 헤더 적용
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. 브라우저의 사전 검사(OPTIONS) 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: "videoId가 필요합니다." });
    }

    try {
        // 3. 자막 가져오기 실행
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (!transcript || transcript.length === 0) {
            return res.status(404).json({ error: "자막을 찾을 수 없습니다." });
        }

        return res.status(200).json(transcript);
    } catch (error) {
        console.error("Transcript Error:", error.message);
        
        // 에러 발생 시에도 JSON 응답을 보내야 브라우저가 CORS 에러로 오해하지 않음
        return res.status(500).json({ 
            error: "자막 추출 실패", 
            message: error.message 
        });
    }
};
