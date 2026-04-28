export default async function handler(req, res) {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const firstChar = q.charAt(0).toLowerCase();
    const targetUrl = `https://v2.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(q)}.json`;

    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
            return res.status(response.status).json({ error: 'IMDb API error' });
        }
        const data = await response.json();
        const results = (data.d || []).map((item) => ({
            id: item.id,
            title: item.l,
            year: item.y,
            image: item.i ? item.i.imageUrl : null,
            stars: item.s,
            type: item.q
        }));
        res.status(200).json({ results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
