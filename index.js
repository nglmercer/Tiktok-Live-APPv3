const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

// Evento emitido cuando Electron ha terminado de inicializarse
app.on('ready', () => {

  const express = require('express');
  const { createServer } = require('http');
  const { Server } = require('socket.io');
  const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');
  const { clientBlocked } = require('./limiter');
  const cors = require('cors');
  const mineflayer = require('mineflayer');
  
  const app12 = express();
  
  // CONFIGURACION DE EJEMPLO
  let keyBOT = null; // BOT MINECRAFT DAR OP
  let keySERVER = null; // IP SERVER
  //const keySERVERPORT = '25565'; // PUERTO SERVER
  
  let bot;
  let botStatus = false;
  let disconnect = false;
  app12.use(cors());
  app12.use(express.json());
  
  app12.post('/api/receive', (req, res) => {
    const { replacedCommand } = req.body;
    if (botStatus) {
      bot.chat(replacedCommand);
    }
    console.log('comando minecraft', replacedCommand);
  
    return res.json({ message: 'Datos recibidos' });
  });
  
  app12.post('/api/create', (req, res) => {
    const { eventType, data } = req.body;
  
    if (eventType === 'createBot') {
      const { keyBot, keyServer, Initcommand } = data;
      if ((keyBot) && (keyServer)) {
        if (!botStatus) {
          createBot(keyBot, keyServer);
          bot.once('login', () => {
            res.json({ message: 'Bot creado correctamente' });
            bot.chat(Initcommand);
          });
        } else {
          res.json({ message: 'Bot ya está conectado', botStatus });
        }
      } else if(!disconnect) {
        createBot(keyBot, keyServer);
        bot.once('login', () => {
          res.json({ message: 'Bot creado correctamente else if' });
          bot.chat(Initcommand);
        });
      }
    } else if (eventType === 'disconnectBot') {
      disconnect = true;
      disconnectBot();
      res.json({ message: 'Bot desconectado correctamente' });
    } else {
      res.json({ message: 'Datos recibidos' });
    }
  });
  function createBot(keyBot, keyServer) {
    console.log("createBot now...");
    if (!botStatus) {
      bot = mineflayer.createBot({
        host: keyServer,
        username: keyBot,
        //port: keySERVERPORT,
      });
  
      bot.on('login', () => {
        botStatus = true;
        console.log('Bot is Online');
        bot.chat('say Bot is Online');
      });
  
      bot.on('error', (err) => {
        console.log('Error:', err);
      });
  
      bot.on('end', () => {
        botStatus = false;
        if (!disconnect) {
          console.log('Connection ended, reconnecting in 3 seconds');
          if (!botStatus) {
            setTimeout(() => createBot(keyBot, keyServer), 3000);
          }
        }
      });
    } else {
      console.log("No se creó el bot, estado:", botStatus);
    }
  }
  app12.post('/api/disconnect', (req, res) => {
    const { eventType } = req.body;
    if (eventType === 'disconnectBot') {
      disconnectBot();
      disconnect = true;
      res.json({ message: 'Bot desconectado correctamente' });
    } else {
      res.json({ message: 'Datos recibidos' });
    }
  });
  app12.post('/api/reconnect', (req, res) => {
    const { eventType } = req.body;
    if (eventType === 'reconnectBot') {
      reconnectBot();
      res.json({ message: 'Bot reconectado correctamente' });
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
  const webServerPort = 3001;
  app12.listen(webServerPort, () => console.info(`Servidor web escuchando en el puerto ${webServerPort}`));
  let mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'public')
    }
  });

  const app1 = express();
  const httpServer = createServer(app1);
  const io = new Server(httpServer, {
    cors: {
      origin: '*'
    }
  });

  const port = process.env.PORT || 8081;

  mainWindow.loadURL(`http://localhost:${port}`);

  // Abre las herramientas de desarrollo de Electron (opcional)
  mainWindow.webContents.openDevTools();

  app1.use(express.static(path.join(__dirname, 'public')));

  // Evento emitido cuando la ventana se cierra
  mainWindow.on('closed', function () {
    mainWindow = null;
  });

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
          if (process.env.SESSIONID) {
              options.sessionId = process.env.SESSIONID || undefined;
              console.info('Using SessionId');
          }

          // Check if rate limit exceeded
          if (process.env.ENABLE_RATE_LIMIT && clientBlocked(io, socket)) {
              socket.emit('tiktokDisconnected', 'You have opened too many connections or made too many connection requests. Please reduce the number of connections/requests or host your own server instance. The connections are limited to avoid that the server IP gets blocked by TokTok.');
              return;
          }

          // Connect to the given username (uniqueId)
          try {
              tiktokConnectionWrapper = new TikTokConnectionWrapper(uniqueId, options, true);
              tiktokConnectionWrapper.connect();
          } catch (err) {
              socket.emit('tiktokDisconnected', err.toString());
              return;
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
    createWindow();
  }
});