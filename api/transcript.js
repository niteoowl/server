const { YoutubeTranscript } = require('youtube-transcript');

module.exports = async (req, res) => {
    // 1. 모든 도메인(Origins)에서 접속할 수 있도록 허용
    res.setHeader('Access-Control-Allow-Origin', '*');
    // 2. 허용할 메서드 (GET뿐만 아니라 브라우저가 미리 묻는 OPTIONS도 추가)
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    // 3. 허용할 헤더 설정
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // [핵심 추가] 브라우저가 "연결해도 돼?"라고 미리 묻는(Preflight) 요청 처리
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: "videoId가 필요합니다." });
    }

    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        res.status(200).json(transcript);
    } catch (e) {
        // 에러 발생 시에도 CORS 헤더가 유지되도록 설정 (위에서 이미 설정됨)
        res.status(500).json({ error: "자막을 찾을 수 없거나 추출에 실패했습니다." });
    }
};
