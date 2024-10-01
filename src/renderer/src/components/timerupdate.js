import { socketManager } from '../tiktoksocketdata';
const backendUrltimer = "https://cute-rook-14.deno.dev";
const socket = io(backendUrltimer);
const roomId = window.location.search.split('?')[1] || localStorage.getItem('tiktok_name') || 'CountdownRoom';
const countdownIframe = document.getElementById('countdownIframe');
if (roomId) {
    countdownIframe.innerHTML = `<url-iframe url="${window.location.origin}/timer.html?${roomId}"></url-iframe>`;
}
socket.on("connect", () => {
  console.log("Connected to backend");
});
socket.on("disconnect", () => {
  console.log("Disconnected from backend");
});
socket.on("allCounters", (data) => {
  console.log("allCounters", data);
  if (data) {
    data.forEach(element => {
      console.log("counterCreated", roomId);
      if (element.id === roomId) {
        console.log("counterCreated", element);
        updateTime(element.remainingTime);
        if (element.timerState) {
          CountdownStop();
        } else {
          CountdownStart();
        }
      }
    });
  }
});
socket.on("counterCreated", (data) => {
  console.log("counterCreated", data);
});
const controlpanelStart = document.getElementById('control-panel-start');
const controlpanelPause = document.getElementById('control-panel-pause');
const controlpanelReset = document.getElementById('control-panel-reset');
const timeControlInput = document.getElementById('time-control-input');
const timeControlUnit = document.getElementById('time-control-unit');
const timeButtonPlus = document.getElementById('time-button-plus');
const timeButtonMinus = document.getElementById('time-button-minus');


controlpanelStart.addEventListener('click', () => {CountdownStart()});
controlpanelPause.addEventListener('click', () => {CountdownStop()});
controlpanelReset.addEventListener('click', () => {CountdownReset()});
timeButtonPlus.addEventListener('click', () => {AddOrSubtractTime('add', getTimeFromInput())});
timeButtonMinus.addEventListener('click', () => {AddOrSubtractTime('subtract', getTimeFromInput())});
class Countdown {
  constructor(initialTime = 1) {
      this.initialTime = initialTime;
      this.remainingTime = initialTime;
      this.countdownInterval = null;
      this.isRunning = false;
      this.onUpdate = null;
      this.onComplete = null;
  }
  setInitialTime(initialTime) {
    this.initialTime = initialTime;
    this.remainingTime = initialTime;
  }
  start() {
      if (!this.isRunning) {
          this.isRunning = true;
          this.countdownInterval = setInterval(() => {
              this.remainingTime = Math.max(0, this.remainingTime - 1); // Restar 1 segundo
              if (this.onUpdate) this.onUpdate(this.getTimeString());
              if (this.remainingTime <= 0) {
                  this.stop();
                  if (this.onComplete) this.onComplete();
              }
          }, 1000); // Intervalo de 1 segundo
      }
  }

  pause() {
      if (this.isRunning) {
          clearInterval(this.countdownInterval);
          this.isRunning = false;
      }
  }

  resume() {
      if (!this.isRunning) {
          this.start();
      }
  }

  stop() {
      clearInterval(this.countdownInterval);
      this.isRunning = false;
  }

  reset(time) {
      this.stop();
      this.remainingTime = time || this.initialTime;
      if (this.onUpdate) this.onUpdate(this.getTimeString());
      socketManager.emitMessage('countdowtime', { action: 'reset', time: time || this.initialTime });
      socket.emit('resetTime', { id: roomId, totalTime: time || this.initialTime, maxTime: 999999 });
  }

  updateTime(newTime) {
      if (!isNaN(newTime) && newTime >= 0) {
          this.remainingTime = newTime;
          if (this.onUpdate) this.onUpdate(this.getTimeString());
      }
  }

  getTimeString() {
    const days = Math.floor(this.remainingTime / 86400);
    const hours = Math.floor((this.remainingTime % 86400) / 3600);
    const minutes = Math.floor((this.remainingTime % 3600) / 60);
    const seconds = Math.floor(this.remainingTime % 60);

    let timeString = '';

    if (days > 0) {
        timeString += `${days}d `;
    }
    if (days > 0 || hours > 0) {
        timeString += `${hours}h `;
    }
    if (days > 0 || hours > 0 || minutes > 0) {
        timeString += `${minutes}m `;
    }
    timeString += `${seconds}s`;

    return timeString.trim();
  }
  getTimeString2() {
    const days = Math.floor(this.remainingTime / 86400);
    const hours = Math.floor((this.remainingTime % 86400) / 3600);
    const minutes = Math.floor((this.remainingTime % 3600) / 60);
    const seconds = Math.floor(this.remainingTime % 60);

    let timeString = '';

    if (days > 0) {
        timeString += `${days}: `;
    }
    if (days > 0 || hours > 0) {
        timeString += `${hours}: `;
    }
    if (days > 0 || hours > 0 || minutes > 0) {
        timeString += `${minutes}: `;
    }
    timeString += `${seconds}s`;

    return timeString.trim();
  }

