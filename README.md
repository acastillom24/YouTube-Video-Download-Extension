# YouTube-Video-Download-Extension

Esta extensión para navegadores basados en Chromium (Chrome, Brave, Edge) permite descargar videos de YouTube de manera sencilla. La interfaz permite pegar múltiples enlaces de videos, obtener información de cada uno (título, duración, miniatura) y ofrecer opciones de descarga en diferentes calidades.

![Captura de pantalla](screenshots/preview.png)

## Características

- Interfaz sencilla para gestionar múltiples videos
- Extracción automática de metadatos (título, duración, miniatura)
- Opciones de descarga en diferentes calidades (360p, 720p, 1080p si están disponibles)
- Descarga directa desde la extensión o mediante servidor local
- Historial de descargas
- Posibilidad de añadir el video de la pestaña actual

## Requisitos

- Navegador basado en Chromium (Chrome, Brave, Edge)
- Node.js v14 o superior (para el servidor local)

## Instalación

### Modo desarrollador (extensión no empaquetada)

1. Clona este repositorio o descárgalo como archivo ZIP:
   ```
   git clone https://github.com/tu-usuario/youtube-downloader.git
   ```

2. Abre tu navegador y ve a la página de extensiones:
   - Chrome: `chrome://extensions/`
   - Brave: `brave://extensions/`
   - Edge: `edge://extensions/`

3. Activa el "Modo desarrollador" (interruptor en la esquina superior derecha)

4. Haz clic en "Cargar descomprimida" (o "Cargar sin empaquetar")

5. Selecciona la carpeta donde clonaste/descargaste el repositorio

6. La extensión ahora debería aparecer en tu navegador y estar lista para usar

### Instalación del servidor local (opcional)

Si experimentas problemas de CORS al descargar algunos videos, puedes usar el servidor local incluido:

1. Navega a la carpeta `server` del repositorio:
   ```
   cd youtube-downloader/server
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

3. Inicia el servidor:
   ```
   npm start
   ```

4. El servidor se ejecutará en `http://localhost:3000`

## Generar archivo empaquetado (.zip o .crx)

### Método 1: Archivo ZIP

1. Comprime la carpeta del proyecto (excluyendo node_modules y archivos temporales):
   ```
   zip -r youtube-downloader.zip . -x "*/node_modules/*" "*/temp/*" "*.git*"
   ```
   
   O simplemente usa cualquier herramienta de compresión para crear un ZIP con los archivos de la extensión.

2. El archivo `youtube-downloader.zip` puede ser distribuido y utilizado para instalar la extensión.

### Método 2: Archivo CRX (Chrome Extension)

1. Primero, empaqueta la extensión desde Chrome:
   - Ve a `chrome://extensions/`
   - Activa el "Modo desarrollador"
   - Haz clic en "Empaquetar extensión"
   - Selecciona la carpeta del proyecto
   - Chrome generará un archivo `.crx` y una clave privada `.pem`

2. Guarda tanto el archivo `.crx` como el `.pem` (la clave es necesaria para futuras actualizaciones)

## Instalar archivo empaquetado

### Instalar un archivo ZIP

1. Descomprime el archivo ZIP en una ubicación permanente en tu sistema.
2. Sigue los pasos descritos en "Modo desarrollador" para cargar la extensión descomprimida.

### Instalar un archivo CRX

#### En Chrome/Brave (método sencillo):

1. Arrastra y suelta el archivo `.crx` en la página de extensiones (`chrome://extensions/`)

#### En Chrome/Brave (si el método anterior no funciona):

1. Renombra el archivo `.crx` a `.zip`
2. Descomprime el archivo
3. Carga la extensión como "descomprimida" siguiendo los pasos anteriores

#### En Edge:

1. Edge no permite instalar archivos `.crx` directamente de fuentes desconocidas
2. Usa el método de extensión descomprimida (carga sin empaquetar)

## Uso

1. Haz clic en el icono de la extensión en la barra de herramientas
2. Pega un enlace de YouTube en el campo de texto y haz clic en "Añadir"
3. Alternativamente, si ya estás viendo un video de YouTube, haz clic en "Añadir pestaña actual"
4. La extensión extraerá la información del video
5. Selecciona la calidad deseada y haz clic en "Descargar"
6. Si tienes múltiples videos, puedes usar "Descargar todos" para descargarlos todos a la vez

## Solución de problemas

- **La descarga no funciona**: Algunas restricciones de YouTube pueden impedir la descarga directa. Intenta iniciar el servidor local incluido.
- **Error de CORS**: Inicia el servidor local incluido y la extensión lo utilizará automáticamente.
- **Calidades no disponibles**: No todos los videos tienen todas las calidades disponibles. La extensión mostrará solo las calidades que YouTube ofrece.

## Advertencia legal

Esta extensión es solo para uso educativo y personal. Descargar contenido con derechos de autor puede infringir los términos de servicio de YouTube y las leyes de propiedad intelectual. Asegúrate de descargar solo contenido que tengas permiso para descargar.

## Contribuciones

Las contribuciones son bienvenidas. Siente libre de abrir un issue o enviar un pull request.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.