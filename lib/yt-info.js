/**
 * Módulo para extraer información de videos de YouTube
 * 
 * Este módulo proporciona funciones para obtener metadatos e información
 * de descarga de videos de YouTube.
 */

// Extraer ID del video de una URL de YouTube
export function extractVideoId(url) {
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
  
  // Obtener información básica del video
  export async function getBasicInfo(videoId) {
    try {
      // Obtener la página del video
      const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
      const html = await response.text();
      
      // Extraer título
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      const title = titleMatch 
        ? titleMatch[1].replace(' - YouTube', '').trim() 
        : 'Video sin título';
      
      // Extraer duración (esto es una simplificación, en la implementación real
      // habría que analizar datos JSON incrustados en la página)
      const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
      const durationSeconds = durationMatch ? parseInt(durationMatch[1], 10) : 0;
      const duration = formatDuration(durationSeconds);
      
      // Miniatura
      const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      
      return {
        id: videoId,
        title,
        duration,
        thumbnail,
        url: `https://www.youtube.com/watch?v=${videoId}`
      };
    } catch (error) {
      console.error('Error al obtener información básica:', error);
      throw new Error('No se pudo obtener información básica del video');
    }
  }
  
  // Obtener información completa del video (incluyendo formatos disponibles)
  export async function getVideoInfo(videoId) {
    try {
      // Primero obtenemos la información básica
      const basicInfo = await getBasicInfo(videoId);
      
      // En una implementación real, aquí extraeríamos los formatos disponibles
      // analizando datos JSON incrustados en la página o mediante API
      
      // Por ahora, generamos formatos de ejemplo
      const formats = [
        { quality: '360p', label: '360p', type: 'mp4', itag: 18 },
        { quality: '720p', label: '720p', type: 'mp4', itag: 22 },
        { quality: '1080p', label: '1080p (HD)', type: 'mp4', itag: 137 }
      ];
      
      return {
        ...basicInfo,
        formats
      };
    } catch (error) {
      console.error('Error al obtener información completa:', error);
      throw new Error('No se pudo obtener información completa del video');
    }
  }
  
  // Obtener URL de descarga para un formato específico
  export async function getDownloadUrl(videoId, quality) {
    try {
      // En una implementación real, aquí obtendríamos el enlace directo
      // para el formato seleccionado
      
      // Por ahora, simularemos un error para forzar el uso del servidor local
      throw new Error('Descarga directa no disponible, se necesita servidor local');
      
      // En una implementación real, retornaríamos algo como:
      // return `https://redirector.googlevideo.com/videoplayback?...`;
    } catch (error) {
      console.error('Error al obtener URL de descarga:', error);
      throw error;
    }
  }
  
  // Función auxiliar para formatear la duración
  function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return 'Desconocida';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${padZero(minutes)}:${padZero(secs)}`;
    } else {
      return `${minutes}:${padZero(secs)}`;
    }
  }
  
  // Función auxiliar para añadir ceros a la izquierda
  function padZero(num) {
    return num.toString().padStart(2, '0');
  }