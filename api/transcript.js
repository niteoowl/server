import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { YoutubeTranscript } = require('youtube-transcript');

export default async function handler(req, res) {
    // 1. CORS 헤더 설정 (무조건 최상단)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. 브라우저 사전 요청(OPTIONS) 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: "videoId가 필요합니다." });
    }

    try {
        // 3. 자막 추출 실행
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (!transcript || transcript.length === 0) {
            return res.status(404).json({ error: "자막을 찾을 수 없습니다." });
        }

        return res.status(200).json(transcript);
    } catch (error) {
        console.error("Transcript Error:", error.message);
        // 에러가 나도 서버가 죽지 않게 응답 전송
        return res.status(500).json({ 
            error: "자막 추출 실패", 
            message: error.message 
        });
    }
}
