/**
 * Servidor local para YouTube Video Downloader
 * 
 * Este servidor ayuda a superar las restricciones de CORS y proporciona
 * funcionalidades adicionales que no son posibles directamente desde
 * una extensión de navegador.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const apiRoutes = require('./routes');

// Configuración
const PORT = process.env.PORT || 3000;
const TEMP_DIR = path.join(__dirname, 'temp');

// Crear directorio temporal si no existe
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Crear directorio public si no existe
const PUBLIC_DIR = path.join(__dirname, 'public');
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Inicializar aplicación Express
const app = express();

// Middlewares
app.use(cors()); // Permitir CORS desde cualquier origen
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(PUBLIC_DIR));

// Configurar rutas API
app.use('/api', apiRoutes);

// Ruta de inicio para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>YouTube Video Downloader - Servidor Local</title>
        <style>
          body {
            font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          h1 { color: #FF0000; }
          .status { 
            padding: 10px; 
            background-color: #eaffea;
            border-left: 4px solid #0f9d58;
            margin: 20px 0;
          }
          code {
            background-color: #f5f5f5;
            padding: 2px 5px;
            border-radius: 3px;
          }
          .btn {
            display: inline-block;
            background-color: #FF0000;
            color: white;
            padding: 10px 15px;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>YouTube Video Downloader - Servidor Local</h1>
        <div class="status">
          <strong>Estado:</strong> Servidor funcionando correctamente
        </div>
        <p>Este servidor local proporciona las siguientes funcionalidades:</p>
        <ul>
          <li>Extracción de información de videos de YouTube</li>
          <li>Descargas directas evitando restricciones de CORS</li>
          <li>Conversión de formatos</li>
        </ul>
        <p>Para usar este servidor, la extensión YouTube Video Downloader debe estar instalada en el navegador.</p>
        <p>Para verificar el estado del servidor: <code>GET /api/status</code></p>
        
        <a href="/test-client.html" class="btn">Ir al Cliente de Prueba</a>
      </body>
    </html>
  `);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`Verificar estado: http://localhost:${PORT}/api/status`);
  console.log(`Cliente de prueba: http://localhost:${PORT}/test-client.html`);
});

// Manejar terminación de proceso
process.on('SIGINT', () => {
  console.log('Servidor detenido manualmente');
  process.exit(0);
});

// Manejar excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
  // Mantener el servidor en ejecución
});