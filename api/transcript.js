const ytdl = require('@distube/ytdl-core');
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ error: "videoId가 필요합니다." });

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // 1. 영상의 모든 정보(Info) 가져오기
        const info = await ytdl.getInfo(videoUrl);
        
        // 2. 자막 트랙 리스트 확인
        const tracks = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!tracks || tracks.length === 0) {
            return res.status(404).json({ error: "이 영상에는 자막이 없습니다." });
        }

        // 3. 한국어(ko) 우선 선택, 없으면 첫 번째 자막 선택
        const selectedTrack = tracks.find(t => t.languageCode === 'ko') || tracks[0];
        
        // 4. 자막 XML/JSON 주소로 직접 요청 보내기
        const response = await fetch(selectedTrack.baseUrl + '&fmt=json3');
        const data = await response.json();

        // 5. downsub 스타일로 포맷 정리 (start, duration, text)
        const transcript = data.events
            .filter(event => event.segs)
            .map(event => ({
                start: event.tStartMs / 1000,
                duration: Math.round(event.dDurationMs) / 1000,
                text: event.segs.map(s => s.utf8).join('')
            }));

        return res.status(200).json(transcript);

    } catch (error) {
        console.error("Downsub Style Error:", error.message);
        return res.status(500).json({ 
            error: "자막 추출 실패", 
            reason: error.message 
        });
    }
};
