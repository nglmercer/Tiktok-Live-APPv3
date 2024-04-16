const { app, BrowserWindow, globalShortcut, localStorage, autoUpdater, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const Store = require('electron-store');
const server = 'https://update.electronjs.org'
const feed = `${server}/nglmercer/Tiktok-Live-TTS-APPv2/${process.platform}-${process.arch}/${app.getVersion()}`
const isSquirrelInstalled = fs.existsSync('squirrel-installed.txt');

autoUpdater.setFeedURL(feed)
if (isSquirrelInstalled) {
  setInterval(() => {
    autoUpdater.checkForUpdates()
    console.log(feed);
  }, 600 * 1000) // 600 segundos
}

const store = new Store(); 

/*
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});//*/

// Evento emitido cuando Electron ha terminado de inicializarse
app.on('ready', () => {
  const express = require('express');
  const { createServer } = require('http');
  const { Server } = require('socket.io');
  const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');
  const { clientBlocked } = require('./limiter');
  const cors = require('cors');
  const mineflayer = require('mineflayer');
  const { Client, Server: ServerOsc } = require('node-osc');

  const client = new Client('127.0.0.1', 9000);
  const server2 = new ServerOsc(9001, '127.0.0.1');
  server2.on('listening', () => {
    console.log('OSC Server is listening.');
  });
  let port = process.env.PORT || 8081;

  const app1 = express();
  // CONFIGURACION DE EJEMPLO
  //let keyBOT = null; // BOT MINECRAFT DAR OP
  //let keySERVER = null; // IP SERVER
  //const keySERVERPORT = '25565'; // PUERTO SERVER
  let mainWindow = new BrowserWindow({
    width: store.get('windowWidth', 1000), // Obtener el ancho de la ventana desde Electron Store, si no está definido, usar 1200
    height: store.get('windowHeight', 800), // Obtener la altura de la ventana desde Electron Store, si no está definida, usar 1000
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
      nodeIntegration: true,
    }
  });

  mainWindow.loadURL(`http://localhost:${port}`);
  // Evento emitido cuando la ventana se cierra
  mainWindow.on('closed', function () {
    mainWindow = null;
    app.quit();
  });
  let bot;
  let botStatus = false;
  let disconnect = false;
  app1.use(cors());
  app1.use(express.json());
  const ventanaAbierta = store.get('ventanaAbierta');

  let overlayWindow;
  const url = store.get('url');
  if (ventanaAbierta) {
      createOverlay(url);
  } else {
  }


  app1.post('/crear-overlay', (req, res) => {
    store.set('ventanaAbierta', true);

    const { url, width, height } = req.body;
    createOverlay(url, width, height);
    res.status(200).json({ message: 'Overlay creado correctamente' });
  });

  function createOverlay(url, width , height ) {
    store.set('ventanaAbierta', true);

    overlayWindow = new BrowserWindow({
      width: parseInt(width),
      height: parseInt(height),
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true
      }
    });
    
    overlayWindow.loadURL(url);
    overlayWindow.webContents.on('did-finish-load', () => {
      overlayWindow.webContents.insertCSS(`
        #draggable-bar {
          -webkit-app-region: drag;
          width: 100%;
          height: 20px;
          background-color: rgba(0, 0, 0, 0.3);
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
        }
      `);
  
      overlayWindow.webContents.executeJavaScript(`
        const draggableBar = document.createElement('div');
        draggableBar.id = 'draggable-bar';
        document.body.appendChild(draggableBar);
      `);
    });
    overlayWindow.on('closed', () => {
      if (mainWindow) {
      store.set('ventanaAbierta', false);
      }
      overlayWindow = null;
    });

    globalShortcut.register('F11', () => {
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        store.set('ventanaAbierta', false);
        overlayWindow.close();
      }
    });

    // Guardar la URL en localStorage
      store.set('url', url);
  }
  let commandCount = 0;
  let lastMinuteTimestamp = Date.now();
  mainWindow.webContents.setFrameRate(60)
  const COMMAND_LIMIT = 1; // Límite de comandos por minuto
  const DELAY_PER_COMMAND = 10; // Retraso en milisegundos por cada comando adicional
  
  app1.post('/api/receive', (req, res) => {
    const { replacedCommand } = req.body;
    const currentTimestamp = Date.now();
  
    // Calcular el retraso base en base al número de comandos
    const additionalDelay = Math.floor(commandCount / COMMAND_LIMIT) * DELAY_PER_COMMAND;

    // Inicializar el retraso
    let delay = 0;

    // Verificar si replacedCommand es un número
    if (!isNaN(replacedCommand)) {
        delay = parseInt(replacedCommand) + 20;
    } else {
        delay = additionalDelay;
    }
  
    // Aplicar el retraso
    setTimeout(() => {
      if (botStatus) {
        bot.chat(replacedCommand);
      }
      //console.log('comando minecraft', replacedCommand);
      
    }, delay);
    res.json({ message: 'Datos recibidos' });
    // Incrementar el contador de comandos después de haber asignado el retraso
    commandCount++;
    
    //console.log(`Comando recibido. Retraso adicional: ${additionalDelay}ms`);
  });

  app1.post('/guardarEstado', (req, res) => {
    const state = req.body.state; // Obtiene el estado del cuerpo de la petición
    store.set('state', state);

    console.log('Estado guardado:', state);
    res.sendStatus(200); // Envía una respuesta de éxito al cliente
  });


  app1.post('/api/receive1', (req, res) => {
    const { eventType, data } = req.body;
  
    switch (eventType) {
      case 'chat':
        setTimeout(() => {
        console.log(`${data.uniqueId} : ${data.comment}`);
        sendChatMessage(`${data.uniqueId} : ${data.comment}`);
        }, 500); // antes de enviar el comando
        break;
      case 'gift':
        if (data.giftType === 1 && !data.repeatEnd) {
          console.log(`${data.uniqueId} envio ${data.giftName} x${data.repeatCount}`);
          setTimeout(() => {
            sendChatMessage(`${data.uniqueId} envio ${data.giftName} x${data.repeatCount}`);
          }, 500);
          } else if (data.repeatEnd) {
            console.log(`${data.uniqueId} envio ${data.giftName} x${data.repeatCount}`);
              // Streak ended or non-streakable gift => process the gift with final repeat_count
              sendChatMessage(`${data.uniqueId} envio ${data.giftName} x${data.repeatCount}`);
            }
        break;
      case 'social':
        if (data.displayType.includes('follow')) {
          console.log(`${data.uniqueId} te sigue`);
          sendChatMessage(`${data.uniqueId} te sigue`);
        }
        if (data.displayType.includes('share')) {
          console.log(`${data.uniqueId} ha compartido`);
          sendChatMessage(`${data.uniqueId} ha compartido`);
        }
        break;
      case 'streamEnd':
        sendChatMessage('Fin de la transmisión en vivo');
        break;
      default:
        console.log(`Evento desconocido: ${eventType}`);
    }
  
    res.json({ message: 'Datos recibidos receive1' });
  });
  app1.post('/api/create', (req, res) => {
    const { eventType, data } = req.body;
  
    if (eventType === 'createBot') {
      const { keyBot, keyServer, Initcommand } = data;
      if (keyBot && keyServer) {
        if (!bot) {
          const serverParts = keyServer.split(':');
          const serverAddress = serverParts[0];
          const serverPort = serverParts[1] ? parseInt(serverParts[1]) : null;
          setTimeout(() => {
              createBot(keyBot, serverAddress, serverPort);
          }, 3000);
          bot.once('login', () => {
            bot.chat(Initcommand);
            ///fill 166 122 -26 180 134 -12 minecraft:diamond_block
          });
          const startPos = { x: 166, y: 122, z: -26 };
          const endPos = { x: 180, y: 134, z: -12 };
          res.json({ message: 'Bot creado' });
        } else {
          res.json({ message: 'Bot ya está conectado', botStatus });
        }
      } else if (!disconnect) {
        setTimeout(() => {
            createBot(keyBot, serverAddress, serverPort);
        }, 3000);
        bot.once('login', () => {
          res.json({ message: 'Bot creado sin puerto', botStatus });
          bot.chat(Initcommand);
        });
      }
    } else if (eventType === 'disconnectBot') {
      botStatus = false;
      disconnect = true;
      removeBot();
      res.json({ message: 'Bot desconectado', botStatus });
    } else {
      res.json({ message: 'Datos recibidos', botStatus });
    }
  });

  
  function sendChatMessage(text) {
    client.send('/chatbox/input', text, true);
  }
  
  function createBot(keyBot, keyServer, keyServerPort, maxAttempts = 5) {
    console.log("createBot now...");
  
    let attemptCount = 1; // Track the number of connection attempts
  
    if (!botStatus) {
      const botOptions = {
        host: keyServer,
        username: keyBot,
      };
  
      if (keyServerPort) {
        botOptions.port = keyServerPort;
      }
  
      const createBotInternal = () => { // Function for recursive creation
        bot = mineflayer.createBot(botOptions);
  
        bot.on('login', () => {
          botStatus = true;
          console.log('Bot is Online');
          bot.chat('say Bot is Online');
        });
  
        bot.on('error', (err) => {
          console.error('Error:', err);
          botStatus = false;
          if (!disconnect) {
            if (attemptCount < maxAttempts) { // Check if attempts are exceeded
              console.log(`Connection ended, reconnecting in 3 seconds (attempt ${attemptCount}/${maxAttempts})`);
              attemptCount++;
              setTimeout(() => createBotInternal(), 3000); // Recursive call
            } else {
              console.error('Error: Maximum connection attempts reached.');
              // Handle error (return error and botStatus here)
              return { error: 'Connection failed after maximum attempts', botStatus: false };
            }
          }
        });
        bot.on('kicked', (reason) => {
          console.log(`Bot expulsado del servidor: ${reason}`);
        
          // Implementar lógica de reintento
          setTimeout(() => {
            bot.quit(); // Desconectarse del servidor actual
            createBot(keyBot, keyServer, keyServerPort); // Intentar conectarse de nuevo
          }, 5000); // Esperar 5 segundos antes de intentar reconectarse
        
        });
        bot.on('end', () => {
          botStatus = false;
          if (!disconnect) {
            if (attemptCount < maxAttempts) { // Check if attempts are exceeded
              console.log(`Connection ended, reconnecting in 3 seconds (attempt ${attemptCount}/${maxAttempts})`);
              attemptCount++;
              setTimeout(() => createBotInternal(), 3000); // Recursive call
            } else {
              console.error('Error: Maximum connection attempts reached.');
              // Handle error (return error and botStatus here)
              return { error: 'Connection failed after maximum attempts', botStatus: false };
            }
          }
        });
      };

      createBotInternal(); // Initial creation attempt
    } else {
      console.log("No se creó el bot, estado:", botStatus);
    }
  }
  function removeBot() {
    if (bot) {
      bot.quit(); // Desconectar el bot del servidor
      bot = null; // Limpiar la referencia al bot
      botStatus = false; // Actualizar el estado del bot a desconectado
      console.log("Bot desconectado y eliminado correctamente.");
    } else {
      console.log("No hay ningún bot para desconectar.");
    }
  }
  
  app1.post('/api/disconnect', (req, res) => {
    const { eventType } = req.body;
    if (eventType === 'disconnectBot') {
      removeBot();
      disconnect = true;
      res.json({ message: 'Bot desconectado' });
    } else {
      res.json({ message: 'Datos recibidos' });
    }
  });

  // Inicia el servidor web

  //let devTool = true;
  //* Función para activar o desactivar el frame de la ventana principal
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
  const io = new Server(httpServer, {
    cors: {
      origin: '*'
    }
  });


  // Abre las herramientas de desarrollo de Electron (opcional)
  app1.use(express.static(path.join(__dirname, 'public')));


  
  io.on('connection', (socket) => {
      let tiktokConnectionWrapper;

      console.info('New connection from origin', socket.handshake.headers['origin'] || socket.handshake.headers['referer']);

      socket.on('setUniqueId', (uniqueId, options) => {

          // Prohibit the client from specifying these options (for security reasons)
          if (typeof options === 'object' && options) {
              delete options.requestOptions;
              delete options.websocketOptions;
          } else {
              options = {};
          }

          // Check if rate limit exceeded
          if (process.env.ENABLE_RATE_LIMIT && clientBlocked(io, socket)) {
              socket.emit('tiktokDisconnected', 'You have opened too many connections or made too many connection requests. Please reduce the number of connections/requests or host your own server instance. The connections are limited to avoid that the server IP gets blocked by TokTok.');
          }
          // Connect to the given username (uniqueId)
          try {
              tiktokConnectionWrapper = new TikTokConnectionWrapper(uniqueId, options, true, {
                processInitialData: false,
                enableExtendedGiftInfo: true,
                enableWebsocketUpgrade: false,
                requestPollingIntervalMs: 2000,
                clientParams: {
                    "app_language": "en-US",
                    "device_platform": "web"
                },
                requestOptions: {
                    timeout: 5000
                },
                websocketOptions: {
                    timeout: 5000
                }
              });
              tiktokConnectionWrapper.connect();
          } catch (err) {
              socket.emit('tiktokDisconnected', err.toString());
              socket.emit('tiktokDisconnected', ('Failed to connect', err));
          }

          // Redirect wrapper control events once
          tiktokConnectionWrapper.once('connected', state => socket.emit('tiktokConnected', state));
          tiktokConnectionWrapper.once('disconnected', reason => socket.emit('tiktokDisconnected', reason));

          // Notify client when stream ends
          tiktokConnectionWrapper.connection.on('streamEnd', () => socket.emit('streamEnd'));

          // Redirect message events
          tiktokConnectionWrapper.connection.on('roomUser', msg => socket.emit('roomUser', msg));
          tiktokConnectionWrapper.connection.on('member', msg => socket.emit('member', msg));
          tiktokConnectionWrapper.connection.on('chat', msg => socket.emit('chat', msg));
          tiktokConnectionWrapper.connection.on('gift', msg => socket.emit('gift', msg));
          tiktokConnectionWrapper.connection.on('social', msg => socket.emit('social', msg));
          tiktokConnectionWrapper.connection.on('like', msg => socket.emit('like', msg));
          tiktokConnectionWrapper.connection.on('questionNew', msg => socket.emit('questionNew', msg));
          tiktokConnectionWrapper.connection.on('websocketConnected', msg => socket.emit('websocketConnected', msg));
          tiktokConnectionWrapper.connection.on('linkMicBattle', msg => socket.emit('linkMicBattle', msg));
          tiktokConnectionWrapper.connection.on('linkMicArmies', msg => socket.emit('linkMicArmies', msg));
          tiktokConnectionWrapper.connection.on('liveIntro', msg => socket.emit('liveIntro', msg));
          tiktokConnectionWrapper.connection.on('emote', msg => socket.emit('emote', msg));
          tiktokConnectionWrapper.connection.on('envelope', msg => socket.emit('envelope', msg));
          tiktokConnectionWrapper.connection.on('subscribe', msg => socket.emit('subscribe', msg));
      });

      socket.on('disconnect', () => {
          if (tiktokConnectionWrapper) {
              tiktokConnectionWrapper.disconnect();
          }
      });
  });
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
});
app.disableHardwareAcceleration()

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


