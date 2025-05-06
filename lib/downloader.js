/**
 * Módulo para gestionar la descarga de videos de YouTube
 * 
 * Este módulo proporciona funciones para descargar videos de YouTube
 * a través de diferentes métodos.
 */

import { extractVideoId, getDownloadUrl } from './yt-info.js';
import { sanitizeFilename } from './utils.js';

// Constantes
const SERVER_PORT = 3000;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;

// Variables
let serverRunning = false;

// Iniciar descarga de un video
export async function downloadVideo(url, quality, customFilename) {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('URL de YouTube no válida');
    }
    
    // Obtener el enlace de descarga
    let downloadUrl;
    
    try {
      // Primero intentamos obtener el enlace directamente
      downloadUrl = await getDownloadUrl(videoId, quality);
    } catch (error) {
      console.log('No se pudo obtener enlace directo, usando servidor local');
      
      // Si falla, intentamos a través del servidor local
      if (!(await checkServerStatus())) {
        await startLocalServer();
      }
      
      downloadUrl = `${SERVER_URL}/api/download?videoId=${videoId}&quality=${quality}`;
    }
    
    // Preparar nombre de archivo
    const filename = customFilename || `youtube_${videoId}_${quality}.mp4`;
    const sanitizedFilename = sanitizeFilename(filename);
    
    // Iniciar la descarga usando la API de chrome.downloads
    return new Promise((resolve, reject) => {
      chrome.downloads.download({
        url: downloadUrl,
        filename: sanitizedFilename,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (downloadId === undefined) {
          reject(new Error('Error al iniciar la descarga'));
        } else {
          resolve({ downloadId, filename: sanitizedFilename });
        }
      });
    });
  } catch (error) {
    console.error('Error en proceso de descarga:', error);
    throw error;
  }
}

// Descargar múltiples videos
export async function downloadMultiple(videos) {
  const results = {
    success: [],
    failed: []
  };
  
  // Usar Promise.allSettled para manejar éxitos y fallos
  const promises = videos.map(video => {
    return downloadVideo(video.url, video.quality, video.filename)
      .then(result => {
        results.success.push({ ...video, ...result });
        return result;
      })
      .catch(error => {
        results.failed.push({ ...video, error: error.message });
        // No propagamos el error para que continúe con los demás
        return null;
      });
  });
  
  await Promise.allSettled(promises);
  return results;
}

// Verificar el estado del servidor local
export async function checkServerStatus() {
  if (serverRunning) return true;
  
  try {
    const response = await fetch(`${SERVER_URL}/api/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Asegurarse de que no use caché
      cache: 'no-cache',
      // Timeout de 2 segundos
      signal: AbortSignal.timeout(2000)
    });
    
    serverRunning = response.ok;
    return serverRunning;
  } catch (e) {
    serverRunning = false;
    return false;
  }
}

// Iniciar el servidor local
export async function startLocalServer() {
  console.log('Intentando iniciar el servidor local');
  
  // En una implementación real, esto podría:
  // 1. Intentar iniciar un proceso Node.js preempaquetado con la extensión
  // 2. Notificar al usuario que debe ejecutar manualmente un servidor
  // 3. Abrir una URL que inicie el servidor en una pestaña
  
  // Por ahora, simulamos un éxito
  return new Promise((resolve) => {
    setTimeout(() => {
      serverRunning = true;
      resolve(true);
    }, 1000);
  });
}

// Detener el servidor local
export async function stopLocalServer() {
  if (!serverRunning) return true;
  
  try {
    const response = await fetch(`${SERVER_URL}/api/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-cache'
    });
    
    serverRunning = !response.ok;
    return !serverRunning;
  } catch (e) {
    // Asumimos que ya se detuvo si hay un error
    serverRunning = false;
    return true;
  }
}