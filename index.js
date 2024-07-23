const { app, BrowserWindow, protocol, ipcMain, dialog, globalShortcut, ipcRenderer, contextBridge } = require('electron');
const path = require('path');
const url = require('url');
const Store = require('electron-store');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');
const YTMusic = require("ytmusic-api");
const routes = require('./routes');
const fileHandler = require('./fileHandler');
const { BotManager } = require('./botManager');
const botManager = new BotManager();
const socketHandler = require('./socketHandler');
const updateHandler = require('./updateHandler');
const { downloadYouTubeBuffer } = require('./mediamanager/youtubeDownloader');
ipcMain.handle('download-mp3', async (event, url) => {
  console.log('download-mp3', url);
  try {
      const buffer = await downloadYouTubeBuffer(url, { format: 'mp3', quality: 'high' });
      return `data:audio/mp3;base64,${buffer.toString('base64')}`;
  } catch (error) {
      console.error('Error al descargar:', error);
      throw error;
  }
});

let ws = null;
const store = new Store(); 
let port = process.env.PORT || 8081;
(async () => {
  const ytmusic = new YTMusic();
  await ytmusic.initialize(/* Optional: Custom cookies */);

  ipcMain.handle('search-song', async (event, query) => {
      try {
          const songs = await ytmusic.search(query);
          return songs;
      } catch (err) {
          console.error('Error:', err);
          throw err;
      }
  });
})();

// Evento emitido cuando Electron ha terminado de inicializarse
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: store.get('windowWidth', 1000), // Obtener el ancho de la ventana desde Electron Store, si no está definido, usar 1000
    height: store.get('windowHeight', 800), // Obtener la altura de la ventana desde Electron Store, si no está definida, usar 800
    minWidth: 800, // Ancho mínimo de la ventana
    minHeight: 600, // Alto mínimo de la ventana
    titleBarStyle: 'hidden',
    titleBarOverlay: {
        color: '#cfd4ff',
        symbolColor: '#030238',
        height: 25
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, // Importante: deshabilitar nodeIntegration por seguridad
      contextIsolation: true,
      worldSafeExecuteJavaScript: true,
      webSecurity: false,
  }
});
  // loadFile public/index.html mainWindow
  // mainWindow.loadURL(`file://${__dirname}/public/index.html`);
  // mainWindow.loadURL('http://localhost:' + port + '/index.html');
  // establecer cookies para mainWindow con webContents
  mainWindow.loadURL(`http://localhost:${port}/index.html`);
}
app.disableHardwareAcceleration()
app.on('ready', () => {
  protocol.registerFileProtocol('custom', (request, callback) => {
    const filePath = request.url.replace('custom://', '');
    const fileUrl = path.join(__dirname, filePath);
    callback({ path: fileUrl });
  });
  const express = require('express');
  const { createServer } = require('http');
  const cors = require('cors');

  const app1 = express();

  app1.use(cors());
  app1.use(express.json());
  app1.use('/api', routes);
  const httpServer = createServer(app1);
  const io = socketHandler.initSocket(httpServer);
  app1.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  app1.use(express.static(path.join(__dirname, 'public')));
  httpServer.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use`);
      port++;
      httpServer.listen(port);
      console.log(` trying the next one. ${port}`);
    } else {
      console.error('Server error:', error);
    }
  });
  // Emit global connection statistics
  setInterval(() => {
      io.emit('statistic', { globalConnectionCount: getGlobalConnectionCount() });
  }, 5000)

  // Iniciar el servidor HTTP
  httpServer.listen(port);
  console.info(`Server running! Please visit http://localhost:${port}`);
  createWindow();
  // Evento emitido cuando la ventana se cierra
  mainWindow.on('closed', function () {
    mainWindow = null;
    app.quit();
  });

  mainWindow.on('focus', () => {
    globalShortcut.register('Alt+F1', ToolDev);
    globalShortcut.register('Alt+F2', cdevTool);
    globalShortcut.register('Alt+F5', refreshPage);
  
    function ToolDev() {
      mainWindow.webContents.openDevTools();
    }
  
    function cdevTool() {
      mainWindow.webContents.closeDevTools();
    }
  
    function refreshPage() {
      mainWindow.webContents.reload(); // Reload the page on F5
    }
  });
  mainWindow.on('resize', () => {
    const { width, height } = mainWindow.getBounds();
    store.set('windowWidth', width);
    store.set('windowHeight', height);
  });


  updateHandler.initAutoUpdates();
});
//appready event

