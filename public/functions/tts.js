export class TTS {
  constructor(message) {
    this.speak(message, this.speechType(), this.announceFlag());
  }

  speechType() {
    // if (!document.getElementById('hqspeech').checked) {
    //   return 'browser';
    // }
    return 'browser';
  }

  announceFlag() {
    return null; //document.getElementById('announcechatter').checked;
  }

  speak(message) {



      const utterance = new SpeechSynthesisUtterance(message);
      utterance.volume = document.querySelector('#volume').value;

      const voices = speechSynthesis.getVoices();
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

      utterance.voice = selectedVoice;
      utterance.rate = parseFloat(speed);
      utterance.pitch = parseFloat(pitch);
      // console.log(utterance.voice, utterance.rate, utterance.pitch);

      window.speechSynthesis.speak(utterance);
      document.getElementById("audiotrack").pause();
      document.getElementById("audiotrack").currentTime = 0;
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
