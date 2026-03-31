import { YoutubeTranscript } from 'youtube-transcript';

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: "videoId is required" });
    }

    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        return res.status(200).json(transcript);
    } catch (error) {
        console.error("Transcript Error:", error.message);
        return res.status(500).json({ error: error.message });
    }
}
