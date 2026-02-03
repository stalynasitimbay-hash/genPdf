import express from "express";
import cors from "cors";
import { PDFDocument } from "pdf-lib";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

const app = express();

app.use(cors());
// Aumentar límite solo para JSON
app.use(express.json({ limit: "200mb" }));

// Expresiones regulares pre-compiladas (Optimización de velocidad)
const RE_ID = /ID Carátula:\s*(\S+)/;
const RE_CLIENTE = /Cliente:\s*([^\n\r]+)/;
const RE_CEDULA = /Cédula:\s*([\d,]+)/;
const RE_DOC = /DOC-\d+/;

app.post("/split", async (req, res) => {
    try {
        const { pdfBase64 } = req.body;
        if (!pdfBase64) return res.status(400).json({ error: "Falta pdfBase64" });

        const pdfBuffer = Buffer.from(pdfBase64, "base64");
        const loadingTask = pdfjs.getDocument({
            data: new Uint8Array(pdfBuffer),
            useSystemFonts: false,
            disableFontFace: true,
            verbosity: 0
        });
        
        const pdfDocJS = await loadingTask.promise;
        const totalPaginas = pdfDocJS.numPages;
        
        let infoCaratula = { id: "DESCONOCIDO", cliente: "SIN_NOMBRE", cedula: "" };
        const marcas = [];

        // --- PASO 1: EXTRACCIÓN RÁPIDA ---
        for (let i = 1; i <= totalPaginas; i++) {
            const page = await pdfDocJS.getPage(i);
            const textContent = await page.getTextContent();
            // Optimización: unimos texto solo una vez
            const textoEnPagina = textContent.items.map(item => item.str).join(" ");

            if (textoEnPagina.includes("CARÁTULA") || textoEnPagina.includes("ID Carátula")) {
                const idMatch = textoEnPagina.match(RE_ID);
                const clienteMatch = textoEnPagina.match(RE_CLIENTE);
                const cedulaMatch = textoEnPagina.match(RE_CEDULA);

                if (idMatch) infoCaratula.id = idMatch[1];
                if (clienteMatch) infoCaratula.cliente = clienteMatch[1].trim();
                if (cedulaMatch) infoCaratula.cedula = cedulaMatch[1];
                continue;
            }
            
            const coincidencia = textoEnPagina.match(RE_DOC);
            if (coincidencia) {
                marcas.push({ pagina: i, codigo: coincidencia[0] });
            }
        }

        if (marcas.length === 0) return res.json({ success: false, mensaje: "No se detectaron separadores" });

        // --- PASO 2: CORTE EFICIENTE ---
        const pdfDocLib = await PDFDocument.load(pdfBuffer);
        const archivosFinales = [];

        for (let i = 0; i < marcas.length; i++) {
            const inicio = marcas[i].pagina - 1; 
            let fin = (i + 1 < marcas.length) ? marcas[i + 1].pagina - 2 : totalPaginas - 1;
            if (fin < inicio) fin = inicio;

            const nuevoPdf = await PDFDocument.create();
            // copyPages es más eficiente que extraer individualmente
            const paginasCopiadas = await nuevoPdf.copyPages(pdfDocLib, 
                Array.from({length: (fin - inicio) + 1}, (_, k) => k + inicio)
            );
            paginasCopiadas.forEach(p => nuevoPdf.addPage(p));

            const bytes = await nuevoPdf.save();
            
            const nombreArchivo = `${marcas[i].codigo}_${infoCaratula.id}_${infoCaratula.cliente}`
                .replace(/\s+/g, "_")
                .replace(/[^a-zA-Z0-9.\-_]/g, "") + ".pdf";

            archivosFinales.push({
                nombre: nombreArchivo,
                base64: Buffer.from(bytes).toString("base64")
            });
        }

        res.json({ 
            success: true, 
            total: archivosFinales.length, 
            caratula: infoCaratula,
            archivos: archivosFinales 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Puerto: ${PORT}`));