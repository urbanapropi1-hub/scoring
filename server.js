const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/consulta', async (req, res) => {
    const { cuit } = req.query;
    if (!cuit || cuit.length !== 11) {
        return res.status(400).json({ error: 'CUIT inválido (deben ser 11 números)' });
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            // En Render, Puppeteer suele instalarse en esta ruta por defecto
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome'
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        
        // Simulamos un navegador real
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

        const url = `https://www.bcra.gob.ar/deudores/deudor.asp?cuit=${cuit}`;
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 40000 });

        const data = await page.evaluate(() => {
            const h2 = document.querySelector('h2');
            const nombre = h2 ? h2.innerText.trim() : "No encontrado o CUIT inexistente";
            
            const filas = Array.from(document.querySelectorAll('table tr'));
            const deudas = [];

            filas.forEach((row, index) => {
                const cells = row.querySelectorAll('td');
                // Buscamos filas con estructura de datos bancarios (típicamente 5-6 celdas)
                if (cells.length >= 5) {
                    const entidad = cells[1]?.innerText.trim();
                    // Evitamos encabezados verificando que la entidad no sea el título
                    if (entidad && entidad !== "Entidad") {
                        deudas.push({
                            entidad: entidad,
                            periodo: cells[2]?.innerText.trim(),
                            situacion: cells[3]?.innerText.trim(),
                            monto: cells[4]?.innerText.trim(),
                            atraso: cells[5]?.innerText.trim() || '0'
                        });
                    }
                }
            });

            return { nombre, deudas };
        });

        await browser.close();
        res.json(data);

    } catch (err) {
        if (browser) await browser.close();
        console.error("LOGS DEL ERROR:", err.message);
        res.status(500).json({ error: "Error de conexión con el BCRA. Reintentá en un momento." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
