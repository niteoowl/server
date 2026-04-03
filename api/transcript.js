const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId 필수" });

    try {
        // 1. 유튜브 페이지 소스 가져오기
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });
        const html = await response.text();

        // 2. 자막 데이터 URL 추출 (정규식 사용)
        const captionsMatch = html.match(/"captionTracks":\[(.*?)]/);
        if (!captionsMatch) throw new Error("자막 트랙을 찾을 수 없습니다. (CC가 꺼져있을 수 있음)");

        const captionsJson = JSON.parse(`[${captionsMatch[1]}]`);
        // 한국어(ko) 우선, 없으면 첫 번째 자막
        const track = captionsJson.find(t => t.languageCode === 'ko') || captionsJson[0];
        
        // 3. 실제 자막 XML/JSON 데이터 요청
        const transcriptRes = await fetch(`${track.baseUrl}&fmt=json3`);
        const transcriptData = await transcriptRes.json();

        // 4. 포맷 정리
        const result = transcriptData.events
            .filter(e => e.segs)
            .map(e => ({
                start: e.tStartMs / 1000,
                duration: (e.dDurationMs || 0) / 1000,
                text: e.segs.map(s => s.utf8).join('')
            }));

        return res.status(200).json(result);

    } catch (error) {
        return res.status(500).json({ 
            error: "자막 추출 최종 실패", 
            reason: error.message,
            tip: "유튜브가 이 서버를 차단했거나 자막이 없는 영상입니다."
        });
    }
};
