const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // 1. CORS 설정 (브라우저에서 호출 가능하게)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId 필수" });

    try {
        // 2. 유튜브 페이지 소스 요청 (쿠키와 헤더 주입)
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: { 
                // 중요: Vercel Settings -> Environment Variables에 넣은 YOUTUBE_COOKIE 사용
                'Cookie': process.env.YOUTUBE_COOKIE || '',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        const html = await response.text();

        // 3. 자막 데이터 주소(captionTracks) 추출
        let captionTracks = [];
        const regex = /"captionTracks":\s*(\[.*?\])/;
        const match = html.match(regex);

        if (match) {
            captionTracks = JSON.parse(match[1]);
        } else {
            // 패턴 2: 플레이어 응답 객체 내부 뒤지기
            const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
            if (playerResponseMatch) {
                const playerData = JSON.parse(playerResponseMatch[1]);
                captionTracks = playerData.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
            }
        }

        // 자막이 아예 없는 경우 에러 처리
        if (captionTracks.length === 0) {
            throw new Error("유튜브가 자막 정보를 숨겼거나 자막이 없는 영상입니다.");
        }

        // 4. 한국어(ko) 우선 선택, 없으면 첫 번째 자막 사용
        const track = captionTracks.find(t => t.languageCode === 'ko') || captionTracks[0];
        
        // 5. 실제 자막 JSON 데이터 가져오기
        const transcriptRes = await fetch(`${track.baseUrl}&fmt=json3`);
        const transcriptData = await transcriptRes.json();

        // 6. 클라이언트가 쓰기 좋게 포맷 가공
        const result = transcriptData.events
            .filter(e => e.segs)
            .map(e => ({
                start: e.tStartMs / 1000,
                duration: (e.dDurationMs || 0) / 1000,
                text: e.segs.map(s => s.utf8).join('')
            }));

        return res.status(200).json(result);

    } catch (error) {
        console.error("Final Error Log:", error.message);
        return res.status(500).json({ 
            error: "자막 추출 최종 실패", 
            reason: error.message,
            videoId: videoId
        });
    }
};
