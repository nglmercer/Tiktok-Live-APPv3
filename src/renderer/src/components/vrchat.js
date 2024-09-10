// import { send } from 'vite';
import socketManager, { Websocket, socketurl } from '../utils/socket'
document.getElementById('vrchatForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  createosc(data);
});
let oscOptions = [
  {label: 'moveForward', value: 'MoveForward'},
  {label: 'moveBackward', value: 'MoveBackward'},
  {label: 'moveLeft', value: 'MoveLeft'},
  {label: 'moveRight', value: 'MoveRight'},
  {label: 'jump', value: 'Jump'},
  {label: 'run', value: 'Run'},
]
document.getElementById('oscAction').innerHTML = oscOptions.map(option => `<option value="${option.value}">${option.label}</option>`).join('');
document.getElementById('oscActionButton').addEventListener('click', () => {
  const selectedOption = document.getElementById('oscAction').value;
  console.log("selectedOption", selectedOption);
  handleMovement(selectedOption, true);
  setTimeout(() => handleMovement(selectedOption, false), 1000);
});
document.getElementById('lookHorizontal').addEventListener('change', () => {
  const value = document.getElementById('lookHorizontal').value;
  handleMovement('LookHorizontal', Number(value));
});

const movementButtons = {
  'moveForward': 'MoveForward',
  'moveBackward': 'MoveBackward',
  'moveLeft': 'MoveLeft',
  'moveRight': 'MoveRight',
  'jump': 'Jump',
  'run': 'Run',
  'lookHorizontal': 'LookHorizontal',
  'lookVertical': 'LookVertical',
  };
Object.entries(movementButtons).forEach(([buttonId, action]) => {
  const button = document.getElementById(buttonId);
  button.addEventListener('mousedown', () => handleMovement(action, true));
  button.addEventListener('mouseup', () => handleMovement(action, false));
  button.addEventListener('mouseleave', () => handleMovement(action, false));
  });

  // Limpiar al cerrar la ventana
  window.addEventListener('beforeunload', () => {
  });
function handleMovement(action, isDown) {
  console.log("handleMovement", action, isDown);
  socketManager.emitMessage('oscHandler', { action, isDown });
}
  const testosctext = document.getElementById('testosctext');
  const testoscbutton = document.getElementById('testoscbutton');
  testoscbutton.addEventListener('click', () => {
    sendoscmessage(testosctext.value);
    console.log("sendoscmessage", testosctext.value);
  });
function createosc(data) {
  console.log("createosc", data);
  socketManager.emitMessage('oscmanager', data);
}
function sendoscmessage(message){
  socketManager.emitMessage('oscmessage', message);
  console.log("sendoscmessage", message);
}
