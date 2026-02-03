const express = require('express');
const app = express();

// IMPORTANTE: Permitir que la API entienda JSON
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 1. Endpoint de bienvenida (GET)
app.get('/', (req, res) => {
  res.json({
    mensaje: "¡API de GENPDF en línea!",
    instrucciones: "Envía un POST a /generar para probar",
    version: "1.0.0"
  });
});

// 2. Endpoint para procesar datos (POST)
// Este es el que usarás en Postman y Apps Script
app.post('/generar', (req, res) => {
  const { nombre, email, contenido } = req.body;

  // Validación básica
  if (!nombre || !email) {
    return res.status(400).json({
      error: "Faltan campos obligatorios: nombre y email"
    });
  }

  console.log(`Recibida petición para: ${nombre} (${email})`);

  // Aquí es donde en el futuro podrías poner la lógica de generar un PDF
  res.json({
    status: "success",
    message: `Hola ${nombre}, recibimos tu contenido para el PDF`,
    data_recibida: {
      nombre,
      email,
      contenido: contenido || "Sin contenido adicional"
    },
    server_time: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});