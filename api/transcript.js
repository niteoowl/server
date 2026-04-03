const ytdl = require('@distube/ytdl-core');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId 필수" });

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // 브라우저처럼 보이게 헤더 옵션 추가
        const info = await ytdl.getInfo(videoUrl, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                }
            }
        });

        const tracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (!tracks || tracks.length === 0) return res.status(404).json({ error: "자막 없음" });

        const selectedTrack = tracks.find(t => t.languageCode === 'ko') || tracks[0];
        const response = await fetch(selectedTrack.baseUrl + '&fmt=json3');
        const data = await response.json();

        const transcript = data.events
            .filter(event => event.segs)
            .map(event => ({
                start: event.tStartMs / 1000,
                duration: (event.dDurationMs || 0) / 1000,
                text: event.segs.map(s => s.utf8).join('')
            }));

        return res.status(200).json(transcript);
    } catch (error) {
        return res.status(500).json({ error: "차단됨", reason: error.message });
    }
};
