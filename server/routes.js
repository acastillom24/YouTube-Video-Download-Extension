/**
 * Definición de rutas para el servidor de YouTube Video Downloader
 * 
 * Este módulo contiene todas las rutas API usadas por la extensión.
 */

const express = require('express');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const TEMP_DIR = path.join(__dirname, 'temp');

// Asegurar que existe el directorio temporal
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Verificar estado del servidor
 * GET /api/status
 */
router.get('/status', (req, res) => {
  res.json({ status: 'online', version: '1.0.0' });
});

/**
 * Obtener información del video
 * GET /api/info?videoId=VIDEO_ID
 */
router.get('/info', async (req, res) => {
  const { videoId } = req.query;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Se requiere ID del video' });
  }
  
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoUrl);
    
    // Extraer información relevante
    const videoDetails = {
      id: videoId,
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails.pop().url,
      duration: formatDuration(info.videoDetails.lengthSeconds),
      formats: extractFormats(info.formats),
      author: info.videoDetails.author.name,
      views: info.videoDetails.viewCount,
      uploadDate: info.videoDetails.uploadDate
    };
    
    res.json(videoDetails);
  } catch (error) {
    console.error('Error al obtener información del video:', error);
    res.status(500).json({ error: error.message });
  }
});

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
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoUrl);
    
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
      selectedFormat = ytdl.chooseFormat(info.formats, { quality: 'highest' });
    }
    
    // Configurar headers para descarga
    const extension = selectedFormat.container || 'mp4';
    const filename = `${sanitizedTitle}-${quality || 'hd'}.${extension}`;
    
    res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.header('Content-Type', `video/${extension}`);
    
    // Transmitir el video
    ytdl(videoUrl, { format: selectedFormat })
      .on('error', (error) => {
        console.error('Error durante la descarga:', error);
        // Si no hemos enviado headers aún, enviar error
        if (!res.headersSent) {
          res.status(500).json({ error: error.message });
        }
      })
      .pipe(res);
  } catch (error) {
    console.error('Error al iniciar descarga:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Descargar sólo audio
 * GET /api/audio?videoId=VIDEO_ID
 */
router.get('/audio', async (req, res) => {
  const { videoId } = req.query;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Se requiere ID del video' });
  }
  
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoUrl);
    
    // Sanitizar nombre del archivo
    const sanitizedTitle = sanitizeFilename(info.videoDetails.title);
    const filename = `${sanitizedTitle}.mp3`;
    
    // Configurar headers para descarga
    res.header('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.header('Content-Type', 'audio/mpeg');
    
    // Transmitir el audio
    ytdl(videoUrl, { 
      quality: 'highestaudio',
      filter: 'audioonly' 
    })
    .on('error', (error) => {
      console.error('Error durante la descarga de audio:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    })
    .pipe(res);
  } catch (error) {
    console.error('Error al iniciar descarga de audio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Detener el servidor
 * POST /api/stop
 */
router.post('/stop', (req, res) => {
  res.json({ status: 'stopping' });
  
  // Esperar un poco antes de detener el servidor
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

// Funciones auxiliares

/**
 * Extraer formatos disponibles para el video
 */
function extractFormats(allFormats) {
  // Filtrar formatos relevantes
  const uniqueFormats = new Map();
  
  // Priorizar formatos con video y audio
  const formatsWithBoth = allFormats.filter(format => 
    format.hasAudio && format.hasVideo && (format.container === 'mp4' || format.container === 'webm')
  );
  
  // Añadir formatos clave (calidades comunes)
  const targetQualities = ['360p', '480p', '720p', '1080p', '1440p', '2160p'];
  
  for (const quality of targetQualities) {
    // Primero buscar en formatos con audio y video
    let found = formatsWithBoth.find(format => format.qualityLabel === quality);
    
    // Si no se encuentra, buscar en todos los formatos
    if (!found) {
      found = allFormats.find(format => 
        format.hasVideo && format.qualityLabel === quality && 
        (format.container === 'mp4' || format.container === 'webm')
      );
    }
    
    if (found) {
      uniqueFormats.set(quality, {
        quality,
        label: `${quality} (${found.container})`,
        type: found.container,
        itag: found.itag,
        hasAudio: found.hasAudio
      });
    }
  }
  
  // Añadir formato de solo audio
  const audioFormat = allFormats.find(format => 
    format.hasAudio && !format.hasVideo && format.container === 'mp4'
  );
  
  if (audioFormat) {
    uniqueFormats.set('audio', {
      quality: 'audio',
      label: 'Solo Audio (mp3)',
      type: 'mp3',
      itag: audioFormat.itag,
      hasAudio: true
    });
  }
  
  // Convertir Map a array
  return Array.from(uniqueFormats.values());
}

/**
 * Obtener formato según calidad
 */
function getFormatByQuality(formats, quality, container = 'mp4') {
  // Si piden audio
  if (quality === 'audio') {
    return formats.find(f => f.hasAudio && !f.hasVideo) || 
           ytdl.chooseFormat(formats, { quality: 'highestaudio' });
  }
  
  // Primero buscamos una coincidencia exacta con audio y video
  let format = formats.find(f => 
    f.qualityLabel === quality && f.hasAudio && f.hasVideo && f.container === container
  );
  
  // Si no hay coincidencia con el contenedor solicitado, probar con otro
  if (!format) {
    format = formats.find(f => 
      f.qualityLabel === quality && f.hasAudio && f.hasVideo
    );
  }
  
  // Si no hay coincidencia con audio y video, buscamos sólo video
  if (!format) {
    format = formats.find(f => f.qualityLabel === quality && f.hasVideo);
  }
  
  // Si sigue sin haber coincidencia, usamos una aproximación
  if (!format) {
    if (quality === '360p' || quality === '480p') {
      format = ytdl.chooseFormat(formats, { quality: 'lowest' });
    } else if (quality === '720p') {
      format = ytdl.chooseFormat(formats, { quality: 'highestvideo' });
    } else {
      format = ytdl.chooseFormat(formats, { quality: 'highestvideo' });
    }
  }
  
  return format;
}

/**
 * Formatear duración del video
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${padZero(minutes)}:${padZero(secs)}`;
  } else {
    return `${minutes}:${padZero(secs)}`;
  }
}

/**
 * Añadir ceros a la izquierda
 */
function padZero(num) {
  return num.toString().padStart(2, '0');
}

/**
 * Sanitizar nombre de archivo
 */
function sanitizeFilename(filename) {
  if (!filename) return 'video';
  
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-') // Reemplazar caracteres inválidos
    .replace(/\s+/g, '_')           // Reemplazar espacios con guiones bajos
    .substring(0, 100);             // Limitar longitud
}

module.exports = router;