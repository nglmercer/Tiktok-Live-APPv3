const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

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
  const app1 = express();
  // CONFIGURACION DE EJEMPLO
  //let keyBOT = null; // BOT MINECRAFT DAR OP
  //let keySERVER = null; // IP SERVER
  //const keySERVERPORT = '25565'; // PUERTO SERVER
  let mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    frame: false,
    autoHideMenuBar: false,
    transparent: true,
    alwaysOnTop: false,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  const port = process.env.PORT || 8081;

  mainWindow.loadURL(`http://localhost:${port}`);
  // Evento emitido cuando la ventana se cierra
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  let bot;
  let botStatus = false;
  let disconnect = false;
  app1.use(cors());
  app1.use(express.json());

  const overlayWindows = [];

  app1.post('/crear-overlay', (req, res) => {
    const { url, width, height } = req.body;
  
    // Configuración de la ventana de overlay con el tamaño especificado
    const overlayWindow = new BrowserWindow({
      width: parseInt(width),
      height: parseInt(height),
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true
      }
    });
    
    overlayWindows.push(overlayWindow);

    // Cargar la URL recibida en la ventana de overlay
    overlayWindow.loadURL(url);
      //

    overlayWindow.on('blur', () => {
      overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    });
    overlayWindow.on('closed', () => {
      const index = overlayWindows.indexOf(overlayWindow);
      if (index !== -1) {
        overlayWindows.splice(index, 1);
      }
    });
    //*///
    globalShortcut.register('F11', () => {
      overlayWindows.forEach(window => {
        if (!window.isDestroyed()) { // Check if window is still open
          window.close();
        }
      });
    });
  
    res.status(200).json({ message: 'Overlay creado correctamente' });
  });
  app1.post('/api/receive', (req, res) => {
    const { replacedCommand } = req.body;
    if (botStatus) {
      bot.chat(replacedCommand);
    }
    //console.log('comando minecraft', replacedCommand);
  
    return res.json({ message: 'Datos recibidos' });
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
        if (!botStatus) {
          const serverParts = keyServer.split(':');
          const serverAddress = serverParts[0];
          const serverPort = serverParts[1] ? parseInt(serverParts[1]) : null;
  
          createBot(keyBot, serverAddress, serverPort);
          bot.once('login', () => {
            res.json({ message: 'Bot creado' });
            bot.chat(Initcommand);
          });
        } else {
          res.json({ message: 'Bot ya está conectado', botStatus });
        }
      } else if (!disconnect) {
        createBot(keyBot, keyServer);
        bot.once('login', () => {
          res.json({ message: 'Bot creado sin puerto' });
          bot.chat(Initcommand);
        });
      }
    } else if (eventType === 'disconnectBot') {
      disconnect = true;
      disconnectBot();
      res.json({ message: 'Bot desconectado' });
    } else {
      res.json({ message: 'Datos recibidos' });
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
  app1.post('/api/disconnect', (req, res) => {
    const { eventType } = req.body;
    if (eventType === 'disconnectBot') {
      disconnectBot();
      disconnect = true;
      res.json({ message: 'Bot desconectado' });
    } else {
      res.json({ message: 'Datos recibidos' });
    }
  });
  app1.post('/api/reconnect', (req, res) => {
    const { eventType } = req.body;
    if (eventType === 'reconnectBot') {
      reconnectBot();
      res.json({ message: 'Bot reconectado' });
    } else {
      res.json({ message: 'Datos recibidos' });
    }
  });
  function disconnectBot() {
    if (botStatus) {
      bot.quit();
      botStatus = false;
      console.log('Bot desconectado');
    }
  }

  // Inicia el servidor web
  
  //let devTool = true;
  /* Función para activar o desactivar el frame de la ventana principal
  globalShortcut.register('F1', ToolDev);
  globalShortcut.register('F2', cdevTool);
  function ToolDev() {
    devTool = true;
    mainWindow.webContents.openDevTools();
  }
  function cdevTool() {
    devTool = false;
    mainWindow.webContents.closeDevTools();
  }//*/

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
          
          // Session ID in .env file is optional
          //if (process.env.SESSIONID) {
            //  options.sessionId = process.env.SESSIONID || undefined;
              //console.info('Using SessionId');
          //}

          // Check if rate limit exceeded
          if (process.env.ENABLE_RATE_LIMIT && clientBlocked(io, socket)) {
              socket.emit('tiktokDisconnected', 'You have opened too many connections or made too many connection requests. Please reduce the number of connections/requests or host your own server instance. The connections are limited to avoid that the server IP gets blocked by TokTok.');
          }
          // Connect to the given username (uniqueId)
          try {
              tiktokConnectionWrapper = new TikTokConnectionWrapper(uniqueId, options, true, {
                processInitialData: false,
                enableExtendedGiftInfo: true,
                enableWebsocketUpgrade: true,
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

  // Emit global connection statistics
  setInterval(() => {
      io.emit('statistic', { globalConnectionCount: getGlobalConnectionCount() });
  }, 5000)

  // Iniciar el servidor HTTP
  httpServer.listen(port);
  console.info(`Server running! Please visit http://localhost:${port}`);
});

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
