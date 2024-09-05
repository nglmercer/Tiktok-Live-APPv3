import { WebcastPushConnection, signatureProvider } from 'tiktok-live-connector';
signatureProvider.config.extraParams.apiKey = "ZTc0MDZkYWQwM2MyMjNlMzIzNDM1ODBiYzY1ZDJjN2NiMDVmMTNmMWU5NGM0ZDFlY2Y2NWU3"
class TiktokLiveController {
  constructor(uniqueId, options) {
    this.uniqueId = uniqueId;
    this.tiktokLiveConnection = new WebcastPushConnection(this.uniqueId, options);
    this.subscribers = new Map(); // Cambiado a Map para almacenar los eventos suscritos por socket
    this.lastConnectedData = null;
    this.lastRoominfo = null;
    this.isConnected = null;
    this.options = options;
    this.eventHandlers = new Map(); // Para almacenar los manejadores de eventos
  }

  async connect(socket) {
    if (this.isConnected) {
      this.subscribe(socket);
      return;
    }
    try {
      const state = await this.tiktokLiveConnection.connect();
      console.log(`Connected to roomId ${state.roomId}`);
      this.lastConnectedData = state;
      this.getRoominfo(socket);
      this.initializeEventHandlers();
      this.isConnected = true;
      if (socket && this.isConnected) {
        socket.emit('connected', state);
        this.subscribe(socket);
        console.log("TiktokLiveController.connect", this.uniqueId, this.isConnected, socket.id);
      }
    } catch (err) {
      this.isConnected = false;
      console.error('Failed to connect', this.uniqueId, err);
      socket.emit('error', err);
    }
  }

  initializeEventHandlers() {
    const events = [
      'chat', 'gift', 'connected', 'disconnected',
      'websocketConnected', 'error', 'member', 'roomUser',
      'like', 'social', 'emote', 'envelope', 'questionNew',
      'subscribe', 'follow', 'share'
    ];

    events.forEach(event => {
      const handler = (data) => {
        this.subscribers.forEach((subscribedEvents, subscriber) => {
          if (subscribedEvents.has(event)) {
            subscriber.emit(event, data);
          }
        });
      };
      this.eventHandlers.set(event, handler);
      this.tiktokLiveConnection.on(event, handler);
    });

    // Debug events
    this.tiktokLiveConnection.on('disconnected', data => {
      this.isConnected = null;
      console.log('disconnected', data);
      setTimeout(() => {
        console.log('reconnecting...');
        this.tiktokLiveConnection.connect();
      }, 3000);
    });

    this.tiktokLiveConnection.on('streamEnd', data => {
      console.log('streamEnd', data);
      this.lastConnectedData = null;
      this.lastRoominfo = null;
      this.isConnected = null;
      this.subscribers.forEach((_, subscriber) => {
        subscriber.emit('streamEnd', data);
      });
    });
  }

  subscribe(socket) {
    if (!this.subscribers.has(socket)) {
      this.subscribers.set(socket, new Set());
    }
    console.log(`Subscribed socket: ${socket.id}`);

    if (this.lastConnectedData) {
      socket.emit('connected', this.lastConnectedData);
    }

    if (this.lastRoominfo) {
      console.log('Emitiendo evento roominfo', socket.id);
      socket.emit('roominfo', this.lastRoominfo);
    }

    const events = [
      'chat', 'gift', 'connected', 'disconnected', 'streamEnd',
      'websocketConnected', 'error', 'member', 'roomUser',
      'like', 'social', 'emote', 'envelope', 'questionNew',
      'subscribe', 'follow', 'share'
    ];

    events.forEach(event => {
      if (!this.subscribers.get(socket).has(event)) {
        this.subscribers.get(socket).add(event);
      }
    });
  }

  unsubscribe(socket) {
    this.subscribers.delete(socket);
    console.log(`Unsubscribed socket: ${socket.id}`);

    if (this.subscribers.size === 0) {
      this.disconnect();
    }
  }

  async getRoominfo(socket) {
    try {
      const roomInfo = await this.tiktokLiveConnection.getRoomInfo();
      this.lastRoominfo = roomInfo;
      if (socket) {
        socket.emit('roominfo', roomInfo);
      }
      return roomInfo;
    } catch (err) {
      console.error('Failed to get roominfo', err);
    }
  }

  disconnect() {
    this.tiktokLiveConnection.disconnect();
    this.isConnected = false;
    console.log('Disconnected from TikTok Live');

    // Eliminar todos los listeners de eventos
    this.eventHandlers.forEach((handler, event) => {
      this.tiktokLiveConnection.removeListener(event, handler);
    });
    this.eventHandlers.clear();
    this.subscribers.clear();
  }
}

export default TiktokLiveController;
