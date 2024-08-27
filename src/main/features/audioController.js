import { NodeAudioVolumeMixer } from "node-audio-volume-mixer";

export default class AudioController {
  constructor() {
    this.updateSessions();
  }

  // Actualizar las sesiones de audio
  updateSessions() {
    this.sessions = NodeAudioVolumeMixer.getAudioSessionProcesses();
  }

  // Obtener todas las sesiones de audio con sus volúmenes
  getAllSessions() {
    this.updateSessions();
    return this.sessions.map((session) => {
      const volume = this.getSessionVolume(session.pid);
      return { ...session, volume };
    });
  }

  // Encontrar una sesión por nombre del proceso
  findSessionByName(name) {
    this.updateSessions();
    return this.sessions.find((session) => session.name === name);
  }

  // Encontrar una sesión por ID del proceso
  findSessionById(pid) {
    this.updateSessions();
    return this.sessions.find((session) => session.pid === pid);
  }

  // Cambiar el volumen de una sesión específica
  setSessionVolume(pid, volume) {
    if (volume < 0 || volume > 1) {
      throw new Error("El volumen debe estar entre 0 y 1.");
    }
    NodeAudioVolumeMixer.setAudioSessionVolumeLevelScalar(pid, volume);
  }

  // Obtener el volumen de una sesión específica
  getSessionVolume(pid) {
    return NodeAudioVolumeMixer.getAudioSessionVolumeLevelScalar(pid);
  }

  // Obtener el estado de mute del master
  isMasterMuted() {
    return NodeAudioVolumeMixer.isMasterMuted();
  }

  // Mutear o desmutear el master
  muteMaster(state) {
    NodeAudioVolumeMixer.muteMaster(state);
  }

  // Obtener el volumen del master
  getMasterVolume() {
    return NodeAudioVolumeMixer.getMasterVolumeLevelScalar();
  }

  // Establecer el volumen del master
  setMasterVolume(volume) {
    if (volume < 0 || volume > 1) {
      throw new Error("El volumen debe estar entre 0 y 1.");
    }
    NodeAudioVolumeMixer.setMasterVolumeLevelScalar(volume);
  }
}

// module.exports = { AudioController };
