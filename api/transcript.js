const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId 필수" });

    try {
        // [핵심] 유튜브 내부 API를 직접 호출 (HTML 파싱보다 강력함)
        const response = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${process.env.YOUTUBE_API_KEY || ''}`, {
            method: 'POST',
            body: JSON.stringify({
                videoId: videoId,
                context: {
                    client: { clientName: "WEB", clientVersion: "2.20240320.00.00" }
                },
                // 쿠키가 있다면 여기에 주입 (선택사항)
            }),
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Cookie': process.env.YOUTUBE_COOKIE || ''
            }
        });

        const data = await response.json();
        const captionTracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!captionTracks || captionTracks.length === 0) {
            throw new Error("유튜브 API가 자막 정보를 거부했습니다.");
        }

        const track = captionTracks.find(t => t.languageCode === 'ko') || captionTracks[0];
        const transcriptRes = await fetch(`${track.baseUrl}&fmt=json3`);
        const transcriptData = await transcriptRes.json();

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
            error: "Vercel 서버 차단됨", 
            reason: error.message,
            tip: "Render.com 등 다른 플랫폼으로 이동을 강력 추천합니다."
        });
    }
};
