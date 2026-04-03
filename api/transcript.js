// 라이브러리 불러오기 (v3.0.6 기준 수정)
const TranscriptClient = require('youtube-transcript-api');

module.exports = async (req, res) => {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId가 필요합니다." });

    try {
        // 1. 인스턴스 생성 시도
        // 만약 TranscriptClient가 함수라면 바로 실행하고, 객체 안에 default가 있다면 그걸 사용합니다.
        const ClientConstructor = TranscriptClient.default || TranscriptClient;
        const client = new ClientConstructor();

        // 2. 초기화 대기
        await client.ready;

        // 3. 자막 데이터 가져오기
        const data = await client.getTranscript(videoId);

        // 4. 데이터가 없거나 형식이 다를 경우 체크
        if (!data || !data.tracks || data.tracks.length === 0) {
            return res.status(404).json({ error: "자막 데이터를 찾을 수 없습니다." });
        }

        // 5. 첫 번째 트랙의 자막 추출 (보통 tracks[0]이 메인 자막입니다)
        const rawTranscript = data.tracks[0].transcript;
        
        const formattedTranscript = rawTranscript.map(item => ({
            start: parseFloat(item.start),
            duration: parseFloat(item.dur),
            text: item.text
        }));

        return res.status(200).json(formattedTranscript);

    } catch (error) {
        console.error("Final Debug Error:", error.message);
        return res.status(500).json({ 
            error: "자막 추출 실패", 
            reason: error.message,
            videoId: videoId
        });
    }
};
