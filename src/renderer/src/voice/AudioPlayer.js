class AudioPlayer {
  constructor(audioId, onPrevious, onNext) {
    this.audio = document.getElementById(audioId);
    this.onPrevious = onPrevious;
    this.onNext = onNext;
    this.createControls();
    this.addEventListeners();
  }
  createControls() {
      const container = document.createElement('div');
      container.className = 'audio-player';
    this.audioTitle = document.createElement('div');
    this.audioTitle.className = 'audio-title';
    container.appendChild(this.audioTitle);
      this.playBtn = document.createElement('button');
      this.playBtn.innerHTML = '▶';
      this.playBtn.className = 'play-btn';

      this.prevBtn = document.createElement('button');
      this.prevBtn.innerHTML = '⏮';
      this.prevBtn.className = 'prev-btn';

      this.nextBtn = document.createElement('button');
      this.nextBtn.innerHTML = '⏭';
      this.nextBtn.className = 'next-btn';

      this.volumeSlider = document.createElement('input');
      this.volumeSlider.type = 'range';
      this.volumeSlider.min = 0;
      this.volumeSlider.max = 1;
      this.volumeSlider.step = 0.01;
      this.volumeSlider.value = 1;
      this.volumeSlider.className = 'volume-slider';

      this.progressBar = document.createElement('input');
      this.progressBar.type = 'range';
      this.progressBar.min = 0;
      this.progressBar.max = 100;
      this.progressBar.value = 0;
      this.progressBar.className = 'progress-bar';

      this.currentTime = document.createElement('span');
      this.currentTime.className = 'current-time';
      this.currentTime.textContent = '0:00';

      this.duration = document.createElement('span');
      this.duration.className = 'duration';
      this.duration.textContent = '0:00';

      this.volumetext = document.createElement('span');
      this.volumetext.className = 'volumetext';
      this.volumetext.textContent = '🔉';


      container.appendChild(this.progressBar);
      container.appendChild(this.currentTime);
      container.appendChild(this.duration);
    container.appendChild(this.prevBtn);
      container.appendChild(this.playBtn);
      container.appendChild(this.nextBtn);
      container.appendChild(this.volumetext);
      container.appendChild(this.volumeSlider);

      this.audio.parentNode.insertBefore(container, this.audio.nextSibling);
  }

  addEventListeners() {
      this.playBtn.addEventListener('click', () => this.togglePlay());
      this.prevBtn.addEventListener('click', () => this.playPrevious());
      this.nextBtn.addEventListener('click', () => this.playNext());
      this.volumeSlider.addEventListener('input', () => this.setVolume());
      this.progressBar.addEventListener('input', () => this.setProgress());
      this.audio.addEventListener('timeupdate', () => this.updateProgress());
      this.audio.addEventListener('loadedmetadata', () => this.setDuration());
      this.audio.addEventListener('play', () => this.playBtn.innerHTML = '⏸');
      this.audio.addEventListener('pause', () => this.playBtn.innerHTML = '▶');
  }

  togglePlay() {
      if (!this.audio.src) return;
      if (this.audio.paused) {
          this.audio.play();
          this.playBtn.innerHTML = '⏸';
      } else {
          this.audio.pause();
          this.playBtn.innerHTML = '▶';
      }
  }

  playPrevious() {
    this.audio.pause();
    this.audio.currentTime = 0;
    if (this.onPrevious) {
      this.onPrevious();
    }
  }


  playNext() {
    this.audio.pause();
    this.audio.currentTime = 0;
    if (this.onNext) {
      this.onNext();
    }
  }

  setVolume() {
      if (!this.audio.src) return;
      this.audio.volume = this.volumeSlider.value;
  }

  setProgress() {
      if (!this.audio.src) return;
      const progress = this.progressBar.value;
      this.audio.currentTime = (progress / 100) * this.audio.duration;
  }

  updateProgress() {
      if (!this.audio.src) return;
      const progress = (this.audio.currentTime / this.audio.duration) * 100;
      this.progressBar.value = progress;
      this.currentTime.textContent = this.formatTime(this.audio.currentTime);
  }

  setDuration() {
      if (!this.audio.src) return;
      this.duration.textContent = this.formatTime(this.audio.duration);
  }

  formatTime(time) {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
    setAudioInfo(title) {
    this.audioTitle.textContent = title;
  }
}

export default AudioPlayer;