if (isSquirrelInstalled) {
  // Lógica para cuando se está ejecutando mediante Squirrel
  autoUpdater.on('update-available', (_event, releaseNotes, releaseName) => {
    const dialogOpts = {
      type: 'info',
      buttons: ['Okay'],
      title: '¡Actualización disponible!',
      message: process.platform === 'win32' ? releaseNotes : releaseName,
      detail: 'Hay una nueva versión disponible.'
    };
  
    dialog.showMessageBox(null, dialogOpts).then((_response) => {
      // Aquí puedes agregar lógica adicional según la respuesta, si es necesario
    });
  });
} else {
  // Lógica para cuando no se está ejecutando mediante Squirrel
  console.log('La aplicación no se está ejecutando mediante Squirrel.');
}


if (isSquirrelInstalled) {
autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'Una nueva versión ha sido descargada. Reinicie la aplicación para aplicar las actualizaciones.'
  };

  dialog.showMessageBox(null, dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall();

      // Abrir la carpeta de instalación
      const appDirectory = path.dirname(app.getPath('exe'));
      shell.openPath(appDirectory);

      // Preguntar si desea crear un acceso directo en el escritorio
      const createShortcutOpts = {
        type: 'question',
        buttons: ['Sí', 'No'],
        title: 'Crear acceso directo en el escritorio',
        message: '¿Desea crear un acceso directo en el escritorio para esta aplicación?',
        detail: 'Un acceso directo en el escritorio le permitirá iniciar fácilmente la aplicación en el futuro.'
      };

      dialog.showMessageBox(null, createShortcutOpts).then((shortcutResponse) => {
        if (shortcutResponse.response === 0) {
          const shortcutPath = path.join(app.getPath('desktop'), 'MiAplicacion.lnk');
          shell.writeShortcutLink(shortcutPath, 'desktop', {
            target: app.getPath('exe'),
            description: 'Mi Aplicación',
            icon: app.getIcon()
          });
        }
      });
    }
  });
});
} else {
  // Lógica para cuando no se está ejecutando mediante Squirrel
  console.log('La aplicación no se está ejecutando mediante Squirrel.');
}