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
        
        // 2. 유튜브 정보 가져오기 (강력한 브라우저 모사 헤더 추가)
        const info = await ytdl.getInfo(videoUrl, {
            requestOptions: {
                headers: {
                    'Cookie': process.env.YOUTUBE_COOKIE || '',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Sec-Fetch-Mode': 'navigate',
                    'x-youtube-client-name': '1',
                    'x-youtube-client-version': '2.20240328.01.00'
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

        // 5. 자막 데이터 포맷 정리
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
        
        return res.status(500).json({ 
            error: "자막 추출 실패", 
            reason: error.message,
            tip: "1. Vercel Region을 Seoul로 변경 2. 쿠키 재확인 3. Redeploy 실행"
        });
    }
};
