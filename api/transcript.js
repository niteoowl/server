const ytdl = require('@distube/ytdl-core');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 1. CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId가 필요합니다." });

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // 2. 유튜브 정보 요청 (사용자님의 실제 브라우저 정보 주입)
        const info = await ytdl.getInfo(videoUrl, {
            requestOptions: {
                headers: {
                    // Vercel 환경변수에 넣은 그 쿠키
                    'Cookie': process.env.YOUTUBE_COOKIE || '',
                    // 보내주신 사용자님의 실제 User-Agent 그대로 입력
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Sec-Ch-Ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"Windows"',
                    'Service-Worker-Navigation-Preload': 'true'
                }
            }
        });

        // 3. 자막 트랙 찾기
        const tracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!tracks || tracks.length === 0) {
            return res.status(404).json({ error: "자막이 없는 영상입니다." });
        }

        const selectedTrack = tracks.find(t => t.languageCode === 'ko') || tracks[0];
        
        // 4. 자막 데이터 가져오기
        const response = await fetch(selectedTrack.baseUrl + '&fmt=json3');
        const data = await response.json();

        // 5. 결과 반환
        const transcript = data.events
            .filter(event => event.segs)
            .map(event => ({
                start: event.tStartMs / 1000,
                duration: (event.dDurationMs || 0) / 1000,
                text: event.segs.map(s => s.utf8).join('')
            }));

        return res.status(200).json(transcript);

    } catch (error) {
        console.error("Error Detail:", error.message);
        return res.status(500).json({ 
            error: "자막 추출 실패", 
            reason: error.message,
            tip: "쿠키를 다시 따서 Vercel에 업데이트하고 'Redeploy' 버튼을 꼭 누르세요!"
        });
    }
};
