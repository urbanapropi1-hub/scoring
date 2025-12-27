// api/proxy.js
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL requerida' });
  }

  try {
    const fullUrl = `https://api.bcra.gob.ar${url.startsWith('/') ? url : '/' + url}`;
    const response = await fetch(fullUrl, {
      method: req.method || 'GET',
    });

    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
