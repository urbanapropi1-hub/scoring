const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL requerida' });
  }

  try {
    const fullUrl = `https://api.bcra.gob.ar${url.startsWith('/') ? url : '/' + url}`;
    const response = await fetch(fullUrl);
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Error en BCRA' });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy corriendo en puerto ${PORT}`);
});
