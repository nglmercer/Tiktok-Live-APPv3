const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
const url = require('url');
const Store = require('electron-store');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');
const routes = require('./routes');
const socketHandler = require('./socketHandler');
const updateHandler = require('./updateHandler');

const store = new Store(); 
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
  hardResetMethod: 'exit'
});
// Evento emitido cuando Electron ha terminado de inicializarse
app.on('ready', () => {
  const express = require('express');
  const { createServer } = require('http');
  const cors = require('cors');

  const port = process.env.PORT || 8081;
  const app1 = express();

  app1.use(cors());
  app1.use(express.json());
  app1.use('/api', routes);
  let mainWindow = new BrowserWindow({
    width: store.get('windowWidth', 1000), // Obtener el ancho de la ventana desde Electron Store, si no está definido, usar 1200
    height: store.get('windowHeight', 800), // Obtener la altura de la ventana desde Electron Store, si no está definida, usar 1000
    minWidth: 800, // Ancho mínimo de la ventana
    minHeight: 600, // Alto mínimo de la ventana
    frame: true,
    transparent: true,
    alwaysOnTop: false,
    
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: 'gray',
      symbolColor: '#00000081',
      height: 20
    },
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: true,
			webSecurity: false,
		},
    maximizable: true
  });
  mainWindow.loadURL(`http://localhost:${port}`);
  // Evento emitido cuando la ventana se cierra
  mainWindow.on('closed', function () {
    mainWindow = null;
    app.quit();
  });

  mainWindow.webContents.setFrameRate(60)
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

  const httpServer = createServer(app1);
  const io = socketHandler.initSocket(httpServer);
  
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
    createMainWindow();
  }
});
