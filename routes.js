const express = require('express');
const router = express.Router();
const { Client, Server } = require('node-osc');
const { ipcMain } = require('electron');
class OSCManager {
  constructor() {
    this.client = null;
    this.server = null;
  }

  createClient(host, port) {
    if (this.client) {
      this.client.close();
    }
    this.client = new Client(host, port);
    console.log(`OSC Client created: ${host}:${port}`);
    return { success: true };
  }

  createServer(port, host) {
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
    if (this.client) {
      this.client.send('/chatbox/input', text.toString(), true);
      console.log(`OSC Message sent: ${text}`);
      return { success: true };
    } else {
      console.error('OSC Client not created');
      return { success: false, error: 'OSC Client not created' };
    }
  }
  sendAction(action, value) {
    if (this.client) {
      this.client.send(`${action}`, value, true);
      console.log(`OSC Action sent: ${action}`);
      return { success: true };
    } else {
      console.error('OSC Client not created');
      return { success: false, error: 'OSC Client not created' };
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

class InputManager {
  constructor(oscManager) {
    this.oscManager = oscManager;
  }

  sendInput(action, value) {
    return this.oscManager.sendAction(`/input/${action}`, value);
  }

  keyUpAll() {
    const actions = ['MoveForward', 'MoveBackward', 'MoveLeft', 'MoveRight', 'Run', 'Jump', 'LookLeft', 'LookRight'];
    actions.forEach(action => this.sendInput(action, action === 'Jump' ? 0 : false));
  }
}

const oscManager = new OSCManager();
const inputManager = new InputManager(oscManager);

ipcMain.handle('create-client-osc', (event, options) => {
  const { host, port } = options;
  return oscManager.createClient(host, Number(port));
});

ipcMain.handle('create-server-osc', (event, options) => {
  const { host, port } = options;
  return oscManager.createServer(Number(port), host);
});

ipcMain.handle('send-osc-message', (event, text) => {
  console.log('send-osc-message', text);
  return oscManager.sendMessage( text);
});

ipcMain.handle('get-osc-status', () => {
  return oscManager.getStatus();
});

ipcMain.handle('input-action', (event, action, value) => {
  return inputManager.sendInput(action, value);
});
router.post('/receive', (req, res) => {
    //console.log(`Comando recibido. Retraso adicional: ${additionalDelay}ms`);
  });
router.post('/guardarEstado', (req, res) => {
  const state = req.body.state; // Obtiene el estado del cuerpo de la petición
  store.set('state', state);
  console.log('Estado guardado:', state);
  res.sendStatus(200); // Envía una respuesta de éxito al cliente
});
router.post('/receive1', (req, res) => {
  const { eventType, data } = req.body;
  res.json({ message: 'Datos recibidos receive1' });
});
router.post('/api/disconnect', (req, res) => {
  const { eventType } = req.body;
  console.log(eventType);
});
module.exports = router;