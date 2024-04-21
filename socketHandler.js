const { Server } = require('socket.io');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');
const { clientBlocked } = require('./limiter');

function initSocket(httpServer) {
  const io = new Server(httpServer, { cors: { origin: '*' } });
  const overlayNamespace = io.of('/overlay');

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

      // Escuchar eventos de conexión en el nuevo espacio de nombres
      overlayNamespace.on('connection', (socket) => {console.info('New connection to overlay from origin', socket.handshake.headers['origin'] || socket.handshake.headers['referer']);});
      // Redirect wrapper control events once
      tiktokConnectionWrapper.once('connected', state => {
        socket.emit('tiktokConnected', state); overlayNamespace.emit('tiktokConnected', state); });
    
    tiktokConnectionWrapper.once('disconnected', reason => {
        socket.emit('tiktokDisconnected', reason); overlayNamespace.emit('tiktokDisconnected', reason); });
    
    // Notify client when stream ends
    tiktokConnectionWrapper.connection.on('streamEnd', () => {
        socket.emit('streamEnd'); overlayNamespace.emit('streamEnd'); });
    
    // Redirect message events
    tiktokConnectionWrapper.connection.on('roomUser', msg => {
        socket.emit('roomUser', msg); overlayNamespace.emit('roomUser', msg); });
    
    tiktokConnectionWrapper.connection.on('member', msg => {
        socket.emit('member', msg); overlayNamespace.emit('member', msg); });
// Redirect message events
tiktokConnectionWrapper.connection.on('chat', msg => {
    socket.emit('chat', msg);overlayNamespace.emit('chat', msg);});

tiktokConnectionWrapper.connection.on('gift', msg => {
    socket.emit('gift', msg);overlayNamespace.emit('gift', msg);});

tiktokConnectionWrapper.connection.on('social', msg => {
    socket.emit('social', msg);overlayNamespace.emit('social', msg);});

tiktokConnectionWrapper.connection.on('like', msg => {
    socket.emit('like', msg);overlayNamespace.emit('like', msg);});

tiktokConnectionWrapper.connection.on('questionNew', msg => {
    socket.emit('questionNew', msg);overlayNamespace.emit('questionNew', msg);});

tiktokConnectionWrapper.connection.on('websocketConnected', msg => {
    socket.emit('websocketConnected', msg);overlayNamespace.emit('websocketConnected', msg);});

tiktokConnectionWrapper.connection.on('linkMicBattle', msg => {
    socket.emit('linkMicBattle', msg);overlayNamespace.emit('linkMicBattle', msg);});

tiktokConnectionWrapper.connection.on('linkMicArmies', msg => {
    socket.emit('linkMicArmies', msg);overlayNamespace.emit('linkMicArmies', msg);});

tiktokConnectionWrapper.connection.on('liveIntro', msg => {
    socket.emit('liveIntro', msg);overlayNamespace.emit('liveIntro', msg);});

tiktokConnectionWrapper.connection.on('emote', msg => {
    socket.emit('emote', msg);overlayNamespace.emit('emote', msg);});

tiktokConnectionWrapper.connection.on('envelope', msg => {
    socket.emit('envelope', msg);overlayNamespace.emit('envelope', msg);});

tiktokConnectionWrapper.connection.on('subscribe', msg => {
    socket.emit('subscribe', msg);overlayNamespace.emit('subscribe', msg);});

    
  });

  socket.on('disconnect', () => {
      if (tiktokConnectionWrapper) {
          tiktokConnectionWrapper.disconnect();
      }
  });

  });

  return io;
}

module.exports = { initSocket };