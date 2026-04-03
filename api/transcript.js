// 라이브러리 불러오기
const TranscriptClient = require('youtube-transcript-api').default;

module.exports = async (req, res) => {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId가 필요합니다." });

    try {
        // 1. 클라이언트 생성 (보내주신 문서의 User-Agent 활용)
        const client = new TranscriptClient({
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36"
            }
        });

        // 2. 초기화 대기 (문서에 필수라고 되어 있음)
        await client.ready;

        // 3. 자막 가져오기
        const data = await client.getTranscript(videoId);

        // 4. 데이터 구조가 "tracks" 안에 있으므로 포맷 정리
        // 이 라이브러리는 tracks[0].transcript 안에 start, dur, text가 들어있습니다.
        if (!data.tracks || data.tracks.length === 0) {
            return res.status(404).json({ error: "자막이 없는 영상입니다." });
        }

        const rawTranscript = data.tracks[0].transcript;
        const formattedTranscript = rawTranscript.map(item => ({
            start: parseFloat(item.start),
            duration: parseFloat(item.dur),
            text: item.text
        }));

        return res.status(200).json(formattedTranscript);

    } catch (error) {
        console.error("New API Error:", error.message);
        return res.status(500).json({ 
            error: "자막 추출 실패", 
            reason: error.message 
        });
    }
};
