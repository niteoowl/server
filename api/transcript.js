const ytdl = require('@distube/ytdl-core');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 1. CORS 및 응답 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId 필수" });

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // 2. 유튜브 정보 가져오기 (고급 우회 설정 추가)
        const info = await ytdl.getInfo(videoUrl, {
            requestOptions: {
                headers: {
                    'Cookie': process.env.YOUTUBE_COOKIE || '',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1'
                }
            }
        });

        // 3. 자막 트랙 리스트 확인
        const tracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!tracks || tracks.length === 0) {
            return res.status(404).json({ error: "자막이 없는 영상입니다." });
        }

        // 한국어(ko) -> 영어(en) -> 첫 번째 트랙 순서로 시도
        const selectedTrack = tracks.find(t => t.languageCode === 'ko') || 
                              tracks.find(t => t.languageCode === 'en') || 
                              tracks[0];
        
        // 4. 자막 데이터 요청 (fmt=json3 형식을 사용하여 파싱을 쉽게 함)
        const response = await fetch(selectedTrack.baseUrl + '&fmt=json3');
        if (!response.ok) throw new Error('유튜브 자막 서버 응답 실패');
        
        const data = await response.json();

        // 5. 클라이언트가 쓰기 편한 JSON 포맷으로 변환
        const transcript = data.events
            .filter(event => event.segs)
            .map(event => ({
                start: event.tStartMs / 1000,
                duration: (event.dDurationMs || 0) / 1000,
                text: event.segs.map(s => s.utf8).join('')
            }));

        return res.status(200).json(transcript);

    } catch (error) {
        console.error("Critical Error:", error.message);
        
        // 봇 에러인 경우 더 친절하게 안내
        const isBotError = error.message.includes('confirm you’re not a bot') || error.message.includes('403');
        
        return res.status(500).json({ 
            error: isBotError ? "유튜브 IP 차단됨 (봇 감지)" : "자막 추출 실패", 
            reason: error.message,
            suggested_action: isBotError ? "Vercel Settings > Functions에서 Region을 Seoul이나 Tokyo로 변경 후 Redeploy 하세요." : "영상 ID를 확인하세요."
        });
    }
};
