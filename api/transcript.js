import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req, res) {
    // [무조건 실행] 헤더부터 박고 시작 (CORS 해결)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "No videoId" });

    try {
        // 자막 추출 시도
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        return res.status(200).json(transcript);
    } catch (error) {
        console.error("Server Error:", error.message);
        // 에러가 나도 JSON으로 응답해서 500 크래시 방지
        return res.status(500).json({ error: "유튜브 차단 또는 자막 없음", message: error.message });
    }
}
