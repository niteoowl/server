const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: "title이 필요합니다." });

    try {
        // LRCLIB API 호출
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(title)}`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data && data.length > 0) {
            res.status(200).json(data[0]); // 가장 연관성 높은 첫 번째 가사 반환
        } else {
            res.status(404).json({ error: "가사를 찾을 수 없습니다." });
        }
    } catch (e) {
        res.status(500).json({ error: "가사 서버 연결 실패" });
    }
};
