class encola {
    constructor() {
        this.items = [];
        this.currentIndex = -1;
    }

    enencola(element) {
        this.items.push(element);
    }

    deencola() {
        if (this.isEmpty()) {
            return "Underflow";
        }
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }

    getCurrent() {
        if (this.currentIndex >= 0 && this.currentIndex < this.items.length) {
            return this.items[this.currentIndex];
        }
        return null;
    }

    next() {
        if (this.currentIndex < this.items.length - 1) {
            this.currentIndex++;
            return this.getCurrent();
        }
        return null;
    }

    previous() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return this.getCurrent();
        }
        return null;
    }
}
let reproduciendose = false;

class mediacontrol {
    constructor(reproductoraudio) {
        this.reproductoraudio = reproductoraudio;
        this.songencola = new encola();
    }
    siguienteaudio() {
        this.reproductoraudio.audio.pause();
        this.reproductoraudio.audio.currentTime = 0;
        if (!this.songencola.isEmpty() && this.songencola.next()) {
            this.playsiguienteAudio(this.reproductoraudio);
        } else {
            reproduciendose = false;
        }
    }
    playsiguienteAudio() {
        const audioUrl = this.songencola.getCurrent();
        if (audioUrl) {
            this.reproductoraudio.audio.src = audioUrl;
            this.reproductoraudio.audio.load();
            this.reproductoraudio.audio.play();
        }
    }
    playPreviousAudio() {
        const audioUrl = this.songencola.previous();
        if (audioUrl) {
            this.reproductoraudio.audio.src = audioUrl;
            this.reproductoraudio.audio.load();
            this.reproductoraudio.audio.play();
        }
    }

    addSong(audioUrl) {
        console.log('addSong', audioUrl);
        if (audioUrl) {
            this.songencola.enencola(audioUrl);3
            if (!reproduciendose) {
                reproduciendose = true;
                this.kickstartPlayer();
            }
        }
    }

    kickstartPlayer() {
        if (this.songencola.isEmpty()) {
            reproduciendose = false;
            return;
        }

        this.songencola.next(); // Start at the first song
        reproduciendose = true;
        this.playsiguienteAudio(this.reproductoraudio);

        this.reproductoraudio.audio.onended  = () => {
            this.siguienteaudio(this.reproductoraudio);
        };
    }
}


export { encola, mediacontrol };
