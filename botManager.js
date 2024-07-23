const { ipcMain } = require('electron');
const mineflayer = require('mineflayer');
const { RCONClient } = require('@minecraft-js/rcon');
const EventEmitter = require('events');

class BotManager extends EventEmitter {
  constructor() {
    super();
    this.bot = null;
    this.rcon = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectInterval = 5000;
    this.options = null;
    this.keyLOGIN = null;
  }

  async createBot(options, keyLOGIN) {
    this.options = options;
    this.keyLOGIN = keyLOGIN;

    this.bot = mineflayer.createBot(options);

    this.bot.once('spawn', () => {
      console.log('Bot spawned');
      this.emit('connected');
      this.reconnectAttempts = 0;
      if (this.keyLOGIN) {
        this.sendMessage(this.keyLOGIN);
      }
    });

    this.setupBotListeners();

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.bot && this.bot.chat ? { success: true } : { success: false, error: 'Bot not created' });
      }, 1000);
    });
  }

  setupBotListeners() {
    this.bot.on('chat', (username, message) => {
      console.log(`${username}: ${message}`);
      this.emit('chat', { username, message });
    });

    this.bot.on('end', () => {
      console.log('Bot disconnected');
      this.emit('disconnected');
      this.handleReconnect();
    });

    this.bot.on('error', (error) => {
      console.error('Bot error:', error);
    });
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnection attempt ${this.reconnectAttempts}`);
      this.emit('reconnecting', this.reconnectAttempts);
      setTimeout(() => this.createBot(this.options, this.keyLOGIN), this.reconnectInterval);
    } else {
      console.log('Max reconnection attempts reached');
      this.emit('reconnection-failed');
    }
  }

  async createRconClient(options, keyLOGIN) {
    this.rcon = new RCONClient(options.ip, options.password, options.port);
    console.log("RCONClient", options);
    
    try {
      await this.rcon.connect();
      console.log('Connected to RCON server');
      
      this.rcon.on('authenticated', () => {
        console.log('Authenticated with RCON server');
        if (keyLOGIN) {
          this.rcon.executeCommand(`say ${keyLOGIN}`);
        }
      });
  
      this.rcon.on('response', (requestId, packet) => {
        console.log('RCON response:', packet);
      });
  
      this.rcon.on('error', (error) => {
        console.error('RCON error:', error);
      });
  
      return { success: true };
    } catch (error) {
      console.error('RCON connection failed:', error);
      return { success: false, error: 'RCON connection failed' };
    }
  }

  async sendMessage(message) {
    if (this.rcon && this.rcon.authenticated) {
      try {
        if (message.startsWith('/')) {
          const command = message.replace('/', '');
          const response = await this.rcon.executeCommand(command);
          console.log("sendMessage", message);
          return { success: true, response };
        } else {
          const response = await this.rcon.send(message);
          console.log("sendMessage", message);
          return { success: true, response };
        }
        
      } catch (error) {
        console.error('RCON command failed:', error);
        return { success: false, error: 'RCON command failed' };
      }
    } else if (this.bot && this.bot.chat) {
      this.bot.chat(message);
      return { success: true };
    } else {
      return { success: false, error: 'No active connection' };
    }
  }

  getStatus() {
    if (this.rcon && this.rcon.connected) {
      return { success: true, status: 'RCON connected' };
    } else if (this.bot) {
      return {
        success: true,
        status: 'Bot connected',
        reconnectAttempts: this.reconnectAttempts,
        maxReconnectAttempts: this.maxReconnectAttempts
      };
    } else {
      return { success: false, error: 'No active connection' };
    }
  }

  disconnect() {
    if (this.rcon) {
      this.rcon.end();
      this.rcon = null;
    }
    if (this.bot) {
      this.bot.quit();
      this.bot = null;
    }
    this.emit('disconnected');
  }
}

// Exporta el botManager si necesitas acceder a él en otras partes de tu aplicación
module.exports = { BotManager };