// Salir cuando todas las ventanas estén cerradas
app.on('window-all-closed', function () {
  // En macOS, es común que las aplicaciones y su barra de menú se mantengan activas
  // hasta que el usuario salga explícitamente con Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // En macOS, es común volver a crear una ventana en la aplicación cuando
  // el icono del muelle se hace clic y no hay otras ventanas abiertas.
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.handle('add-file-path', async (event, fileParams) => {
  const { fileToAdd, fileName, filePath, isWebFile, isClipboardFile } = fileParams;
  try {
    if (isWebFile || isClipboardFile) {
      // Procesar archivo web o del portapapeles
      const downloadsPath = app.getPath('downloads');
      const result = await fileHandler.processWebFile(fileToAdd, fileName, downloadsPath);
      if (result.success) {
        console.log(`El archivo "${fileName}" se ha guardado y registrado correctamente.`);
        return { success: true, filePath: result.filePath };
      } else {
        return { success: false, error: result.error };
      }
    } else if (filePath) {
      // Registrar archivo local existente
      const savedFilePath = fileHandler.registerFile(filePath, fileName);
      console.log(`El archivo "${fileName}" se ha registrado correctamente.`);
      return { success: true, filePath: savedFilePath };
    } else {
      // Guardar nuevo archivo local
      const { canceled, filePath: dialogFilePath } = await dialog.showSaveDialog({
        title: 'Guardar archivo',
        defaultPath: fileName
      });
      if (!canceled) {
        const savedFilePath = await fileHandler.addOrReplaceFile(fileToAdd, fileName, path.dirname(dialogFilePath));
        console.log(`El archivo "${fileName}" se ha agregado o reemplazado correctamente.`);
        return { success: true, filePath: savedFilePath };
      }
    }
  } catch (err) {
    console.error('Error adding file path:', err);
    return { success: false, error: err.message };
  }
});
ipcMain.handle("get-files-in-folder", async () => {
  try {
      return fileHandler.getFilesInfo();
  } catch (err) {
      console.error('Error getting files:', err);
      return [];
  }
});
ipcMain.handle("get-file-by-id", async (event, fileId) => {
  try {
      return fileHandler.getFileById(fileId);
  } catch (err) {
      console.error('Error getting file by id:', err);
      return null;
  }
});
ipcMain.handle("get-file-by-name", async (event, fileIdname) => {
  try {
      return fileHandler.getFileByname(fileIdname);
  } catch (err) {
      console.error('Error getting file by name:', err);
      return null;
  }
});
ipcMain.handle("delete-file", async (_, fileName) => {
  try {
      fileHandler.deleteFile(fileName);
      console.log(`delete-file: ${fileName} deleted successfully.`);
      return { success: true, message: `File "${fileName}" deleted successfully.` };
  } catch (err) {
      console.error('Error deleting file:', err);
      return { success: false, message: `Error deleting file: ${err.message}` };
  }
});
ipcMain.handle('get-downloads-path', () => {
  return app.getPath('downloads');
});
ipcMain.handle('process-web-file', async (event, { buffer, fileName }) => {
  try {
    const downloadsPath = app.getPath('downloads');
    const result = await fileHandler.processWebFile(buffer, fileName, downloadsPath);
    if (result.success) {
      console.log(`El archivo "${fileName}" se ha guardado y registrado correctamente.`);
      return { success: true, filePath: result.filePath };
    } else {
      return { success: false, error: result.error };
    }
  } catch (err) {
    console.error('Error processing web file:', err);
    return { success: false, error: err.message };
  }
});
ipcMain.handle("on-drag-start", async (event, fileName) => {
  try {
      const filesInfo = fileHandler.getFilesInfo();
      const fileInfo = filesInfo.find(file => file.name === fileName);
      console.log('on-drag-start', fileInfo);
      if (fileInfo) {
          const filePath = fileInfo.path;
          if (!fs.existsSync(filePath)) {
              throw new Error(`File "${filePath}" does not exist.`);
          }
      } else {
          throw new Error(`File "${fileName}" not found in filesInfo.`);
      }
  } catch (err) {
      console.error('Error starting drag:', err);
  }
});
// main.js
let overlayWindow;

// Canal IPC para crear la ventana emergente
ipcMain.handle('create-overlay-window', () => {
  if (!overlayWindow) {
      overlayWindow = new BrowserWindow({
          // width: 800,
          // height: 600,
          fullscreen: true,  // Configura la ventana en pantalla completa
          frame: false,
          transparent: true,
          alwaysOnTop: true,
          webPreferences: {
              nodeIntegration: true,
              preload: path.join(__dirname, 'preload.js')
          }
      });
      overlayWindow.webContents.setFrameRate(60)
      overlayWindow.loadFile('public/overlay.html');

      overlayWindow.on('closed', () => {
          overlayWindow = null;
      });

      overlayWindow.once('ready-to-show', () => {
          overlayWindow.webContents.send('show-message', 'Hola desde el proceso principal!');
      });
  }

  overlayWindow.setIgnoreMouseEvents(true);
  overlayWindow.on('mousedown', (event) => {
      overlayWindow.setIgnoreMouseEvents(true);
  });
  overlayWindow.on('mouseup', (event) => {
      overlayWindow.setIgnoreMouseEvents(true);
  });
  overlayWindow.on('focus', (event) => {
      overlayWindow.setIgnoreMouseEvents(true);
  });
  return { success: true };
});

// Canal IPC para enviar datos a la ventana emergente
ipcMain.handle('send-overlay-data', (_, { eventType, data, options }) => {
  if (overlayWindow) {
      overlayWindow.webContents.send('overlay-event', { eventType, data, options });
      console.log('Overlay event sent', eventType, data, options);
      return { success: true };
  } else {
      return { success: false, error: 'Overlay window not created yet' };
  }
});
// IPC Handlers
ipcMain.handle('create-bot', async (event, options, keyLOGIN) => {
  return await botManager.createBot(options, keyLOGIN);
});

ipcMain.handle('create-rconclient', async (event, options, keyLOGIN) => {
  return await botManager.createRconClient(options, keyLOGIN);
});

ipcMain.handle('send-chat-message', async (event, message) => {
  return await botManager.sendMessage(message);
});

ipcMain.handle('bot-status', () => {
  return botManager.getStatus();
});

// Event forwarding to renderer
botManager.on('connected', () => {
  // Asume que tienes una referencia a tu ventana principal llamada 'mainWindow'
  mainWindow.webContents.send('bot-event', 'connected');
});

botManager.on('disconnected', () => {
  mainWindow.webContents.send('bot-event', 'disconnected');
});

botManager.on('chat', (data) => {
  mainWindow.webContents.send('bot-event', 'chat', data);
});

botManager.on('error', (error) => {
  mainWindow.webContents.send('bot-event', 'error', error.message);
});

botManager.on('reconnecting', (attempt) => {
  mainWindow.webContents.send('bot-event', 'reconnecting', attempt);
});

botManager.on('reconnection-failed', () => {
  mainWindow.webContents.send('bot-event', 'reconnection-failed');
});


ipcMain.handle('update', (event, message) => {
  console.log('update', message);
  updateHandler.checkForUpdatesManually(); // Llamar a la función para verificar actualizaciones manualmente
  return { success: true };
});