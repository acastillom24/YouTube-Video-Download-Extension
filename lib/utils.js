/**
 * Módulo de utilidades para la extensión YouTube Video Downloader
 * 
 * Este módulo proporciona funciones auxiliares utilizadas en toda la extensión.
 */

// Sanitizar nombre de archivo (eliminar caracteres no válidos)
export function sanitizeFilename(filename) {
    if (!filename) return 'download.mp4';
    
    return filename
      .replace(/[/\\?%*:|"<>]/g, '-') // Reemplazar caracteres inválidos
      .replace(/\s+/g, '_')           // Reemplazar espacios con guiones bajos
      .substring(0, 100);             // Limitar longitud
  }
  
  // Formatear bytes a unidades legibles
  export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  // Formatear segundos a formato de tiempo legible
  export function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${padZero(hours)}:${padZero(minutes)}:${padZero(secs)}`;
    } else {
      return `${padZero(minutes)}:${padZero(secs)}`;
    }
  }
  
  // Añadir ceros a la izquierda
  export function padZero(num) {
    return num.toString().padStart(2, '0');
  }
  
  // Validar URL de YouTube
  export function isValidYouTubeUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // Formato: youtube.com/watch?v=VIDEO_ID
      if (urlObj.hostname.includes('youtube.com') && 
          urlObj.pathname.includes('/watch') && 
          urlObj.searchParams.has('v')) {
        return true;
      }
      
      // Formato: youtu.be/VIDEO_ID
      if (urlObj.hostname === 'youtu.be' && 
          urlObj.pathname.length > 1) {
        return true;
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }
  
  // Generar un ID único
  export function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  // Debounce (limitar frecuencia de llamadas a una función)
  export function debounce(func, wait) {
    let timeout;
    
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        func.apply(context, args);
      }, wait);
    };
  }
  
  // Throttle (ejecutar función como máximo una vez cada cierto tiempo)
  export function throttle(func, limit) {
    let inThrottle;
    
    return function(...args) {
      const context = this;
      
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }
  
  // Comprobar si dos objetos son iguales
  export function areObjectsEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }
  
  // Obtener extensión de archivo a partir de tipo MIME
  export function getExtensionFromMimeType(mimeType) {
    const extensions = {
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/x-matroska': 'mkv',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/webm': 'weba'
    };
    
    return extensions[mimeType] || 'mp4';
  }
  
  // Obtener calidad a partir del itag de YouTube
  export function getQualityFromItag(itag) {
    const itagMap = {
      18: { quality: '360p', type: 'video+audio', container: 'mp4' },
      22: { quality: '720p', type: 'video+audio', container: 'mp4' },
      
      // Video (sin audio)
      134: { quality: '360p', type: 'video', container: 'mp4' },
      135: { quality: '480p', type: 'video', container: 'mp4' },
      136: { quality: '720p', type: 'video', container: 'mp4' },
      137: { quality: '1080p', type: 'video', container: 'mp4' },
      
      // Audio
      140: { quality: '128k', type: 'audio', container: 'm4a' },
      
      // WebM
      244: { quality: '480p', type: 'video', container: 'webm' },
      247: { quality: '720p', type: 'video', container: 'webm' },
      248: { quality: '1080p', type: 'video', container: 'webm' }
    };
    
    return itagMap[itag] || { quality: 'unknown', type: 'unknown', container: 'mp4' };
  }