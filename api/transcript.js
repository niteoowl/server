const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId 필수" });

    try {
        // 1. 유튜브 페이지 소스 가져오기 (실제 브라우저처럼 보이게 헤더 강화)
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });
        const html = await response.text();

        // 2. 여러 가지 패턴으로 자막 데이터 찾기 (더 강력해진 정규식)
        let captionTracks = [];
        const regex = /"captionTracks":\s*(\[.*?\])/;
        const match = html.match(regex);

        if (match) {
            captionTracks = JSON.parse(match[1]);
        } else {
            // 다른 패턴 시도: ytInitialPlayerResponse 객체 내부 뒤지기
            const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
            if (playerResponseMatch) {
                const playerData = JSON.parse(playerResponseMatch[1]);
                captionTracks = playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
            }
        }

        if (captionTracks.length === 0) {
            throw new Error("자막 데이터를 찾을 수 없습니다. (영상에 CC 자막이 있는지 확인하세요)");
        }

        // 3. 한국어 자막 찾기 (없으면 첫 번째 자막)
        const track = captionTracks.find(t => t.languageCode === 'ko') || 
                      captionTracks.find(t => t.languageCode === 'en') || 
                      captionTracks[0];
        
        // 4. 자막 데이터 URL 요청
        const transcriptRes = await fetch(`${track.baseUrl}&fmt=json3`);
        const transcriptData = await transcriptRes.json();

        // 5. 데이터 가공
        const result = transcriptData.events
            .filter(e => e.segs)
            .map(e => ({
                start: e.tStartMs / 1000,
                duration: (e.dDurationMs || 0) / 1000,
                text: e.segs.map(s => s.utf8).join('')
            }));

        return res.status(200).json(result);

    } catch (error) {
        console.error("Critical Error:", error.message);
        return res.status(500).json({ 
            error: "자막 추출 실패", 
            reason: error.message,
            videoId: videoId,
            tip: "영상 주소창에 'CC' 아이콘이 활성화되어 있는지 확인해 보세요!"
        });
    }
};
