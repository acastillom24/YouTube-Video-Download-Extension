// JavaScript para la interfaz de YouTube Video Downloader

// Elementos DOM
const elements = {
    videoUrl: document.getElementById('video-url'),
    addUrlBtn: document.getElementById('add-url'),
    currentTabBtn: document.getElementById('current-tab-url'),
    videoList: document.getElementById('video-list'),
    videoCount: document.getElementById('video-count'),
    clearAllBtn: document.getElementById('clear-all'),
    downloadAllBtn: document.getElementById('download-all'),
    serverStatus: document.getElementById('server-status-value'),
    startServerBtn: document.getElementById('start-server'),
    videoItemTemplate: document.getElementById('video-item-template')
  };
  
  // Estado de la aplicación
  const state = {
    videoItems: [],
    serverRunning: false
  };
  
  // Inicializar la aplicación
  document.addEventListener('DOMContentLoaded', () => {
    init();
  });
  
  // Función de inicialización
  function init() {
    // Cargar videos guardados
    loadSavedVideos();
    
    // Comprobar estado del servidor
    checkServerStatus();
    
    // Configurar listeners de eventos
    setupEventListeners();
  }
  
  // Cargar videos guardados
  function loadSavedVideos() {
    chrome.storage.local.get(['videoList'], (result) => {
      if (result.videoList && result.videoList.length > 0) {
        state.videoItems = result.videoList;
        renderVideoList();
        updateGlobalButtons();
      }
    });
  }
  
  // Comprobar estado del servidor
  function checkServerStatus() {
    elements.serverStatus.textContent = 'Verificando...';
    elements.serverStatus.className = '';
    
    chrome.runtime.sendMessage({ action: 'checkServerStatus' }, (response) => {
      state.serverRunning = response && response.running;
      
      if (state.serverRunning) {
        elements.serverStatus.textContent = 'En línea';
        elements.serverStatus.className = 'online';
        elements.startServerBtn.style.display = 'none';
      } else {
        elements.serverStatus.textContent = 'Desconectado';
        elements.serverStatus.className = 'offline';
        elements.startServerBtn.style.display = 'block';
      }
    });
  }
  
  // Configurar listeners de eventos
  function setupEventListeners() {
    // Botón para añadir URL
    elements.addUrlBtn.addEventListener('click', () => {
      const url = elements.videoUrl.value.trim();
      if (url) {
        addVideo(url);
        elements.videoUrl.value = '';
      }
    });
    
    // Entrada de URL (para detectar tecla Enter)
    elements.videoUrl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        elements.addUrlBtn.click();
      }
    });
    
    // Añadir URL de la pestaña actual
    elements.currentTabBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'getCurrentTab' }, (response) => {
        if (response && response.tab && response.tab.url) {
          const url = response.tab.url;
          if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
            addVideo(url);
          } else {
            showNotification('La pestaña actual no es un video de YouTube', 'error');
          }
        }
      });
    });
    
    // Botón para limpiar todo
    elements.clearAllBtn.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que quieres eliminar todos los videos?')) {
        state.videoItems = [];
        renderVideoList();
        saveVideoList();
        updateGlobalButtons();
      }
    });
    
    // Botón para descargar todo
    elements.downloadAllBtn.addEventListener('click', () => {
      downloadAllVideos();
    });
    
    // Botón para iniciar servidor
    elements.startServerBtn.addEventListener('click', () => {
      startLocalServer();
    });
  }
  
  // Añadir un video a la lista
  function addVideo(url) {
    // Verificar si el video ya existe en la lista
    const exists = state.videoItems.some(item => item.url === url);
    if (exists) {
      showNotification('Este video ya está en la lista', 'warning');
      return;
    }
    
    // Mostrar estado de carga
    const loadingItem = {
      url,
      title: 'Cargando información...',
      thumbnail: '',
      duration: '',
      formats: [],
      status: 'loading'
    };
    
    state.videoItems.push(loadingItem);
    renderVideoList();
    updateGlobalButtons();
    
    // Obtener información del video
    chrome.runtime.sendMessage(
      { action: 'fetchVideoInfo', url },
      (response) => {
        // Buscar el índice del video en el array
        const index = state.videoItems.findIndex(item => item.url === url);
        
        if (index !== -1) {
          if (response && response.success) {
            // Actualizar con la información recibida
            state.videoItems[index] = {
              ...response.info,
              url,
              status: 'ready'
            };
          } else {
            // Marcar como error
            state.videoItems[index] = {
              url,
              title: 'Error al cargar información',
              thumbnail: '',
              duration: '',
              formats: [],
              status: 'error',
              error: response.error || 'Error desconocido'
            };
          }
          
          // Actualizar la interfaz y guardar
          renderVideoList();
          saveVideoList();
        }
      }
    );
  }
  
  // Renderizar la lista de videos
  function renderVideoList() {
    // Limpiar la lista
    elements.videoList.innerHTML = '';
    
    // Actualizar contador
    elements.videoCount.textContent = state.videoItems.length;
    
    if (state.videoItems.length === 0) {
      // Mostrar mensaje de lista vacía
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-list-message';
      emptyMessage.textContent = 'Añade enlaces de videos para descargar';
      elements.videoList.appendChild(emptyMessage);
      return;
    }
    
    // Renderizar cada video
    state.videoItems.forEach((item, index) => {
      const videoElement = createVideoElement(item, index);
      elements.videoList.appendChild(videoElement);
    });
  }
  
  // Crear elemento para un video
  function createVideoElement(item, index) {
    // Clonar la plantilla
    const template = elements.videoItemTemplate.content.cloneNode(true);
    const videoItem = template.querySelector('.video-item');
    
    // Establecer atributos
    videoItem.dataset.url = item.url;
    videoItem.dataset.index = index;
    
    // Elementos del item
    const thumbnail = videoItem.querySelector('.thumbnail img');
    const duration = videoItem.querySelector('.duration');
    const title = videoItem.querySelector('.title');
    const urlDisplay = videoItem.querySelector('.url');
    const qualitySelect = videoItem.querySelector('.quality-select');
    const downloadBtn = videoItem.querySelector('.download-btn');
    const removeBtn = videoItem.querySelector('.remove-btn');
    const statusText = videoItem.querySelector('.status-text');
    const progressBar = videoItem.querySelector('.progress-bar');
    
    // Asignar valores
    if (item.thumbnail) {
      thumbnail.src = item.thumbnail;
      thumbnail.alt = item.title;
    } else {
      thumbnail.src = '../icons/icon128.png';
      thumbnail.alt = 'No hay miniatura disponible';
    }
    
    duration.textContent = item.duration || '';
    title.textContent = item.title || 'Video sin título';
    urlDisplay.textContent = item.url;
    
    // Estado del video
    if (item.status === 'loading') {
      statusText.textContent = 'Cargando información...';
      qualitySelect.disabled = true;
      downloadBtn.disabled = true;
    } else if (item.status === 'error') {
      statusText.textContent = item.error || 'Error al cargar información';
      statusText.className = 'status-text error';
      qualitySelect.disabled = true;
      downloadBtn.disabled = true;
    } else if (item.status === 'downloading') {
      statusText.textContent = 'Descargando...';
      progressBar.style.display = 'block';
      progressBar.value = item.progress || 0;
      qualitySelect.disabled = true;
      downloadBtn.disabled = true;
      removeBtn.disabled = true;
    } else if (item.status === 'downloaded') {
      statusText.textContent = 'Descargado';
      statusText.className = 'status-text success';
    } else {
      // Estado normal (ready)
      statusText.textContent = 'Listo para descargar';
    }
    
    // Llenar opciones de calidad
    if (item.formats && item.formats.length > 0) {
      // Limpiar opciones existentes
      while (qualitySelect.options.length > 1) {
        qualitySelect.remove(1);
      }
      
      // Añadir nuevas opciones
      item.formats.forEach(format => {
        const option = document.createElement('option');
        option.value = format.quality;
        option.textContent = format.label || format.quality;
        qualitySelect.appendChild(option);
      });
      
      // Habilitar botón si hay formatos disponibles
      downloadBtn.disabled = false;
    }
    
    // Configurar eventos
    
    // Botón de descarga
    downloadBtn.addEventListener('click', () => {
      const quality = qualitySelect.value;
      if (quality) {
        downloadVideo(item.url, quality);
      } else {
        showNotification('Selecciona una calidad', 'warning');
      }
    });
    
    // Botón de eliminar
    removeBtn.addEventListener('click', () => {
      removeVideo(index);
    });
    
    return videoItem;
  }
  
  // Descargar un video
  function downloadVideo(url, quality) {
    // Buscar el video en la lista
    const index = state.videoItems.findIndex(item => item.url === url);
    if (index === -1) return;
    
    const video = state.videoItems[index];
    
    // Preparar nombre de archivo
    const videoId = extractVideoId(url);
    const filename = `${sanitizeFilename(video.title || 'youtube')}_${quality}.mp4`;
    
    // Actualizar estado
    state.videoItems[index] = {
      ...video,
      status: 'downloading',
      progress: 0
    };
    
    renderVideoList();
    
    // Solicitar descarga
    chrome.runtime.sendMessage(
      { 
        action: 'downloadVideo', 
        url, 
        quality, 
        filename 
      },
      (response) => {
        if (response && response.success) {
          // Actualizar estado a descargado
          state.videoItems[index] = {
            ...video,
            status: 'downloaded'
          };
        } else {
          // Marcar como error
          state.videoItems[index] = {
            ...video,
            status: 'error',
            error: response.error || 'Error al descargar'
          };
        }
        
        renderVideoList();
        saveVideoList();
      }
    );
  }
  
  // Descargar todos los videos
  function downloadAllVideos() {
    // Verificar si hay videos listos para descargar
    const readyVideos = state.videoItems.filter(item => 
      item.status === 'ready' || item.status === 'error'
    );
    
    if (readyVideos.length === 0) {
      showNotification('No hay videos listos para descargar', 'warning');
      return;
    }
    
    // Preguntar al usuario
    if (!confirm(`¿Descargar ${readyVideos.length} videos?`)) {
      return;
    }
    
    // Iniciar descarga de cada video
    readyVideos.forEach(video => {
      // Seleccionar la mejor calidad disponible
      if (video.formats && video.formats.length > 0) {
        // Preferir 720p, luego 1080p, luego la primera disponible
        const format720p = video.formats.find(f => f.quality === '720p');
        const format1080p = video.formats.find(f => f.quality === '1080p');
        
        const selectedFormat = format720p || format1080p || video.formats[0];
        
        // Iniciar descarga
        downloadVideo(video.url, selectedFormat.quality);
      }
    });
  }
  
  // Eliminar un video
  function removeVideo(index) {
    state.videoItems.splice(index, 1);
    renderVideoList();
    saveVideoList();
    updateGlobalButtons();
  }
  
  // Iniciar el servidor local
  function startLocalServer() {
    elements.startServerBtn.disabled = true;
    elements.startServerBtn.textContent = 'Iniciando...';
    
    chrome.runtime.sendMessage({ action: 'startServer' }, (response) => {
      if (response && response.success) {
        checkServerStatus();
      } else {
        elements.serverStatus.textContent = 'Error al iniciar servidor';
        elements.serverStatus.className = 'offline';
        elements.startServerBtn.disabled = false;
        elements.startServerBtn.textContent = 'Iniciar servidor';
        
        showNotification('Error al iniciar el servidor local: ' + 
          (response && response.error ? response.error : 'Error desconocido'), 'error');
      }
    });
  }
  
  // Guardar la lista de videos
  function saveVideoList() {
    chrome.storage.local.set({ videoList: state.videoItems });
  }
  
  // Actualizar estado de los botones globales
  function updateGlobalButtons() {
    const hasVideos = state.videoItems.length > 0;
    
    elements.clearAllBtn.disabled = !hasVideos;
    elements.downloadAllBtn.disabled = !hasVideos;
  }
  
  // Mostrar notificación
  function showNotification(message, type = 'info') {
    // Esta es una implementación simple que usa console.log
    // En una implementación real, podría mostrar una notificación visual
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Mostrar un toast simple
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
  
  // Extraer ID de video
  function extractVideoId(url) {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.hostname.includes('youtube.com') && urlObj.pathname.includes('/watch')) {
        return urlObj.searchParams.get('v');
      }
      
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.substring(1);
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }
  
  // Sanitizar nombre de archivo
  function sanitizeFilename(filename) {
    return filename
      .replace(/[/\\?%*:|"<>]/g, '-')
      .replace(/\s+/g, '_')
      .substring(0, 100); // Limitar longitud
  }
  
  // Añadir estilos para los toasts
  (function addToastStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .toast {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        padding: 8px 16px;
        border-radius: 4px;
        color: white;
        font-size: 14px;
        opacity: 0;
        transition: transform 0.3s, opacity 0.3s;
        z-index: 1000;
      }
      
      .toast.show {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
      
      .toast-info {
        background-color: var(--accent-color);
      }
      
      .toast-success {
        background-color: var(--success-color);
      }
      
      .toast-warning {
        background-color: var(--warning-color);
      }
      
      .toast-error {
        background-color: var(--error-color);
      }
    `;
    
    document.head.appendChild(style);
  })();