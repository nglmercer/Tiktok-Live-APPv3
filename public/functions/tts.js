const TTS_API_ENDPOINT = 'https://api.streamelements.com/kappa/v2/speech?';

class Queue {
    constructor() {
        this.items = [];
    }

    enqueue(element) {
        this.items.push(element);
    }

    dequeue() {
        if (this.isEmpty()) {
            return "Underflow";
        }
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

let audioQueue = new Queue();
let lastReadText = null;
let audioMap = {};
let audioKeys = [];
let isPlaying = false;
let audio = document.getElementById('audio');

async function fetchAudio(txt, voice) {
    try {
        if (txt === lastReadText) {
            return;
        }

        lastReadText = txt;

        if (audioMap[txt]) {
            return audioMap[txt];
        }

        const params = new URLSearchParams({
            voice: voice || getVoiceFromVoiceSelect(),
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
    audio.pause();
    audio.currentTime = 0;

    if (!audioQueue.isEmpty()) {
        playNextAudio();
    } else {
        isPlaying = false;
    }
}

function playNextAudio() {
    if (!audioQueue.isEmpty()) {
        const audioUrl = audioQueue.dequeue();
        if (audioUrl) {
            audio.src = audioUrl;
            audio.load();
            audio.play();
        }
    }
}

function kickstartPlayer() {
    if (audioQueue.isEmpty()) {
        isPlaying = false;
        return;
    }

    isPlaying = true;
    playNextAudio();

    audio.onended = function() {
        kickstartPlayer();
    };
}

function leerMensajes(text, voice) {
    if (text) {
        fetchAudio(text, voice).then(audioUrl => {
            if (audioUrl) {
                audioQueue.enqueue(audioUrl);
                if (!isPlaying) {
                    isPlaying = true;
                    playNextAudio();
                }
            }
        });
    }
}

export class TTS {
    constructor(message) {
        this.speak(message);
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
        if (message === lastReadText) {
            return;
        }

        lastReadText = message;

        utterance.voice = selectedVoice;
        utterance.rate = parseFloat(speed);
        utterance.pitch = parseFloat(pitch);

        window.speechSynthesis.speak(utterance);
        if (utterance) {
            audioQueue.enqueue(utterance.voiceURI);
            if (!isPlaying) {
                isPlaying = true;
                playNextAudio();
            }
        }
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

export { leerMensajes, skipAudio };
