const TranscriptClient = require('youtube-transcript-api');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId가 필요합니다." });

    try {
        const ClientConstructor = TranscriptClient.default || TranscriptClient;
        const client = new ClientConstructor();

        // [중요] 초기화가 완료될 때까지 확실히 기다립니다.
        // Vercel 환경에서는 await client.ready가 가끔 바로 넘어가는 경우가 있어 
        // 한 번 더 명시적으로 기다려줍니다.
        await client.ready;
        
        // 혹시 모르니 아주 짧은 대기 시간을 줍니다 (0.5초)
        await new Promise(resolve => setTimeout(resolve, 500));

        // 자막 가져오기 시도
        const data = await client.getTranscript(videoId);

        if (!data || !data.tracks || data.tracks.length === 0) {
            return res.status(404).json({ error: "자막 트랙을 찾을 수 없습니다." });
        }

        // 데이터 정리
        const rawTranscript = data.tracks[0].transcript;
        const formattedTranscript = rawTranscript.map(item => ({
            start: parseFloat(item.start),
            duration: parseFloat(item.dur),
            text: item.text
        }));

        return res.status(200).json(formattedTranscript);

    } catch (error) {
        console.error("Initialization Error:", error.message);
        
        // 만약 초기화 에러라면 한 번 더 안내
        const isInitError = error.message.includes('not fully initialized');
        
        return res.status(500).json({ 
            error: "자막 추출 실패", 
            reason: error.message,
            tip: isInitError ? "서버 초기화 중입니다. 1~2초 후 새로고침해 보세요." : "영상 ID를 확인하세요."
        });
    }
};
