const { app, BrowserWindow, protocol, ipcMain, dialog, globalShortcut, ipcRenderer, contextBridge } = require('electron');
const path = require('path');
const url = require('url');
const Store = require('electron-store');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');
const YTMusic = require("ytmusic-api");
const routes = require('./routes');
const mineflayer = require('mineflayer');
const AutoAuth = require('mineflayer-auto-auth');
const fileHandler = require('./fileHandler');
const socketHandler = require('./socketHandler');
const { RCONClient } = require('@minecraft-js/rcon');

class MinecraftRCON {
  constructor(host, password, port) {
      this.host = host;
      this.password = password;
      this.port = port;
      this.client = new RCONClient(host, password, port);
      this.connected = false; // Variable para rastrear el estado de la conexión
  }

  async connect() {
      try {
          await this.client.connect();
          this.connected = true;
          console.log(`Connected to RCON server at ${this.host}:${this.port}`);
      } catch (error) {
          this.connected = false;
          console.error('Error connecting to RCON:', error);
          throw error;
      }
  }

  async executeCommand(command) {
      if (!this.connected) {
          throw new Error('Not connected to RCON server');
      }
      return await this.client.executeCommand(command);
  }

  disconnect() {
      this.client.disconnect();
      this.connected = false;
      console.log('Disconnected from RCON server');
  }

  setupListeners() {
      this.client.on('authenticated', () => {
          this.connected = true;
          console.log('Authenticated with RCON');
          // Puedes ejecutar comandos aquí después de la autenticación
          this.executeCommand('say Hello from RCON!');
      });

      this.client.on('error', (err) => {
          this.connected = false;
          console.error('RCON Error:', err);
          // Maneja los errores de conexión o ejecución de comandos
      });

      this.client.on('response', (requestId, packet) => {
          console.log('Response from server:', packet);
          // Maneja las respuestas del servidor aquí
      });

      this.client.on('end', () => {
          this.connected = false;
          console.log('RCON connection ended');
      });
  }

  isConnected() {
    if (this.connected) {
      return {
        success: true,
        status: 'Bot is created and ready',
        reconnectAttempts: this.reconnectAttempts,
        maxReconnectAttempts: this.maxReconnectAttempts
      };
    } else {
      return { success: false, error: 'Bot not created' };
    }
      
  }
}

