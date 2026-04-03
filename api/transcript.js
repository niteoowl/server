const ytdl = require('@distube/ytdl-core');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 1. CORS 헤더 설정 (브라우저 차단 방지)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight 요청 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: "videoId가 필요합니다." });
    }

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // 2. 유튜브 정보 가져오기 (쿠키 주입)
        // Vercel Settings > Environment Variables에 YOUTUBE_COOKIE 이름으로 쿠키를 넣으세요.
        const info = await ytdl.getInfo(videoUrl, {
            requestOptions: {
                headers: {
                    'Cookie': process.env.YOUTUBE_COOKIE || '', 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }
        });

        // 3. 자막 트랙 추출
        const tracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!tracks || tracks.length === 0) {
            return res.status(404).json({ error: "자막이 없는 영상입니다." });
        }

        // 한국어(ko)를 먼저 찾고, 없으면 첫 번째 자막 선택
        const selectedTrack = tracks.find(t => t.languageCode === 'ko') || tracks[0];
        
        // 4. 자막 데이터 요청
        const response = await fetch(selectedTrack.baseUrl + '&fmt=json3');
        const data = await response.json();

        // 5. 프론트엔드에서 쓰기 편하게 포맷 정리
        const transcript = data.events
            .filter(event => event.segs)
            .map(event => ({
                start: event.tStartMs / 1000,
                duration: (event.dDurationMs || 0) / 1000,
                text: event.segs.map(s => s.utf8).join('')
            }));

        return res.status(200).json(transcript);

    } catch (error) {
        console.error("Final Error:", error.message);
        
        // 에러가 나도 JSON으로 응답해서 브라우저 CORS 오해 방지
        return res.status(500).json({ 
            error: "자막 추출 실패", 
            reason: error.message,
            tip: "쿠키가 만료되었는지 확인하거나 Vercel Region을 변경해보세요."
        });
    }
};
