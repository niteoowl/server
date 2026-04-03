const TranscriptClient = require('youtube-transcript-api');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId 필수" });

    try {
        const ClientConstructor = TranscriptClient.default || TranscriptClient;
        const client = new ClientConstructor();

        // 1. 기본 ready 대기
        await client.ready;

        // 2. [강력 조치] 초기화가 진짜 됐는지 루프를 돌며 확인 (최대 3초)
        let attempts = 0;
        while (!client.initialized && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 300)); // 0.3초씩 대기
            attempts++;
        }

        // 3. 자막 가져오기 시도
        const data = await client.getTranscript(videoId);

        if (!data || !data.tracks || data.tracks.length === 0) {
            return res.status(404).json({ error: "자막 없음" });
        }

        const rawTranscript = data.tracks[0].transcript;
        const formattedTranscript = rawTranscript.map(item => ({
            start: parseFloat(item.start),
            duration: parseFloat(item.dur),
            text: item.text
        }));

        return res.status(200).json(formattedTranscript);

    } catch (error) {
        console.error("Critical Error:", error.message);
        
        return res.status(500).json({ 
            error: "자막 추출 실패", 
            reason: error.message,
            videoId: videoId,
            tip: "잠시 후 새로고침(F5)을 한 번 더 해보세요."
        });
    }
};
