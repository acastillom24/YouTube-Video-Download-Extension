// Background script para YouTube Video Downloader

// Variables globales
let videoCache = {};
let serverRunning = false;
const SERVER_PORT = 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

// Al iniciar la extensión
chrome.runtime.onInstalled.addListener(() => {
  console.log('YouTube Video Downloader instalado');
  // Inicializar el almacenamiento
  chrome.storage.local.set({ videoList: [], downloadHistory: [] });
});

// Escuchar mensajes de la interfaz de usuario (popup) o del content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'fetchVideoInfo':
      fetchVideoInfo(message.url)
        .then(info => {
          // Cachear la información
          videoCache[message.url] = info;
          sendResponse({ success: true, info });
        })
        .catch(error => {
          console.error('Error al obtener info del video:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Indica que la respuesta será asíncrona

    case 'downloadVideo':
      downloadVideo(message.url, message.quality, message.filename)
        .then(result => {
          // Guardar en historial
          addToDownloadHistory(message.url, message.quality, message.filename);
          sendResponse({ success: true, result });
        })
        .catch(error => {
          console.error('Error al descargar video:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Indica que la respuesta será asíncrona

    case 'checkServerStatus':
      checkServerStatus()
        .then(status => {
          sendResponse({ running: status });
        })
        .catch(error => {
          sendResponse({ running: false, error: error.message });
        });
      return true;

    case 'startServer':
      startLocalServer()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
      
    case 'getCurrentTab':
      getCurrentTab()
        .then(tab => {
          sendResponse({ tab });
        })
        .catch(error => {
          sendResponse({ error: error.message });
        });
      return true;
  }
});

// Obtener información del video
async function fetchVideoInfo(url) {
  // Si ya tenemos la información en caché, la devolvemos
  if (videoCache[url]) {
    return videoCache[url];
  }

  // Verificar si es una URL válida de YouTube
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('URL de YouTube no válida');
  }

  // Primero intentamos obtener la información directamente
  try {
    return await fetchDirectYouTubeInfo(videoId);
  } catch (error) {
    console.log('No se pudo obtener info directamente, intentando con servidor local');
    
    // Si falla, intentamos a través del servidor local
    if (await checkServerStatus()) {
      return await fetchInfoViaLocalServer(videoId);
    } else {
      // Intentar iniciar el servidor
      await startLocalServer();
      return await fetchInfoViaLocalServer(videoId);
    }
  }
}

// Extraer ID del video de una URL de YouTube
function extractVideoId(url) {
  try {
    const urlObj = new URL(url);
    
    // Formato: youtube.com/watch?v=VIDEO_ID
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.includes('/watch')) {
      return urlObj.searchParams.get('v');
    }
    
    // Formato: youtu.be/VIDEO_ID
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.substring(1);
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

// Obtener información directamente
async function fetchDirectYouTubeInfo(videoId) {
  // Esta es una implementación simplificada
  // En una implementación real, se analizaría la página o se usaría una API
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
  const html = await response.text();
  
  // Extraer información básica del HTML
  // Nota: Esta es una forma frágil de hacerlo y puede fallar con cambios en YouTube
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const title = titleMatch ? titleMatch[1].replace(' - YouTube', '') : 'Video desconocido';
  
  // En una implementación real, aquí extraeríamos más información
  // como la duración, miniaturas, y enlaces para descarga
  return {
    id: videoId,
    title,
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    duration: 'Desconocida', // Esto requeriría un análisis más profundo
    formats: [
      { quality: '360p', label: '360p', type: 'mp4' },
      { quality: '720p', label: '720p', type: 'mp4' },
      { quality: '1080p', label: '1080p (HD)', type: 'mp4' }
    ]
  };
}

// Obtener información a través del servidor local
async function fetchInfoViaLocalServer(videoId) {
  const response = await fetch(`${SERVER_URL}/api/info?videoId=${videoId}`);
  if (!response.ok) {
    throw new Error(`Error del servidor: ${response.status}`);
  }
  return await response.json();
}

// Verificar el estado del servidor local
async function checkServerStatus() {
  if (serverRunning) return true;
  
  try {
    const response = await fetch(`${SERVER_URL}/api/status`);
    serverRunning = response.ok;
    return serverRunning;
  } catch (e) {
    serverRunning = false;
    return false;
  }
}

// Iniciar el servidor local (simulado en esta implementación)
async function startLocalServer() {
  // En una implementación real, este método lanzaría un proceso 
  // Node.js en segundo plano o notificaría al usuario que
  // necesita ejecutar manualmente el servidor
  
  console.log('Simulando inicio del servidor local');
  
  // Simulamos un éxito después de un breve retraso
  return new Promise((resolve) => {
    setTimeout(() => {
      serverRunning = true;
      resolve(true);
    }, 1000);
  });
}

// Descargar el video
async function downloadVideo(url, quality, filename) {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('URL de YouTube no válida');
  }
  
  // Obtener el enlace de descarga
  let downloadUrl;
  
  try {
    // Primero intentamos obtener el enlace directamente (simulado)
    downloadUrl = await getDownloadLink(videoId, quality);
  } catch (error) {
    // Si falla, intentamos a través del servidor local
    if (!(await checkServerStatus())) {
      await startLocalServer();
    }
    
    downloadUrl = `${SERVER_URL}/api/download?videoId=${videoId}&quality=${quality}`;
  }
  
  // Iniciar la descarga
  return chrome.downloads.download({
    url: downloadUrl,
    filename: sanitizeFilename(filename || `youtube_${videoId}_${quality}.mp4`),
    saveAs: true
  });
}

// Obtener enlace de descarga (simulado)
async function getDownloadLink(videoId, quality) {
  // En una implementación real, esta función extraería los enlaces
  // directos de descarga desde la página de YouTube o usaría una API
  
  // Por ahora, simulamos un error para forzar el uso del servidor local
  throw new Error('Descarga directa no disponible');
}

// Guardar una descarga en el historial
function addToDownloadHistory(url, quality, filename) {
  chrome.storage.local.get(['downloadHistory'], (result) => {
    const history = result.downloadHistory || [];
    
    history.push({
      url,
      quality,
      filename,
      date: new Date().toISOString()
    });
    
    // Limitar el historial a los últimos 100 elementos
    if (history.length > 100) {
      history.shift();
    }
    
    chrome.storage.local.set({ downloadHistory: history });
  });
}

// Obtener la pestaña actual
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Sanitizar nombre de archivo
function sanitizeFilename(filename) {
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-') // Reemplazar caracteres inválidos
    .replace(/\s+/g, '_');          // Reemplazar espacios con guiones bajos
}