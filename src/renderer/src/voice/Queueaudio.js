class Queue {
    constructor() {
        this.items = [];
        this.currentIndex = -1;
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
    hasMore() {
        return this.currentIndex < this.items.length - 1;
    }
}
let isPlaying = false;

class Controlmedia {
    constructor(audioPlayer) {
        this.audioPlayer = audioPlayer;
        this.songQueue = new Queue();
    }
    nextaudio() {
        this.audioPlayer.audio.pause();
        this.audioPlayer.audio.currentTime = 0;
        if (!this.songQueue.isEmpty() && this.songQueue.next()) {
            this.playNextAudio(this.audioPlayer);
        } else {
            isPlaying = false;
        }
    }
    playNextAudio() {
        const audioUrl = this.songQueue.getCurrent();
        if (audioUrl) {
            this.audioPlayer.audio.src = audioUrl;
            this.audioPlayer.audio.load();
            this.audioPlayer.audio.play();
        }
    }
    playPreviousAudio() {
        const audioUrl = this.songQueue.previous();
        if (audioUrl) {
            this.audioPlayer.audio.src = audioUrl;
            this.audioPlayer.audio.load();
            this.audioPlayer.audio.play();
        }
    }

    addSong(audioUrl) {
        console.log('addSong', audioUrl);
        if (audioUrl) {
            this.songQueue.enqueue(audioUrl);3
            if (!isPlaying) {
                isPlaying = true;
                this.kickstartPlayer();
            }
        }
    }

    kickstartPlayer() {
        // if (this.songQueue.isEmpty()) {
        //     isPlaying = false;
        //     return;
        // }

        this.songQueue.next(); // Start at the first song
        isPlaying = true;
        this.playNextAudio(this.audioPlayer);

        this.audioPlayer.audio.onended = () => {
            this.nextaudio();
        };
    }
}


export { Queue, Controlmedia };