const updateHandler = require('./updateHandler');
const WebSocket = require('ws');
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
  const { fileToAdd, fileName, filePath } = fileParams;

  try {
      if (filePath) {
          // Si se proporciona un filePath, simplemente registre su información
          const savedFilePath = fileHandler.registerFile(filePath, fileName);
          console.log(`El archivo "${fileName}" se ha registrado correctamente.`);
          return { success: true, filePath: savedFilePath };
      } else {
          // Si no se proporciona un filePath, se muestra el diálogo para guardar el archivo
          const { canceled, filePath: dialogFilePath } = await dialog.showSaveDialog({
              title: 'Guardar archivo',
              defaultPath: fileName
          });

          if (!canceled) {
              const savedFilePath = fileHandler.addOrReplaceFile(fileToAdd, fileName, path.dirname(dialogFilePath));
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
class BotManager {
  constructor() {
    this.bot = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
  }

  createBot(event, options, keyLOGIN) {
    if (!keyLOGIN) {
      console.error('keyLOGIN is undefined or null');
      event.sender.send('bot-event', 'error', { message: 'keyLOGIN is undefined or null' });
      return;
    }

    if (keyLOGIN) {
      keyLOGIN = keyLOGIN.replace('/login ', '').replace('/register ', '');
      console.log("createBot with keyLOGIN:", keyLOGIN);
      options.plugins = [AutoAuth];
      options.AutoAuth = {
        logging: true,
        password: keyLOGIN, // Use keyLOGIN as password if it starts with '/'
        ignoreRepeat: true
      };
    }

    this.bot = mineflayer.createBot(options);

    this.bot.on('login', () => {
      console.log('Bot logged in');
      event.sender.send('bot-event', 'login');
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful login
      // Si el comando inicial empieza con '/', enviar mensaje de chat
      if (keyLOGIN.startsWith('/')) {
        this.sendMessage(keyLOGIN);
      }
    });

    this.bot.on('chat', (username, message) => {
      console.log(`${username}: ${message}`);
      event.sender.send('bot-event', 'chat', { username, message });
    });

    this.bot.on('end', () => {
      console.log('Bot disconnected');
      event.sender.send('bot-event', 'end');
      this.handleReconnect(event, options, keyLOGIN);
    });

    this.bot.on('error', (error) => {
      console.error('Bot error:', error);
      this.handleReconnect(event, options, keyLOGIN);
    });

    this.bot.on('serverAuth', () => {
      console.log('Bot authenticated');
      event.sender.send('bot-event', 'authenticated');
    });

    // Agregar manejo de errores para el evento de respawn
    this.bot.on('respawn', () => {
      try {
        // Verificar que el bot y su mundo estén definidos
        if (this.bot && this.bot.world && this.bot.world.overworld) {
          handleRespawnPacketData(this.bot); // Asegúrate de que esta función está bien definida
        } else {
          console.error('Bot world or overworld is undefined');
        }
      } catch (error) {
        console.error('Error handling respawn:', error);
      }
    });
  }

  handleReconnect(event, options, keyLOGIN) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts}`);
      setTimeout(() => {
        this.createBot(event, options, keyLOGIN); // Attempt to reconnect
      }, 1000); // Delay before reconnecting
    } else {
      console.log('Max reconnection attempts reached');
      event.sender.send('bot-event', 'reconnection-failed');
    }
  }

  sendMessage(message) {
    if (this.bot && this.bot.chat) {
      this.bot.chat(message);
      return { success: true };
    } else {
      return { success: false, error: 'Bot not created or not ready' };
    }
  }

  getStatus() {
    if (this.bot) {
      return {
        success: true,
        status: 'Bot is created and ready',
        reconnectAttempts: this.reconnectAttempts,
        maxReconnectAttempts: this.maxReconnectAttempts
      };
    } else {
      return { success: false, error: 'Bot not created' };
    }
  }

  on(event, callback) {
    if (this.bot) {
      this.bot.on(event, callback);
    }
  }

  end() {
    if (this.bot) {
      this.bot.end();
    }
  }

  quit() {
    if (this.bot) {
      this.bot.quit();
    }
  }
}

const botManager = new BotManager();
const rcon = new MinecraftRCON('209.222.98.146', 'hello', 25795);


ipcMain.handle('create-bot', (event, options, keyLOGIN) => {
  console.log("createbot", event, options, keyLOGIN); // Asegúrate de que keyLOGIN se imprime aquí
  // botManager.createBot(event, options, keyLOGIN);
  rcon.connect();
  rcon.setupListeners();
  return new Promise((resolve) => {
    setTimeout(() => {
      // if (botManager.bot && botManager.bot.chat) {
      //   resolve({ success: true });
      // } else {
      //   resolve({ success: true, error: 'Bot not created' });
      // }
      if (rcon.isConnected()) {
        resolve({ success: true });
      } else {
        resolve({ success: false, error: 'Bot not created' });
      }
    }, 1000);
  });
});

ipcMain.handle('send-chat-message', (event, message) => {
  const command = message.replace(/^\/?/, '');
  rcon.executeCommand(command);

  return botManager.sendMessage(message);
});

ipcMain.handle('bot-status', () => {
  return rcon.isConnected();
  // return botManager.getStatus();
});

let oscClient2;
ipcMain.handle('create-client-osc', () => {
const defaultClientPort = 9000;
const defaultClientIP = '127.0.0.1';
const oscClient = new Client(defaultClientIP, defaultClientPort);

const server = new ServerOsc(9001, '127.0.0.1');
server.on('listening', () => {
    console.log('OSC Server is listening.');
});
oscClient2 = oscClient
// oscClient.on('listening', () => {
//     console.log('OSC Client is listening.');
// });

return { success: true };
});

ipcMain.handle('send-osc-message', (event, message) => {
if (oscClient2) {
  oscClient2.send('/chatbox/input', message, () => {
      console.log('OSC message sent:', message);
  });
  return { success: true };
}
return { success: false, error: 'OSC Client not created' };
});
ipcMain.handle('update', (event, message) => {
  console.log('update', message);
  updateHandler.checkForUpdatesManually(); // Llamar a la función para verificar actualizaciones manualmente
  return { success: true };
});