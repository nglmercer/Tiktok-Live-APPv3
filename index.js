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
  const yaml = require('js-yaml');
  const cors = require('cors');
  const fs = require('fs');
  const mineflayer = require('mineflayer');

  let mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'public')
    }
  });

  const app1 = express();
  const app2 = express();
  const httpServer = createServer(app1);
  const io = new Server(httpServer, {
    cors: {
      origin: '*'
    }
  });

  let keywords = null;
  let commandList = null;
  if (fs.existsSync('keywords.yaml')) {
    fs.readFile('keywords.yaml', 'utf8', (err, data) => {
      if (err) throw err;
      const keywords = yaml.load(data);
      // Hacer algo con los datos cargados desde keywords.yaml
    });
  } else {
    // El archivo keywords.yaml no existe
    // Puedes tomar medidas alternativas o mostrar un mensaje de error
    console.error('El archivo keywords.yaml no se encontró.');
  }
  
  if (fs.existsSync('commandList.yaml')) {
    fs.readFile('commandList.yaml', 'utf8', (err, data) => {
      if (err) throw err;
      const commandList = yaml.load(data);
      // Hacer algo con los datos cargados desde commandList.yaml
    });
  } else {
    // El archivo commandList.yaml no existe
    // Puedes tomar medidas alternativas o mostrar un mensaje de error
    console.error('El archivo commandList.yaml no se encontró.');
  }
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
  app2.use(cors());
  app2.use(express.json());

  app2.get('/api/health', (req, res) => {
    res.json({ message: 'Servidor en funcionamiento' });
  });
  app2.post('/api/connect', (req, res) => {
    const { connect } = req.body;
    if (connect) {
      // Lógica para conectar al bot y obtener su estado de conexión
      // Aquí puedes llamar a la función createBot() o realizar las acciones necesarias para conectarte al bot
      // Luego, establece el estado de conexión del bot (botStatus) en base a la conexión exitosa o fallida
      
      // Ejemplo de respuesta al cliente con el estado de conexión del bot
      res.json({ botStatus: botStatus });
    } else {
      res.status(400).json({ message: 'Faltan datos en la solicitud' });
    }
  });

  // Emit global connection statistics
  setInterval(() => {
      io.emit('statistic', { globalConnectionCount: getGlobalConnectionCount() });
  }, 5000)

  // Iniciar el servidor HTTP
  httpServer.listen(port);
  const webServerPort = 3000;
  app2.listen(webServerPort, () => console.info(`Servidor web escuchando en el puerto ${webServerPort}`));
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