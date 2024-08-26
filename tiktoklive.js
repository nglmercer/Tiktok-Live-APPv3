// import { WebcastPushConnection } from 'tiktok-live-connector';
const { WebcastPushConnection } = require('tiktok-live-connector');
class TiktokLiveController {
  constructor(uniqueId,options) {
    this.uniqueId = uniqueId;
    this.tiktokLiveConnection = new WebcastPushConnection(this.uniqueId,options);
  }

  async connect() {
    try {
      const state = await this.tiktokLiveConnection.connect();
      console.info(`Connected to roomId ${state.roomId}`);
      
      this.initializeEventHandlers();
    } catch (err) {
      console.error('Failed to connect', err);
    }
  }

  initializeEventHandlers() {
    this.tiktokLiveConnection.on('chat', data => {
      console.log(`${data.uniqueId} (userId:${data.userId}) writes: ${data.comment}`);
    });

    this.tiktokLiveConnection.on('gift', data => {
      console.log(`${data.uniqueId} (userId:${data.userId}) sends ${data.giftId}`);
    });
    this.tiktokLiveConnection.on('connected', state => {
      console.log('Hurray! Connected!', state);
  })
    this.tiktokLiveConnection.on('disconnected', () => {
      console.log('Disconnected :(');
  })
    this.tiktokLiveConnection.on('streamEnd', (actionId) => {
      if (actionId === 3) {
          console.log('Stream ended by user');
      }
      if (actionId === 4) {
          console.log('Stream ended by platform moderator (ban)');
      }
  })
    this.tiktokLiveConnection.on('websocketConnected', websocketClient => {
      console.log("Websocket:", websocketClient.connection);
  })
    this.tiktokLiveConnection.on('error', err => {
      console.error('Error!', err);
  })
    this.tiktokLiveConnection.on('member', data => {
      console.log(`${data.uniqueId} joins the stream!`);
  })
    this.tiktokLiveConnection.on('roomUser', data => {
      console.log(`Viewer Count: ${data.viewerCount}`);
  })
    this.tiktokLiveConnection.on('like', data => {
      console.log(`${data.uniqueId} sent ${data.likeCount} likes, total likes: ${data.totalLikeCount}`);
  })
    this.tiktokLiveConnection.on('social', data => {
      console.log('social event data:', data);
  })
    this.tiktokLiveConnection.on('emote', data => {
      console.log('emote received', data);
  })
    this.tiktokLiveConnection.on('envelope', data => {
      console.log('envelope received', data);
  })
    this.tiktokLiveConnection.on('questionNew', data => {
      console.log(`${data.uniqueId} asks ${data.questionText}`);
  })
    this.tiktokLiveConnection.on('subscribe', (data) => {
      console.log(data.uniqueId, "subscribed!");
  })
    this.tiktokLiveConnection.on('follow', (data) => {
      console.log(data.uniqueId, "followed!");
  })
    this.tiktokLiveConnection.on('share', (data) => {
      console.log(data.uniqueId, "shared the stream!");
  })
  }

  disconnect() {
    this.tiktokLiveConnection.disconnect();
    console.info('Disconnected from TikTok Live');
  }
}

// Ejemplo de uso
const tiktokController = new TiktokLiveController('addaa.23',{
  processInitialData: false,
  enableExtendedGiftInfo: false,
  enableWebsocketUpgrade: true,
});
tiktokController.connect();
