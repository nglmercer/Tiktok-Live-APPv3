import {socketManager} from "./tiktoksocketdata";
// document.getElementById('botform').addEventListener('submit', function(e) {
//   e.preventDefault();
//   const data = Object.fromEntries(new FormData(e.target).entries());
//   handlebotconnect("connect-bot",data);
// });
document.getElementById('Rconform').addEventListener('submit', function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  handlebotconnect("connect-rcon",data);
});
document.getElementById('pluginform').addEventListener('submit', function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  localStorage.setItem("MinecraftPluginServer", JSON.stringify(data)); // Convertir objeto a JSON
  handlebotconnect("connect-plugin",data);
});
if (localStorage.getItem("MinecraftPluginServer")) {
  const data = JSON.parse(localStorage.getItem("MinecraftPluginServer"));
  console.log("MinecraftPluginServer", data);
  handlebotconnect("connect-plugin",data);
  setTimeout(function () {
    handlebotconnect("connect-plugin",data);
  }, 1000);
}
document.getElementById('pluginform')
document.getElementById('sendcommandmc').addEventListener('submit', function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  sendcommandmc(data.commandinput);
});

function handlebotconnect(eventType,data) {
  switch (eventType) {
    case "connect-bot":
      socketManager.emitMessage(eventType,data);
      break;
    case "connect-rcon":
      socketManager.emitMessage(eventType,data);
      break;
    case "connect-plugin":
      pluginconnect(data);
      break;
      default:
        console.log(`Tipo de evento desconocido: ${eventType}`);
  }
}
class WebSocketManager {
  constructor(maxReconnectAttempts = 10, reconnectInterval = 1000) {
      this.maxReconnectAttempts = maxReconnectAttempts;
      this.reconnectInterval = reconnectInterval;
      this.reconnectAttempts = 0;
      this.ws = null;
  }

  connect(wsurl,password) {
      this.ws = new WebSocket(wsurl);
      document.cookie = password ||"x-servertap-key=change_me";

      this.ws.onopen = () => {
          console.log('Opened connection');
          this.ws.send(`/say conectado `);
          this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      };

      this.ws.onmessage = (event) => {
          // console.log('Message from server:', event.data);
          // document.getElementById('output').innerText += '\n' + event.data.replace(/\n/g, '<br>');
      };

      this.ws.onerror = (error) => {
          console.log('WebSocket Error:', error);
      };

      this.ws.onclose = () => {
          console.log('Closed connection');
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
              this.reconnectAttempts++;
              console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,wsurl);
              setTimeout(() => this.connect(wsurl), this.reconnectInterval);
          } else {
              console.log('Max reconnect attempts reached. Giving up.');
          }
      };
  }

  async sendCommand(command) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(command);
          console.log("Command sent:", command);
      } else {
          await this.waitForConnection();
          this.ws.send(command);
          console.log("Command sent after reconnecting:", command);
      }
  }

  async waitForConnection() {
      while (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          await new Promise(resolve => setTimeout(resolve, 1000));
      }
  }
}
const ws = new WebSocketManager();
function sendcommandmc(command) {
    ws.sendCommand(command);
    socketManager.emitMessage("sendcommandMinecraft", command);
    console.log("sendcommandmc", command);
}
function pluginconnect(data) {
  let defaultOptions = {
    host: data.host || "localhost",
    port: data.port || 4567,
    password: data.password || "change_me",
  }
  const wsurl = `ws://${defaultOptions.host}:${defaultOptions.port}/v1/ws/console`;
  setTimeout(() => {
    ws.connect(wsurl, defaultOptions.password);
    ws.sendCommand(`/say conectado `);
  }, 1000);
}
class Minecraftws {
  constructor() {
  this.ws = null;
  this.isConnected = false;
  }
  connect(data){
    let defaultOptions = {
      host: "localhost",
      port: 4567,
      password: "change_me",
    }
    const wsurl = `ws://${defaultOptions.host}:${defaultOptions.port}/v1/ws/console`;
    this.ws = new WebSocket(wsurl);
  }
  send(data) {

  }
}
function getFormDataById(e,formId) {
  e.preventDefault();
  const form = document.getElementById(formId);
  if (!form) {
      console.error(`Formulario con id "${formId}" no encontrado.`);
      return null;
  }

  const formObject = getAllFormDataById(formId);

  return formObject;
}
function getAllFormDataById(formId) {
const form = document.getElementById(formId);
if (!form) {
    console.error(`Formulario con id "${formId}" no encontrado.`);
    return null;
}

const formElements = form.querySelectorAll('input, select, textarea'); // Selecciona todos los inputs, selects y textareas
const formObject = {};
console.log("formElements", formElements);
formElements.forEach(element => {
    const { name, value, type, checked } = element;

    if (type === 'checkbox' || type === 'radio') {
        if (checked) {
            formObject[name] = value;
        }
    } else {
        formObject[name] = value;
    }
});

return formObject;
}

function getFormDataByClass(e,formClass) {
  e.preventDefault();
  const form = document.querySelector(`${formClass}`);
  if (!form) {
      console.error(`Formulario con clase "${formClass}" no encontrado.`);
      return null;
  }

  const formData = new FormData(form);
  const formObject = {};

  formData.forEach((value, key) => {
      formObject[key] = value;
  });

  return formObject;
}
export { socketManager, ws, sendcommandmc }
