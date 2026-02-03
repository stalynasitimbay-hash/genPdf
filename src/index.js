const express = require('express');
const app = express();

// 1. Render nos asigna un puerto dinámico, debemos usarlo obligatoriamente
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('API Lista y en línea');
});

// 2. Debes escuchar en '0.0.0.0' para que Render pueda detectar el puerto
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});