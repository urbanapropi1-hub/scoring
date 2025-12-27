const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/consulta', async (req, res) => {
    const { cuit } = req.query;
    if (!cuit || cuit.length !== 11) {
        return res.status(400).json({ error: 'CUIT inválido' });
    }

    let browser;
    try {
        // En Docker, Puppeteer ya sabe dónde está Chrome
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome', 
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        const page = await browser.newPage();
        
        // Configuramos un User Agent para parecer un usuario real
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        const url = `https://www.bcra.gob.ar/deudores/deudor.asp?cuit=${cuit}`;
        
        // Esperamos a que la red esté tranquila para asegurar que la tabla cargó
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        const data = await page.evaluate(() => {
            const h2 = document.querySelector('h2');
            const nombre = h2 ? h2.innerText.trim() : "No encontrado";
            
            const filas = Array.from(document.querySelectorAll('table tr'));
            const deudas = [];

            filas.forEach((row, index) => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 6 && index > 0) {
                    deudas.push({
                        entidad: cells[1]?.innerText.trim(),
                        periodo: cells[2]?.innerText.trim(),
                        situacion: cells[3]?.innerText.trim(),
                        monto: cells[4]?.innerText.trim(),
                        atraso: cells[5]?.innerText.trim() || '0'
                    });
                }
            });

            return { nombre, deudas };
        });

        await browser.close();
        res.json(data);

    } catch (err) {
        if (browser) await browser.close();
        console.error("LOGS DEL ERROR:", err.message);
        res.status(500).json({ error: "Error al conectar con el BCRA" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
