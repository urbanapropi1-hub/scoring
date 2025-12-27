const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/consulta', async (req, res) => {
    const { cuit } = req.query;
    if (!cuit) return res.status(400).json({ error: 'CUIT requerido' });

    let browser;
    try {
        // Configuramos el navegador para evitar bloqueos
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Vamos a la URL oficial
        const url = `https://www.bcra.gob.ar/deudores/deudor.asp?cuit=${cuit}`;
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Extraemos los datos usando selectores actualizados
        const data = await page.evaluate(() => {
            const nombre = document.querySelector('h2')?.innerText.trim() || "No encontrado";
            const filas = Array.from(document.querySelectorAll('table tr')).slice(1);
            
            const deudas = filas.map(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 5) return null;
                return {
                    entidad: cells[1]?.innerText.trim(),
                    periodo: cells[2]?.innerText.trim(),
                    situacion: cells[3]?.innerText.trim(),
                    monto: cells[4]?.innerText.trim(),
                    atraso: cells[5]?.innerText.trim() || '0'
                };
            }).filter(d => d !== null);

            return { nombre, deudas };
        });

        await browser.close();
        res.json(data);

    } catch (err) {
        if (browser) await browser.close();
        res.status(500).json({ error: "Error en el scraping: " + err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
