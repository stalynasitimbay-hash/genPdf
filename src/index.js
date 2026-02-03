const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Ruta principal para probar en el navegador
app.get('/', (req, res) => {
  res.send('¡API de GENPDF funcionando!');
});

// Ruta para recibir datos de Apps Script
app.post('/test', (req, res) => {
  console.log('Cuerpo recibido:', req.body);
  res.json({
    status: 'success',
    message: 'Datos recibidos correctamente en la API'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});