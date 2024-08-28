import { Server } from "socket.io";

class SocketHandler {
  constructor() {
    this.io = null;
    this.server = null;
    this.isConnected = false;
    this.port = null;
    this.isInitialized = false;
    this.subscribers = new Map(); // Cambiado a Map para almacenar los eventos suscritos por socket
  }

  initialize = (server) => {
    this.server = server;
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    this.isConnected = true;
    this.isInitialized = true;
  }

  onEvent = (eventName, callback) => {
    this.io.on(eventName, callback);
  }

  onConnection = (callback) => {
    this.io.on("connection", callback);
  }

  emit = (eventName, data) => {
    this.io.emit(eventName, data);
  }

  onDisconnect = (callback) => {
    this.io.on("disconnect", callback);
  }

  disconnectSocket = (socket) => {
    if (socket) {
      this.io.sockets.emit("disconnect", socket.id);
    }
  }

  listensocket = async (port = 0) => {
    return new Promise((resolve, reject) => {
      try {
        this.server.listen(port, () => {
          this.port = this.server.address().port;
          console.log("Socket.IO server listening on port", this.port);
          this.isInitialized = true;
          resolve(this.port);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  getListenPort = () => {
    console.log("getListenPort", this.port);
    return this.port;
  }
  subscribe = (socket) => {
    if (!this.subscribers.has(socket)) {
      this.subscribers.set(socket, new Set());
    }

    socket.on("subscribeEvent", (eventName) => {
      this.subscribers.get(socket).add(eventName);
      console.log(`Socket ${socket.id} subscribed to ${eventName}`);
    });
  }

  // Método para desuscribir un socket
  unsubscribe = (socket) => {
    this.subscribers.delete(socket);
    console.log(`Unsubscribed socket: ${socket.id}`);
  }
  emitallusers = (eventName, data) => {
    this.subscribers.forEach((subscribedEvents, subscriber) => {
      if (subscribedEvents.has(eventName)) {
        subscriber.emit(eventName, data);
      }
    });
  }

  // Método para emitir un evento a todos los sockets conectados, sin importar la suscripción
  emitToAllSockets = (eventName, data) => {
    this.io.sockets.emit(eventName, data);
  }
}
//socketHandler.emitToAllSockets('anotherEvent', { key: 'value' });
// Para emitir a todos los sockets conectados, independientemente de su suscripción:

// socketHandler.emitallusers('someEvent', { key: 'value' });

export default SocketHandler;
