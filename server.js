const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/consulta', async (req, res) => {
  const { cuit } = req.query;

  if (!cuit) {
    return res.status(400).json({ error: 'CUIT requerido' });
  }

  try {
    const url = `https://www.bcra.gob.ar/deudores/deudor.asp?cuit=${cuit}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // Extraer nombre
    const nombre = $('h2').first().text().trim() || 'No disponible';

    // Extraer deudas
    const deudas = [];
    $('table tr').slice(1).each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 5) {
        deudas.push({
          entidad: cells.eq(1).text().trim(),
          periodo: cells.eq(2).text().trim(),
          situacion: cells.eq(3).text().trim(),
          monto: cells.eq(4).text().trim(),
          atraso: cells.eq(5).text().trim() || 'N/A',
          observaciones: cells.eq(6).text().trim() || ''
        });
      }
    });

    // Extraer histórico (del gráfico o tabla adicional)
    const historico = [];
    // Aquí puedes parsear más si hay tabla histórica

    res.json({ nombre, deudas, historico });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy corriendo en puerto ${PORT}`);
});
