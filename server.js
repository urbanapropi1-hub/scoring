const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/consulta', async (req, res) => {
  const { cuit } = req.query;

  if (!cuit) {
    return res.status(400).json({ error: 'CUIT requerido' });
  }

  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('https://www.bcra.gob.ar/situacion-crediticia/', { waitUntil: 'networkidle2' });

    // Ingresar CUIT
    await page.type('#cuit', cuit);
    await page.click('button[type="submit"]');
    await page.waitForSelector('table', { timeout: 30000 });

    // Extraer todo
    const data = await page.evaluate(() => {
      const nombre = document.querySelector('h2')?.textContent.trim() || 'No disponible';

      const deudas = Array.from(document.querySelectorAll('table tr')).slice(1).map(row => {
        const cells = row.querySelectorAll('td');
        return {
          entidad: cells[1]?.textContent.trim() || '',
          periodo: cells[2]?.textContent.trim() || '',
          situacion: cells[3]?.textContent.trim() || '',
          monto: cells[4]?.textContent.trim() || '',
          atraso: cells[5]?.textContent.trim() || '',
          observaciones: cells[6]?.textContent.trim() || ''
        };
      }).filter(d => d.entidad);

      return { nombre, deudas };
    });

    await browser.close();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy corriendo en puerto ${PORT}`));
