// api/proxy.js
export default async function handler(req, res) {
  const { url } = req.query;

  // Validación básica para evitar abusos
  if (!url || !url.startsWith('/centraldedeudores')) {
    return res.status(400).json({ error: 'URL inválida' });
  }

  try {
    const fullUrl = `https://api.bcra.gob.ar${url}`;
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: { 'User-Agent': 'ScoreInqui/1.0' }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Error en BCRA' });
    }

    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
