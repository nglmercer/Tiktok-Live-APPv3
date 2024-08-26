class SocketManager {
  constructor(backendUrl) {
    this.socket = io(backendUrl);
    this.isInitialized = false;
    this.socket.on("connect", () => {
      console.log("Socket connected successfully");
    });
  }

  emitMessage(eventName, data) {
      this.socket.emit(eventName, data);
  }

  // Escuchar mensaje de manera asíncrona
  onMessage(eventName, callback) {
      this.socket.on(eventName, callback);
  }
  on(eventName, callback) {
      this.socket.on(eventName, callback);
  }
  // Desconectar el socket
  async disconnectSocket() {
      this.socket.emit("disconnect");
      this.socket.disconnect();
      this.isInitialized = false;
  }
}

export const socketurl = {
  getport() {
    const port = window.location.port || 8088;
    let socketUrl;

    if (port === '5173') {
      console.log("port", port);
      socketUrl = this.constructSocketUrl(8088);
    } else {
      console.log("port", port);
      socketUrl = this.constructSocketUrl(port);
    }

    return socketUrl;
  },

  constructSocketUrl(port) {
    const { protocol, hostname } = window.location;

    if (protocol === "file:") {
      console.log("protocol", protocol);
      return `http://localhost:${port}`;
    } else if (protocol === "https:") {
      console.log(`${protocol}//${hostname}:${port}`);
      return `${protocol}//${hostname}:${port}`;
    } else if (protocol === "http:") {
      console.log("protocol", protocol, `http://${hostname}:${port}`);
      return `http://${hostname}:${port}`;
    }
  }
};

export class Websocket {
  constructor(params) {
    this.url = params.url || "ws://localhost:21213/";
    this.websocket = null;
    this.attemptsConnection = 0;
    this.maxAttempts = params.maxAttempts || 5; // Número máximo de intentos de reconexión
    this.stateElementId = params.stateElementId || "stateText"; // Elemento para mostrar el estado
  }

  connect(onMessage) {
    if (this.websocket) return; // Ya conectado
    if (this.attemptsConnection >= this.maxAttempts) {
      return; // Limitar los intentos de reconexión
    }
    console.log("connecting");
    this.websocket = new WebSocket(this.url);
    this.attemptsConnection++;

    this.websocket.onopen = () => {
      document.getElementById(this.stateElementId).innerHTML = "Connected to WebSocket";
      this.attemptsConnection = 0;
    };

    this.websocket.onclose = () => {
      this.websocket = null;
      setTimeout(() => this.connect(onMessage), 4000);
    };

    this.websocket.onerror = () => {
      this.websocket = null;
      setTimeout(() => this.connect(onMessage), 4000);
    };

    this.websocket.onmessage = onMessage;
  }
}
const socketManager = new SocketManager(socketurl.getport());
Object.freeze(socketManager);
export default socketManager;
