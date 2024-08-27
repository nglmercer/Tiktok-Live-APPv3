// utils/webrtc.js
export const createPeerConnection = (
  userId,
  socket,
  roomId,
  handleIceCandidate,
  setupDataChannel,
) => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("webrtc", {
        type: "candidate",
        data: event.candidate,
        to: userId,
        roomId,
      });
    }
  };

  pc.ondatachannel = (event) => {
    const channel = event.channel;
    setupDataChannel(channel, userId);
  };

  return pc;
};

export const handleWebRTCSignal = async (
  pc,
  { type, data, from },
  socket,
  roomId,
) => {
  try {
    if (type === "offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc", { type: "answer", data: answer, to: from, roomId });
    } else if (type === "answer") {
      await pc.setRemoteDescription(new RTCSessionDescription(data));
    } else if (type === "candidate") {
      await pc.addIceCandidate(new RTCIceCandidate(data));
    }
  } catch (error) {
    console.error("Error handling WebRTC signal:", error);
  }
};

export const createDataChannel = (pc, userId, socket, roomId) => {
  const channel = pc.createDataChannel("chat");
  setupDataChannel(channel, userId);

  pc.createOffer()
    .then((offer) => pc.setLocalDescription(offer))
    .then(() => {
      socket.emit("webrtc", {
        type: "offer",
        data: pc.localDescription,
        to: userId,
        roomId,
      });
    })
    .catch((error) => console.error("Error creating offer:", error));
};
