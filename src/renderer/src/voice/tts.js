const TTS_API_ENDPOINT = 'https://api.streamelements.com/kappa/v2/speech?';
import AudioPlayer from './AudioPlayer.js';
import {Queue, Controlmedia } from './Queueaudio.js';

const audioPlayer = new AudioPlayer('audio',
() => controlmedia.playPreviousAudio(),
() => controlmedia.nextaudio()
);
const controlmedia = new Controlmedia(audioPlayer);
audioPlayer.setAudioInfo('voz1 player');

let audioQueue = new Queue();
let lastReadText = null;
let audioMap = {};
let audioKeys = [];
let isPlaying = false;
// let audio = document.getElementById('audio');

async function fetchAudio(txt) {
    try {
        if (txt === lastReadText) {
            return;
        }

        lastReadText = txt;

        if (audioMap[txt]) {
            return audioMap[txt];
        }

        const params = new URLSearchParams({
            voice: getVoiceFromVoiceSelect(),
            text: txt
        });

        const resp = await fetch(TTS_API_ENDPOINT + params.toString());
        if (resp.status !== 200) {
            console.error("Mensaje incorrecto, status code:", resp.status);
            return;
        }

        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);

        audioMap[txt] = blobUrl;
        audioKeys.push(txt);

        return blobUrl;
    } catch (error) {
        console.error("Error fetchAudio:", error);
    }
}

function getVoiceFromVoiceSelect() {
    let voiceSelect = document.querySelector('#voiceSelectContainer select');
    if (voiceSelect) {
        return voiceSelect.value;
    } else {
        console.error('Voice select element not found');
        return null;
    }
}

function skipAudio() {
    audioPlayer.audio.pause();
    audioPlayer.audio.currentTime = 0;

    if (!audioQueue.isEmpty()) {
        controlmedia.nextaudio();
    } else {
        isPlaying = false;
    }
}


function leerMensajes(text) {
    console.log('leerMensajes', text);
    if (text) {
        fetchAudio(text).then(audioUrl => {
          if (document.getElementById('audiolist').checked) {
            controlmedia.addSong(audioUrl);
          } else {
            const newaudio = new Audio(audioUrl);
            newaudio.play();
          }
        });
    }
}
export class TTS {
    constructor(message) {
        this.speak(message);
    }

    async speak(message) {
        console.log('TTS speak', message);

        const voices = speechSynthesis.getVoices();
        console.log("voices", voices);
        let voiceSelect = document.getElementById('voiceSelect');
        let selectedVoice = voices.find(voice => voice.name === voiceSelect.selectedOptions[0].getAttribute("data-name"));

        if (document.getElementById('randomVoice').checked) {
            selectedVoice = setRandomVoice(voices);
        }

        let speed = document.getElementById('randomSpeedValue').value;
        if (document.getElementById('randomSpeed').checked) {
            speed = setRandomSpeed();
        }

        let pitch = document.getElementById('randomPitchValue').value;
        if (document.getElementById('randomPitch').checked) {
            pitch = setRandomPitch();
        }

        const volume = document.querySelector('#volume').value;

        const utterance = new SpeechSynthesisUtterance(message);
        utterance.voice = selectedVoice;
        utterance.rate = parseFloat(speed);
        utterance.pitch = parseFloat(pitch);
        utterance.volume = parseFloat(volume);

        console.log('utterance options', utterance);
        window.speechSynthesis.speak(utterance);

        // try {
        //     const audioUrl = await recordSpeechAndGetTTS(message, utterance);
        //     console.log('audioUrl', audioUrl);
        //     // Aquí puedes hacer algo con audioUrl, como reproducirlo o guardarlo
        // } catch (error) {
        //     console.error('Error recording speech:', error);
        // }
    }
}

function setRandomVoice(voices) {
    const randomIndex = Math.floor(Math.random() * voices.length);
    return voices[randomIndex];
}

function setRandomSpeed() {
    return (Math.random() * (1.5 - 0.5) + 0.5).toFixed(1);
}

function setRandomPitch() {
    return (Math.random() * (1.5 - 0.5) + 0.5).toFixed(1);
}
async function handleleermensaje(text) {
  const selectedVoice = document.querySelector('input[name="selectvoice"]:checked');
  const selectedCommentType = document.querySelector('input[name="comment-type"]:checked').value;
  let shouldRead = false;

  switch (selectedCommentType) {
      case 'any-comment':
          shouldRead = true;
          break;
      case 'dot-comment':
          shouldRead = text.startsWith('.');
          break;
      case 'slash-comment':
          shouldRead = text.startsWith('/');
          break;
      case 'command-comment':
          const commandPrefix = document.getElementById('command').value;
          if (text.startsWith(commandPrefix)) {
              shouldRead = true;
              text = text.replace(commandPrefix, '');
          }
          break;
  }

  if (selectedVoice.id === 'selectvoice2') {
      new TTS(text);
  } else {
      leerMensajes(text);
  }

  return true;
}
export { leerMensajes, skipAudio, handleleermensaje };
