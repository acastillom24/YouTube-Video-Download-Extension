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

## Cliente de Prueba para Depuración

Esta extensión incluye un cliente de prueba HTML independiente que te permite verificar el funcionamiento del servidor local sin necesidad de interactuar con la extensión del navegador. Esta herramienta es extremadamente útil para:

- Diagnosticar problemas de conexión con YouTube
- Probar actualizaciones o cambios en las bibliotecas subyacentes
- Verificar si los errores provienen del servidor o de la extensión
- Comprobar la disponibilidad de diferentes formatos de video

### Cómo usar el Cliente de Prueba

1. **Inicia el servidor local**:
   ```bash
   cd server
   npm install
   node server.js
   ```

2. **Accede al cliente de prueba**:
   Abre en tu navegador: [http://localhost:3000/test-client.html](http://localhost:3000/test-client.html)

3. **Verifica la conexión**:
   El cliente mostrará si el servidor está conectado y funcionando correctamente.

4. **Prueba una URL de YouTube**:
   - Pega una URL de video de YouTube en el campo de texto
   - Haz clic en "Obtener Info"
   - El sistema mostrará la información del video y las opciones de descarga disponibles

5. **Descarga un video de prueba**:
   Haz clic en el botón "Descargar" junto a la calidad deseada para iniciar la descarga directamente.

### Mantenimiento y Actualizaciones

El cliente de prueba es especialmente útil cuando YouTube realiza cambios en su plataforma que pueden afectar la funcionalidad de descarga. Si experimentas problemas con la extensión:

1. Prueba primero utilizando el cliente de prueba para identificar si el problema está en el servidor o en la extensión
2. Actualiza la biblioteca `@distube/ytdl-core` a la última versión:
   ```bash
   cd server
   npm update @distube/ytdl-core@latest
   ```
3. Reinicia el servidor y verifica si el problema se ha resuelto

### Ubicación del archivo

El cliente de prueba se encuentra en:
```
YouTube-Video-Downloader-Extension/
└── server/
    └── public/
        └── test-client.html
```

Para utilizarlo, asegúrate de que la carpeta `public` exista dentro del directorio `server` y que la línea `app.use(express.static(PUBLIC_DIR));` esté presente en tu archivo `server.js`.

## Advertencia legal

Esta extensión es solo para uso educativo y personal. Descargar contenido con derechos de autor puede infringir los términos de servicio de YouTube y las leyes de propiedad intelectual. Asegúrate de descargar solo contenido que tengas permiso para descargar.

## Créditos y Agradecimientos

Este proyecto utiliza las siguientes bibliotecas y herramientas de código abierto:

### Bibliotecas principales

- [@distube/ytdl-core](https://github.com/distubejs/ytdl-core) - Un fork mantenido de ytdl-core con actualizaciones frecuentes para adaptarse a los cambios de la API de YouTube. Esta biblioteca es el componente central que permite la extracción de información y descarga de videos.

- [Express](https://expressjs.com/) - Framework web para Node.js utilizado en el servidor local.

- [CORS](https://github.com/expressjs/cors) - Middleware para habilitar CORS (Cross-Origin Resource Sharing).

## Contribuciones

Las contribuciones son bienvenidas. Siente libre de abrir un issue o enviar un pull request.
Si encuentras útil esta extensión, considera dar una estrella ⭐ al proyecto en GitHub y también al proyecto [@distube/ytdl-core](https://github.com/distubejs/ytdl-core) que hace posible la funcionalidad principal.

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.