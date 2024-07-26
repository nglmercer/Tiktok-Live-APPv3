class SpeechSynthesisRecorder {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    recordSpeech(message, options = {}) {
        return new Promise((resolve, reject) => {
            const { volume = 1, pitch = 1, rate = 1, voice = null } = options;
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.volume = volume;
            utterance.pitch = pitch;
            utterance.rate = rate;
            if (voice) {
                utterance.voice = voice;
            }

            const audioChunks = [];
            const destination = this.audioContext.createMediaStreamDestination();
            const mediaRecorder = new MediaRecorder(destination.stream);

            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm; codecs=opus' });
                const audioUrl = URL.createObjectURL(audioBlob);
                resolve(audioUrl);
            };

            let startTime;
            utterance.onstart = () => {
                startTime = Date.now();
                mediaRecorder.start();
            };

            utterance.onend = () => {
                const duration = Date.now() - startTime;
                setTimeout(() => {
                    mediaRecorder.stop();
                    this.audioContext.close();
                }, Math.max(0, duration - 100)); // Asegurarse de que la grabación cubra toda la duración del habla
            };

            // Crear un nodo de ganancia para controlar el volumen
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

            // Conectar los nodos
            gainNode.connect(destination);

            // Hablar el texto
            window.speechSynthesis.speak(utterance);
        });
    }
}

export default SpeechSynthesisRecorder;