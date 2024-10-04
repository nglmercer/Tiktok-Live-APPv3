import { Client, Server } from 'node-osc';
import osc from 'osc';
export class OSCManager {
  constructor() {
    this.client = null;
    this.server = null;
  }

  createClient(host = "127.0.0.1", port = 9000) {
    if (this.client) {
      this.client.close();
    }
    this.client = new Client(host, port);
    console.log(`OSC Client created: ${host}:${port}`);
    return { success: true };
  }

  createServer(port = 9001, host = "0.0.0.0") {
    if (this.server) {
      this.server.close();
    }
    this.server = new Server(port, host);
    this.server.on('listening', () => {
      console.log(`OSC Server is listening on ${host}:${port}`);
    });
    this.server.on('message', (msg) => {
      console.log(`OSC Message received: ${msg}`);
    });
    return { success: true };
  }

  sendMessage(text) {
    if (!text || typeof text !== 'string') return;
    try {
    if (this.client) {
      this.client.send('/chatbox/input', text.toString(), true);
      console.log(`OSC Message sent: ${text}`);
      return { success: true };
    } else {
      console.error('OSC Client not created');
      this.createClient();
      return { success: false, error: 'OSC Client not created' };
    }
    } catch (error) {
      console.error('Error sending OSC message:', error);
      return { success: false, error: 'Error sending OSC message' };
    }
  }
  sendAction(action, value) {
    try {
    if (this.client) {
      this.client.send(`${action}`, value, true);

      console.log(`OSC Action sent: ${action}`);
      return { success: true };
    } else {
      console.error('OSC Client not created');
      return { success: false, error: 'OSC Client not created' };
    }
    } catch (error) {
      console.error('Error sending OSC message:', error);
      return { success: false, error: 'Error sending OSC message' };
    }
  }

  getStatus() {
    return {
      client: this.client ? 'Connected' : 'Not connected',
      server: this.server ? 'Listening' : 'Not listening'
    };
  }

  close() {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

export class InputManager {
  constructor(oscManager) {
    this.oscManager = oscManager;
  }

  sendInput(action, value) {
    console.log("sendInput", action, value);
    if (!action) return;
    return this.oscManager.sendAction(`/input/${action}`, value);
  }

  keyUpAll() {
    const actions = ['MoveForward', 'MoveBackward', 'MoveLeft', 'MoveRight', 'Run', 'Jump', 'LookLeft', 'LookRight'];
    actions.forEach(action => this.sendInput(action, action === 'Jump' ? 0 : false));
  }
}

export class OSCManagerV2 {
  constructor() {
    const defaultConfig = {
      localAddress: "0.0.0.0",
      localPort: 9001,
      remoteAddress: "127.0.0.1",
      remotePort: 9000,
    };
    this.config = defaultConfig;
    this.udpPort = null;
  }

  // Permite parámetros opcionales con valores por defecto
  connect(config = {}) {
    this.config = { ...this.config, ...config };
    this.udpPort = new osc.UDPPort({
      localAddress: this.config.localAddress,
      localPort: this.config.localPort,
      remoteAddress: this.config.remoteAddress,
      remotePort: this.config.remotePort,
    });

    this.udpPort.on("ready", () => {
      console.log(`OSC UDP Port ready: ${this.config.localAddress}:${this.config.localPort}`);
    });

    this.udpPort.on("message", (oscMessage) => {
      console.log(`OSC Message received: ${JSON.stringify(oscMessage)}`);
    });

    try {
      this.udpPort.open();
      console.log("UDP Port opened successfully.");
    } catch (err) {
      console.error(`Error opening UDP Port: ${err.message}`);
    }
  }

  close() {
    try {
      if (this.udpPort) {
        this.udpPort.close();
        console.log("UDP Port closed successfully.");
      }
    } catch (err) {
      console.error(`Error closing UDP Port: ${err.message}`);
    }
  }

  sendAction(action, value) {
    try {
      this.udpPort.send({
        address: `/input/${action}`,
        args: [value, true],
      });
      console.log(`OSC Message sent to ${action}: ${value}`);
    } catch (err) {
      console.error(`Error sending OSC message: ${err.message}`);
    }
  }

  sendMessage(message) {
    if (!message || typeof message !== 'string') return;
    try {
      this.udpPort.send({
        address: "/chatbox/input",
        args: [message, true],
      });
      console.log(`OSC Message sent: ${message}`);
    } catch (err) {
      console.error(`Error sending OSC message: ${err.message}`);
    }
  }

  getStatus() {
    return this.udpPort ? "Connected" : "Not connected";
  }
}

// export default { OSCManager,InputManager }

// ipcMain.handle('create-client-osc', (event, options) => {
//   const { host, port } = options;
//   return oscManager.createClient(host, Number(port));
// });

// ipcMain.handle('create-server-osc', (event, options) => {
//   const { host, port } = options;
//   return oscManager.createServer(Number(port), host);
// });

// ipcMain.handle('send-osc-message', (event, text) => {
//   console.log('send-osc-message', text);
//   return oscManager.sendMessage( text);
// });

// ipcMain.handle('get-osc-status', () => {
//   return oscManager.getStatus();
// });

// ipcMain.handle('input-action', (event, action, value) => {
//   return inputManager.sendInput(action, value);
// });
