// src/utils/mediaManager.js

class MediaManager {
  constructor() {
    this.localStream = null;
    this.remoteStreams = {};
  }

  async getMediaStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      return this.localStream;
    } catch (error) {
      console.error("Error getting media stream:", error);
      return null;
    }
  }

  setLocalStream(stream) {
    this.localStream = stream;
  }

  getLocalStream() {
    return this.localStream;
  }

  addTrackToPeerConnection(pc) {
    if (this.localStream) {
      this.localStream
        .getTracks()
        .forEach((track) => pc.addTrack(track, this.localStream));
    }
  }

  handleRemoteStreamAdded(userId, event) {
    this.remoteStreams[userId] = event.streams[0];
    return this.remoteStreams[userId];
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
    }
  }
}

const mediaManager = new MediaManager();
export default mediaManager;