  getTime() {
      return this.remainingTime;
  }
  isRunningtime() {
    return this.isRunning;
  }
}

const countdown = new Countdown();
countdown.onUpdate = (timeString) => {
  document.getElementById('countdown').textContent = timeString;
  console.log('El tiempo restante es:', timeString, countdown.getTime());
};
countdown.onComplete = () => {
  console.log('La cuenta regresa a 0');
  socket.emit('deleteCounter', { id: roomId });
};
function getTimeFromInput() {
  const Timeinput = document.getElementById('time-control-input').value;
  const Unitime = document.getElementById('time-control-unit').value;
  console.log("getTimeFromInput",Timeinput, Unitime);
  switch (Unitime) {
    case 'Minutes':
    case 'Minutos':
      return Timeinput * 60;
    case 'Hours':
    case 'Horas':
      return Timeinput * 3600;
    case 'Days':
    case 'Dias':
      return Timeinput * 86400;
    default:
      return Timeinput * 1;
  }
}
function getInitialTimeFromInput() {
  const Timeinput = document.getElementById('time-control-initialTime').value;
  const Unitime = document.getElementById('time-control-initialTimeUnit').value;
  console.log("getTimeFromInput",Timeinput, Unitime);
  if (Timeinput <= 1) {
    return 60;
  }
  switch (Unitime) {
    case 'Minutes':
    case 'Minutos':
      return Timeinput * 60;
    case 'Hours':
    case 'Horas':
      return Timeinput * 3600;
    case 'Days':
    case 'Dias':
      return Timeinput * 86400;
    default:
      return Timeinput * 1;
  }
}
function updateTime(timertime = 60) {
  countdown.updateTime(timertime);
  socketManager.emitMessage('countdowtime', { action: 'update', time: timertime });
  if (countdown.isRunningtime()) {
    socket.emit('pauseCounter', { id: roomId });
  } else {
    socket.emit('resumeCounter', { id: roomId });
  }
}
function CountdownStart() {
  if (countdown.getTime() <= 1) {
    countdown.setInitialTime(getInitialTimeFromInput());
    socket.emit('updateTime', { id: roomId, seconds: getInitialTimeFromInput() });
    socketManager.emitMessage('countdowtime', { action: 'update', time: getInitialTimeFromInput() });
  }
  countdown.start();
  console.log('La cuenta comienza', countdown.getTime());
  socketManager.emitMessage('countdowtime', { action: 'start' });
  socket.emit('createCounter', { id: roomId, totalTime: getInitialTimeFromInput(), maxTime: 999999 });
  socket.emit('resumeCounter', { id: roomId });
}
function CountdownStop() {
  countdown.stop();
  console.log('La cuenta se detiene', countdown.getTime());
  socketManager.emitMessage('countdowtime', { action: 'stop' });
  socket.emit('pauseCounter', { id: roomId });
}
function CountdownReset() {
  countdown.reset(getInitialTimeFromInput());
  console.log('La cuenta se reinicia', countdown.getTime());
  socket.emit('updateTime', { id: roomId, seconds: getInitialTimeFromInput() });
}
// function AddTime(time) {
//   countdown.updateTime(countdown.getTime() + time);
//   socketManager.emitMessage('countdowtime', { action: 'add', time: time });
//   console.log('Se añade', time, 'segundos a la cuenta', countdown.getTime(), getTimeFromInput());
// }
function AddOrSubtractTime(action, time) {
  if (action === 'add') {
    countdown.updateTime(countdown.getTime() + time);
    socket.emit('addTime', { id: roomId, seconds: time });
  } else if (action === 'subtract') {
    countdown.updateTime(countdown.getTime() - time);
    socket.emit('subtractTime', { id: roomId, seconds: time });
  }
  socketManager.emitMessage('countdowtime', { action: action, time: time });
}
const CounterActions = {
  start: CountdownStart,
  stop: CountdownStop,
  reset: CountdownReset,
  add: AddOrSubtractTime,
  subtract: AddOrSubtractTime,
};
// setInterval(() => {
//   CounterActions.add('add', 10);
//   CounterActions.subtract('subtract', 10);
// }, 1000);
export default CounterActions;
