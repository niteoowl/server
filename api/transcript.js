// 라이브러리를 통째로 가져온 뒤 안에서 꺼내 쓰는 방식으로 변경
import pkg from 'youtube-transcript';
const { YoutubeTranscript } = pkg;

export default async function handler(req, res) {
    // 1. CORS 헤더 설정 (에러가 나도 브라우저 차단을 막기 위해 최상단 배치)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. 브라우저 사전 요청 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: "videoId is required" });
    }

    try {
        // 3. 자막 추출 시도
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        
        if (!transcript || transcript.length === 0) {
            return res.status(404).json({ error: "자막을 찾을 수 없습니다." });
        }

        return res.status(200).json(transcript);
    } catch (error) {
        // 4. 에러 발생 시 서버가 죽지 않게 처리
        console.error("Transcript Error:", error.message);
        return res.status(500).json({ 
            error: "유튜브 자막 추출 실패",
            message: error.message 
        });
    }
}
