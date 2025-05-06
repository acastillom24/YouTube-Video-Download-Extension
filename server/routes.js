/**
 * Descargar video
 * GET /api/download?videoId=VIDEO_ID&quality=QUALITY
 */
router.get('/download', async (req, res) => {
  const { videoId, quality, format } = req.query;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Se requiere ID del video' });
  }
  
  try {
    console.log(`Iniciando descarga para videoId: ${videoId}, calidad: ${quality}`);
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Intentar obtener información con opciones avanzadas
    console.log("Obteniendo información del video...");
    const info = await ytdl.getInfo(videoUrl, {
      requestOptions: {
        headers: {
          // Simular navegador Chrome
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0'
        }
      }
    });
    
    console.log(`Información obtenida. Título: ${info.videoDetails.title}`);
    console.log(`Formatos disponibles: ${info.formats.length}`);
    
    // Debug: Mostrar formatos disponibles
    info.formats.forEach((fmt, i) => {
      console.log(`Formato ${i}: ${fmt.qualityLabel || 'N/A'} - ${fmt.container || 'N/A'} - Audio: ${fmt.hasAudio ? 'Sí' : 'No'}`);
    });
    
    // Sanitizar nombre del archivo
    const sanitizedTitle = sanitizeFilename(info.videoDetails.title);
    
    // Determinar formato a descargar
    let selectedFormat;
    
    if (quality) {
      // Primero intentamos encontrar el formato con la calidad específica
      selectedFormat = getFormatByQuality(info.formats, quality, format);
    }
    
    if (!selectedFormat) {
      // Si no se encuentra, usar el mejor formato disponible
      console.log('No se encontró el formato específico, usando formato de mayor calidad');
      
      // Intentar encontrar un formato con audio y video
      const formatsWithBoth = info.formats.filter(fmt => 
        fmt.hasAudio && fmt.hasVideo && 
        (fmt.container === 'mp4' || fmt.container === 'webm')
      );
      
      if (formatsWithBoth.length > 0) {
        selectedFormat = formatsWithBoth[0]; // Usar el primer formato con audio y video
        console.log(`Usando formato con audio y video: ${selectedFormat.qualityLabel}`);
      } else {
        selectedFormat = ytdl.chooseFormat(info.formats, { quality: 'highest' });
        console.log(`Usando formato elegido por ytdl: ${selectedFormat.qualityLabel}`);
      }
    }
    
    console.log(`Formato seleccionado: ${selectedFormat.qualityLabel} (${selectedFormat.container})`);
    
    // Configurar headers para descarga
    const extension = selectedFormat.container || 'mp4';
    const filename = `${sanitizedTitle}-${quality || selectedFormat.qualityLabel || 'hd'}.${extension}`;
    
    console.log(`Preparando descarga con nombre: ${filename}`);
    
    res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.header('Content-Type', `video/${extension}`);
    
    // Transmitir el video con manejo mejorado de errores
    const stream = ytdl(videoUrl, { 
      format: selectedFormat,
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    });
    
    // Manejar eventos del stream
    stream.on('response', (response) => {
      console.log(`Descarga iniciada. Código de estado: ${response.statusCode}`);
      
      // Obtener tamaño total si está disponible
      const totalSize = parseInt(response.headers['content-length'], 10);
      if (totalSize) {
        console.log(`Tamaño total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      }
    });
    
    let downloadedBytes = 0;
    stream.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      // Cada ~5MB imprimimos progreso
      if (downloadedBytes % (5 * 1024 * 1024) < chunk.length) {
        console.log(`Descargado: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
      }
    });
    
    stream.on('end', () => {
      console.log(`Descarga completada. Total: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
    });
    
    stream.on('error', (error) => {
      console.error('Error durante la descarga:', error);
      // Si no hemos enviado headers aún, enviar error
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      } else {
        // Intentar terminar la respuesta
        try {
          res.end();
        } catch (e) {
          console.error('Error al finalizar la respuesta:', e);
        }
      }
    });
    
    // Pipe a la respuesta
    stream.pipe(res);
    
  } catch (error) {
    console.error('Error al iniciar descarga:', error);
    console.error(error.stack); // Mostrar stack trace completo
    res.status(500).json({ error: error.message });
  }
});