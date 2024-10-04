import mineflayer from 'mineflayer';
import { RCONClient } from '@minecraft-js/rcon';
import { Rcon } from 'yamrc';
import EventEmitter from 'events';
let defaultoptionsRcon = { ip: 'localhost', port: '25575', password: 'hello' }

export class BotManager extends EventEmitter {
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
    if (this.rcon) {
      return
    }
    this.rcon = new RCONClient(options.ip, options.password);
    console.log("RCONClient", options);
    if (options.ip) { defaultoptionsRcon = options }
    try {
      this.rcon.connect();
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
        this.createRconClient(defaultoptionsRcon)
      });

      return { success: true };
    } catch (error) {
      console.error('RCON connection failed:', error);
      return { success: false, error: 'RCON connection failed' };
    }
  }

  async sendMessage(message) {
    // if(!this.rcon || !this.rcon.connected) {
    //   this.createRconClient(defaultoptionsRcon)
    // }
    if (this.rcon && this.rcon.authenticated) {
      try {
        if (!message || typeof message !== 'string'){
          console.log("messageno string", message)
          message = `${message}`
        }
        if (message && message.startsWith('/')) {
          const command = message.replace('/', '');
          const response = this.rcon.executeCommand(command);
          console.log("sendMessage", message);
          return { success: true, response };
        } else {
          // if (this.rcon) {};
          const response = this.rcon.executeCommand(message);
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
export class MinecraftRcon {
  constructor() {
    this.rconClient = null;
    this.messageQueue = [];
    this.isProcessing = false;
    this.retryInterval = 5000; // 5 seconds
  }

  async connectRcon(options = defaultRconOptions) {
    try {
      if (typeof options.port !== 'number') {
        options.port = Number(options.port);
      }
      this.rconClient = new Rcon(options.host, options.port, options.password);
      await this.rconClient.connect();
      console.log(await this.rconClient.send('list'));
      this.processQueue(); // Start processing the queue after successful connection
    } catch (error) {
      console.error('Error connecting to RCON:', error);
      setTimeout(() => this.connectRcon(options), this.retryInterval);
    }
  }

  async sendMessage(command) {
    return new Promise((resolve, reject) => {
      this.messageQueue.push({ command, resolve, reject });
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.messageQueue.length > 0) {
      const { command, resolve, reject } = this.messageQueue[0];

      try {
        if (!command || typeof command !== 'string') {
          throw new Error('No command provided or command is not a string.');
        }

        let processedCommand = command.startsWith('/') ? command.slice(1) : command;
        console.log("sendMessage", processedCommand);

        let response = await this.rconClient.send(processedCommand);
        console.log("response", JSON.stringify(response));
        resolve({ success: true, response: JSON.stringify(response) });
        this.messageQueue.shift(); // Remove the processed message from the queue
      } catch (error) {
        console.error('Error sending command to RCON:', error);
        if (error.message.includes('ECONNRESET') || error.message.includes('Not connected')) {
          // Connection lost, attempt to reconnect
          this.isProcessing = false;
          await this.reconnect();
          break; // Exit the loop to allow reconnection before processing more messages
        } else {
          reject(new Error(`Error sending command to RCON: ${error.message}`));
          this.messageQueue.shift(); // Remove the failed message from the queue
        }
      }
    }

    this.isProcessing = false;
  }

  async reconnect() {
    console.log('Attempting to reconnect...');
    try {
      await this.rconClient.connect();
      console.log('Reconnected successfully');
      this.processQueue(); // Resume processing the queue
    } catch (error) {
      console.error('Reconnection failed:', error);
      setTimeout(() => this.reconnect(), this.retryInterval);
    }
  }
}
