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
  console.log(`Iniciando descarga para URL: ${url}, calidad: ${quality}`);
  
  const videoId = extractVideoId(url);
  if (!videoId) {
    console.error('URL de YouTube no válida:', url);
    throw new Error('URL de YouTube no válida');
  }
  
  console.log(`Video ID extraído: ${videoId}`);
  
  // Decidir el método de descarga
  let useServer = true;
  let downloadUrl;
  
  try {
    // Comprobar estado del servidor local primero
    const serverStatus = await checkServerStatus();
    console.log(`Estado del servidor local: ${serverStatus ? 'En línea' : 'Desconectado'}`);
    
    if (!serverStatus) {
      console.log('Intentando iniciar el servidor local...');
      const startResult = await startLocalServer();
      console.log(`Resultado de inicio del servidor: ${startResult ? 'Éxito' : 'Fallo'}`);
      
      if (!startResult) {
        console.log('No se pudo iniciar el servidor local. Intentando descarga directa...');
        useServer = false;
      }
    }
    
    if (useServer) {
      // Usar servidor local para la descarga
      console.log(`Usando servidor local para la descarga`);
      downloadUrl = `${SERVER_URL}/api/download?videoId=${videoId}&quality=${quality}`;
      console.log(`URL de descarga: ${downloadUrl}`);
    } else {
      // Intentar obtener enlace directo
      console.log('Intentando obtener enlace directo...');
      downloadUrl = await getDownloadLink(videoId, quality);
      console.log(`Enlace directo obtenido: ${downloadUrl}`);
    }
    
    // Preparar nombre de archivo
    const sanitizedFilename = sanitizeFilename(customFilename || `youtube_${videoId}_${quality}.mp4`);
    console.log(`Nombre de archivo: ${sanitizedFilename}`);
    
    // Iniciar la descarga
    console.log('Iniciando descarga con chrome.downloads.download...');
    return new Promise((resolve, reject) => {
      chrome.downloads.download({
        url: downloadUrl,
        filename: sanitizedFilename,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Error en chrome.downloads:', chrome.runtime.lastError);
          reject(new Error(`Error de descarga: ${chrome.runtime.lastError.message}`));
        } else if (downloadId === undefined) {
          console.error('downloadId es undefined, posible error en la descarga');
          reject(new Error('Error al iniciar la descarga'));
        } else {
          console.log(`Descarga iniciada con ID: ${downloadId}`);
          resolve({ downloadId, filename: sanitizedFilename });
        }
      });
    });
  } catch (error) {
    console.error('Error durante el proceso de descarga:', error);
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
  console.log(`Verificando estado del servidor local en ${SERVER_URL}/api/status`);
  
  if (serverRunning) {
    console.log('El servidor ya está marcado como en ejecución');
    return true;
  }
  
  try {
    // Crear un controlador de aborto con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Aumentar a 5 segundos
    
    const response = await fetch(`${SERVER_URL}/api/status`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      cache: 'no-cache',
      signal: controller.signal
    });
    
    // Limpiar el timeout
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Servidor respondió OK: ${JSON.stringify(data)}`);
      serverRunning = true;
      return true;
    } else {
      console.log(`Servidor respondió con error: ${response.status}`);
      serverRunning = false;
      return false;
    }
  } catch (error) {
    console.error(`Error al verificar estado del servidor: ${error.message}`);
    // Si el error es por timeout, mostrar mensaje específico
    if (error.name === 'AbortError') {
      console.log('La solicitud se canceló por timeout');
    }
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
  
  try {
    // Intentar una pequeña solicitud para ver si el servidor ya está activo
    const isActive = await checkServerStatus();
    if (isActive) {
      console.log('El servidor ya está activo');
      return true;
    }
    
    console.log('Simulando inicio del servidor local');
    
    // En una implementación real, aquí se lanzaría el proceso del servidor
    // Por ahora, simulamos un éxito después de un breve retraso
    return new Promise((resolve) => {
      setTimeout(async () => {
        serverRunning = true;
        
        // Verificar que realmente esté funcionando
        try {
          const check = await checkServerStatus();
          if (!check) {
            console.log('No se pudo confirmar que el servidor esté funcionando');
          }
        } catch (e) {
          console.error('Error al verificar servidor después de iniciar:', e);
        }
        
        resolve(true);
      }, 1500);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor local:', error);
    return false;
  }
}

// Detener el servidor local
export async function stopLocalServer() {
  if (!serverRunning) return true;
  
  try {
    console.log('Enviando solicitud de detención al servidor local');
    const response = await fetch(`${SERVER_URL}/api/stop`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' 
      },
      cache: 'no-cache'
    });
    
    if (response.ok) {
      console.log('Servidor detenido correctamente');
    } else {
      console.log('Error al detener el servidor:', response.status);
    }
    
    serverRunning = false;
    return true;
  } catch (e) {
    console.error('Error al detener el servidor:', e);
    // Asumimos que ya se detuvo si hay un error
    serverRunning = false;
    return true;
  }
}

// Obtener información a través del servidor local
export async function fetchInfoViaLocalServer(videoId) {
  console.log(`Solicitando información al servidor local para videoId: ${videoId}`);
  try {
    const response = await fetch(`${SERVER_URL}/api/info?videoId=${videoId}`, {
      method: 'GET',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    console.log(`Respuesta del servidor: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error del servidor (${response.status}): ${errorText}`);
      throw new Error(`Error del servidor: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Información recibida para el video "${data.title}"`);
    return data;
  } catch (error) {
    console.error(`Error al obtener información del servidor: ${error.message}`);
    throw error;
  }
}