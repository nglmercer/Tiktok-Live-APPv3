import socketManager, { Websocket, socketurl } from './src/utils/socket';
import textReplacer, { imageManipulator } from './src/utils/textReplacer';
import  { IndexedDBManager, databases, DBObserver } from "./src/utils/indexedDB";
import { UserPointsTable } from './src/UserPoints';
import showAlert from './assets/alerts'
import FormModal from './src/components/FormModal'
import { getformdatabyid, postToFileHandler } from './src/utils/getdata';
import TypeofData from './src/utils/typeof';
import { Counter } from './src/utils/counters';
import { handleleermensaje } from './src/voice/tts';
import { ChatContainer, ChatMessage } from './assets/items';
import { loadFileList, setupDragAndDrop, handlePlayButton, getfileId, handlePasteFromClipboard} from './src/components/Fileshtml'
const observeruserPoints = new DBObserver();
const newChatContainer = new ChatContainer('.chatcontainer', 500);
const newGiftContainer = new ChatContainer('.giftcontainer', 500);
const newEventsContainer = new ChatContainer('.eventscontainer', 200);
const counterchat = new Counter(0, 1000);
const countergift = new Counter(0, 1000);
const countershare = new Counter(0, 1000);
const counterlike = new Counter(0, 1000);
const counterfollow = new Counter(0, 1000);
const filescontent = await postToFileHandler("get-files-in-folder", {});

const textcontent = {
  content: {
    1: ["text", "hola","white"],
    2: ["text", "mundo","white"],
    3: ["text", "!","gold"],
  }
}
const numbercontent = {
  content: {
    1: ["text", "hola","white"],
    2: ["number", 12345,"blue"],
    3: ["text", "gift x","gold"],
    4: ["number", 12345,"blue"],
    5: ["text", "!","gold"],
  }
}

const message1 = new ChatMessage( `msg${counterchat.increment()}`, 'https://cdn-icons-png.flaticon.com/128/6422/6422200.png', textcontent);
const message2 = new ChatMessage( `msg${counterchat.increment()}`, 'https://cdn-icons-png.flaticon.com/128/6422/6422200.png', numbercontent);
newChatContainer.addMessage(message1);
newGiftContainer.addMessage(message2);
newEventsContainer.addMessage(message2);
const userPointsDBManager = new IndexedDBManager(databases.userPoints,observeruserPoints);
const optionstable = {
  th: ['nickname', 'imageUrl', 'points', 'Last Activity'],
  initialVisibleUsers: 10,
  maxVisibleUsers: 10
};

const initialData = await getAllDataFromDB(userPointsDBManager);

console.log("initialData", initialData);
const userPointsTable = new UserPointsTable('userPointsTable', optionstable, initialData);
observeruserPoints.subscribe(async (action, data) => {
 if (action === "delete") {
    console.log("observer.subscribe", data, action);
  } else if (action === "update") {
    console.log("observer.subscribe", data, action);
    userPointsTable.renderTable();

  } else if (action === "save") {
    console.log("observer.subscribe", data, action);
    userPointsTable.renderTable();
  }
});
class getdataIndexdb {
  constructor() {
    this.dbManager = null;
  }

  // Método para obtener todos los datos de la base de datos y almacenarlos en la clase
  async getAllDataFromDB(dbManager) {
        const dbManagerdata = await getAllData(dbManager);
        console.log("dbManagerdata", dbManagerdata);
        this.dbManager = dbManager;
        return dbManagerdata;
  }

  // Método para buscar datos en base al 'id' o 'name' y devolver una propiedad específica
  async getdataIndexdb(data, property = null) {
    const dbManagerdata = await getAllDataFromDB(userPointsDBManager);
    if (!dbManagerdata || dbManagerdata.length === 0) {
      console.log("No data loaded. Please call getAllDataFromDB first.");
      return null;
    }
    const foundItem = dbManagerdata.find(
      item => item.uniqueId === data.uniqueId || item.name === data.name
    );

    if (foundItem) {
      console.log("foundItem", foundItem, property, foundItem[property]);
      return property ? foundItem[property] : foundItem;
    } else {
      console.log("No se encontró un item con el id o name proporcionado.");
      return null;
    }
  }
}
async function getAllDataFromDB(dbManager) {
  try {
      const dbManagerdata = await dbManager.getAllData();
      console.log(dbManagerdata);
      return dbManagerdata;
  } catch (e) {
      console.error("Error getting documents: ", e);
  }
}
const getdataIndexdbInstance = new getdataIndexdb();




let websocket = null;
const uniqueidform = document.getElementById("uniqueidform");
uniqueidform.addEventListener("submit", function(event) {
  event.preventDefault();
  const formData = getformdatabyid(uniqueidform);
  // Recorrer todos los pares clave-valor y mostrarlos en la consola

  const uniqueid = formData.tiktok_name;
  if (uniqueid) {
    console.log(uniqueid);
    connect(uniqueid);
  } else {
    alert("Por favor ingrese un nombre de tiktok");
    console.log(getformdatabyid(uniqueidform))
    console.log(formData);
  }
});
const buttonDisconnectTikTok = document.getElementById("btnDisconnectTikTok");
const websocketConnect = document.getElementById("websocketConnect");
buttonDisconnectTikTok.addEventListener("click", function(event) {
  console.log("buttonDisconnectTikTok", event);
  socketManager.emitMessage("disconnect_tiktok");
});
websocketConnect.addEventListener("click", function(event) {
  websocket = new Websocket({
    url: "ws://localhost:21213/",
    maxAttempts: 5,
    stateElementId: "stateText"
  });
  websocket.connect(handleWebsocketMessage);
});
function connect(uniqueid){
  console.log("uniqueid", uniqueid);
  socketManager.emitMessage('uniqueid', `${uniqueid}`);
}
function handleWebsocketMessage(event) {
  let parsedData = JSON.parse(event.data);
  let eventype = parsedData.event;
  let data = parsedData.data;
  handleevents(eventype, data);
}
function handleevents(eventype, data) {
  const evaldata = evalBadge(data);
  if (evaldata) {
    console.log("evaldata", evaldata);
  } else {
  }
  evalsystempoints(eventype,data);

  switch (eventype) {
    case "chat":
        handlechat(data);
        if (!evalBadge(data)) {
          console.log("evalBadge",false, data)
          return;
        }
        if (evalmessagecontainsfilter(data.comment)) {
            console.log("evalmessagecontainsfilter",evalmessagecontainsfilter(data.comment), data)
            return;
        }
        handleleermensaje(data.comment);
        break;
    case "share":
        handleshare(data);
        break;
    case "social":
        handlesocial(data);
        break;
    case "likes":
    case "like":
        handlelike(data);
        break;
    case "follow":
        handlefollow(data);
        break;
    case "gift":
        handlegift(data);
        break;
    case "connected":
        onConnected(data);
        break;
    case "roominfo":
        onRoominfo(data);
        break;
    case "streamEnd":
        console.log("streamEnd");
        break;
    case "disconnected":
        console.log("disconnected");
        break;
    default:
        sendToServer(eventype, data);
        break;
}
}

async function evalsystempoints(eventype, data) {
  if (!data.uniqueId) return;
  const getpoinifexists = TypeofData.toNumber(await getdataIndexdbInstance.getdataIndexdb(data, 'points')) || 0;
  console.log("getpoinifexists", getpoinifexists);
  let userpoints = {
      uniqueId: data.uniqueId,
      nickname: data.nickname,
      uniqueId: data.uniqueId,
      name: data.uniqueId,
      points: 0,
      imageUrl: data.profilePictureUrl,
  };
  const form = document.getElementById('pointsForm');
  const config = getformdatabyid(form);
  console.log("evalsystempoints", config);
  localStorage.setItem(eventype, JSON.stringify(data));
  const eventPointscheck = {
    follow: config.Pointsperfollow.check,
    share: config.Pointspershare.check,
    gift: config.Pointspercoin.check,
    chat: config.Pointsperchat.check,
    like: config.Pointsperlike.check,
  }
  const ponistvalue = {
    follow: TypeofData.toNumber(config.Pointsperfollow.value) || 0,
    share: TypeofData.toNumber(config.Pointspershare.value) || 0,
    gift: TypeofData.toNumber(config.Pointspercoin.value )|| 0,
    chat: TypeofData.toNumber(config.Pointsperchat.value )|| 0,
    like: TypeofData.toNumber(config.Pointsperlike.value )|| 0,
  };

  if (eventPointscheck[eventype]) {
      switch (eventype) {
        case "chat":
          userpoints.points = ponistvalue.chat += getpoinifexists || 0;
          console.log("chat", userpoints.points);
          break;
        case "share":
          userpoints.points = ponistvalue.share += getpoinifexists || 0;
          console.log("share", userpoints.points);
          break;
        case "gift":
          const numbergiftcoins = TypeofData.toNumber(data.diamondCount) || 0;
          userpoints.points = ponistvalue.gift += getpoinifexists * numbergiftcoins || 0;
          console.log("gift", userpoints.points);
          break;
        case "follow":
          userpoints.points = ponistvalue.follow += getpoinifexists || 0;
          console.log("follow", userpoints.points);
          break;
        case "like":
          userpoints.points = ponistvalue.like += getpoinifexists || 0;
          console.log("like", userpoints.points);
          break;
        default:
          userpoints.points = 0;
          break;
      }
  }
  if (userpoints.points  <=0) return userpoints;
  userPointsDBManager.saveOrUpdateDataByName(userpoints);
  console.log("Puntos asignados:",eventype, userpoints);
  return userpoints;
}
let testuserpoints = {
  uniqueId: "test",
  nickname: "test",
  name: "test",
  points: Math.floor(Math.random() * 100),
  imageUrl: "test",
};
// setInterval(() => {
//   testuserpoints.points = Math.floor(Math.random() * 100);
//   userPointsDBManager.saveOrUpdateDataByName(testuserpoints);
// }, 1000);
function handlechat(data) {
  const parsedchatdata = {
    content: {
      1: ["text", data.uniqueId,"white"],
      2: ["text", data.comment,"white"],
      3: ["text", "!","gold"],
    }
  }
  const newMessage = new ChatMessage( `msg${counterchat.increment()}`, data.profilePictureUrl, parsedchatdata);
  newChatContainer.addMessage(newMessage);
  console.log("chat", data);
  showAlert('info', `${data.uniqueId}: ${data.comment}`, 5000);
}
function handleshare(data) {
  const parsedsharedata = {
    content: {
      1: ["text", data.uniqueId,"white"],
      2: ["text", "shared","white"],
      3: ["text", "!","gold"],
    }
  }
  const newMessage = new ChatMessage( `msg${countershare.increment()}`, data.profilePictureUrl, parsedsharedata);
  newEventsContainer.addMessage(newMessage, true);
  console.log("share", data);
}
function handlesocial(data) {
  console.log("social", data);
}
function handlelike(data) {
  console.log("like", data);
  const parsedlikedata = {
    content: {
      1: ["text", data.uniqueId,"white"],
      2: ["text", "likes","white"],
      3: ["number", data.likeCount,"gold"],
    }
  }
  const newMessage = new ChatMessage( `msg${counterlike.increment()}`, data.profilePictureUrl, parsedlikedata);
  newEventsContainer.addMessage(newMessage, true);
  showAlert('info', `${data.uniqueId} likes ${data.likeCount}`, 5000);
}
function handlefollow(data) {
  console.log("follow", data);
}
function handlegift(data) {
  console.log("gift", data);
  const parsedgiftdata = {
    content: {
      1: ["text", data.uniqueId,"white"],
      2: ["text", "gifted","white"],
      3: ["number", data.diamondCount,"gold"],
    }
  }
  const newMessage = new ChatMessage( `msg${countergift.increment()}`, data.profilePictureUrl, parsedgiftdata);
  newGiftContainer.addMessage(newMessage);
  showAlert('info', `${data.uniqueId} gifted ${data.diamondCount}`, 5000);
}
function sendToServer(eventype, data) {
  console.log("sendToServer", eventype, data);
}
function onConnected(data) {
  console.log("onConnected", data);
  textReplacer.replaceText("#stateText", `${data.isConnected} to ${data.roomId}` );
  showAlert('info', `${data.isConnected} to ${data.roomId}`, 10000);
  showAlert('success', `${data.isConnected} to ${data.roomId}`, 10000);
}
function onRoominfo(data) {
  localStorage.setItem("RoomInfo", JSON.stringify(data));
  if (data.cover) {
    imageManipulator.manipulateImage("#uniqueIdImage", data.cover.url_list[0], "src");
  } else if (data.owner) {
    textReplacer.replaceText("#btnConnectTikTok", `connected to ${data.owner.nickname}` );
  }
  console.log("onRoominfo", data.nickname,data);
  showAlert('info', `${data.cover}`, 10000);
}
// cuando el documento y el dom se cargan

const events = ['connected', 'chat', 'share', 'social', 'like', 'follow', 'gift', 'streamEnd', 'disconnected', 'emote', 'envelope', 'questionNew', 'subscribe', 'member', 'roomUser'];
events.forEach(event => {
  socketManager.on(event, (data) => {
    try {
      handleevents(event, data); // Lógica para manejar el evento
    } catch (error) {
      console.error(`Error handling event ${event}:`, error);
    }
  });
});
socketManager.on("roominfo", (data) => {
    onRoominfo(data);
  });

console.log("socketManager123123123");
setTimeout(async () => {
  await loadFileList();
}, 5000);
function evalBadge(data) {
  if (!data || !data.uniqueId) return true;
  const checkboxes = document.querySelectorAll('.card-content input[type="checkbox"]');
  let values = {};

  // Recolectar el estado de los checkboxes y inputs adicionales
  checkboxes.forEach(checkbox => {
      const relatedInput = document.getElementById(`${checkbox.id}-value`);
      if (relatedInput) {
          values[checkbox.id] = {
              checked: checkbox.checked,
              value: relatedInput.value
          };
      } else {
          values[checkbox.id] = checkbox.checked;
      }
  });
  if (data.uniqueId) {
    console.log(data.uniqueId, "uniqueId evalBadge", values);
  }
  // Evaluar si el usuario cumple al menos uno de los criterios
  for (const [key, value] of Object.entries(values)) {
      if (values.allUsers === true) {
          console.log("allUsers retornamos true y no hacemos nada", values.allUsers);
          return true;
      }

      if (typeof value === 'object' && data[key] !== undefined )  {
          // Verificar si el valor es un objeto con un campo "checked" y "value"
          if (value.checked && ((typeof data[key] === 'number' && data[key] > 0) || (typeof data[key] === 'boolean' && data[key]))) {
              console.log(`Condition met for ${key} with value ${data[key]} and additional value ${value.value}`);
              return true;
          }
      } else if (value === true && ((typeof data[key] === 'boolean' && data[key]) || (typeof data[key] === 'number' && data[key] > 0))) {
          console.log(`Condition met for ${key} with value ${data[key]}`);
          return true;
      }
  }

  return false;
}
const options = [
  { value: 'keyPress', label: 'Presionar Tecla' },
  { value: 'openApp', label: 'Abrir Aplicación' },
];
const appOptions = filescontent.map((app) => ({
  value: app.path,
  label: app.name,
}));
const formConfig = [
  {
    type: 'checkbox',
    name: 'eventcheck',
    label: 'Mostrar Grupo',
    inputType: 'checkbox',
    children: [
      { type: 'input', name: 'id', label: 'ID', inputType: 'Number', returnType: 'Number', hidden: true },
      { type: 'input', name: 'nombre', label: 'Nombre', inputType: 'text', returnType: 'string' },
      { type: 'input', name: 'textparsed', label: 'Texto', inputType: 'text', returnType: 'string' },
      { type: 'input', name: 'duration', label: 'Duracion', inputType: 'number', returnType: 'number' },
      { type: 'slider', name: 'volume', label: 'Volumen', inputType: 'range', returnType: 'number' },
    ],
    returnType: 'boolean',
  },

  { type: 'checkbox', name: 'active', label: 'active', inputType: 'checkbox', returnType: 'boolean' },
  { type: 'select', name: 'actionType', label: 'Tipo de Acción', options: [{ value: 'keyPress', label: 'Presionar Tecla' }, { value: 'openApp', label: 'Abrir Aplicación' }], returnType: 'string' },
  { type: 'multiSelect', name: 'keyvalue', label: 'Keyvalue', options: options, returnType: 'array', hidden: true },
  { type: 'select', name: 'application', label: 'Application', options: appOptions, returnType: 'string' },
];

const formModal = new FormModal('#modal1', '#dynamicForm2', 'submitFormBtn2', 'openModaltest');
const openModaltest = document.getElementById('openModaltest');
console.log("formModal", formModal);
const existingData = {
  nombre: 'Accion',
  actionType: 'keyPress',
  application: 'app1',
  keyvalue: ["F1", "F2"]  // Valores a seleccionar en el multiSelect
};
openModaltest.addEventListener('click', () => {
  formModal.open(formConfig, (formData) => {
    console.log("formData", formData);
  }, {}, false);
});
function evalmessagecontainsfilter(text) {
  const filterWords = JSON.parse(localStorage.getItem('filterWords')) || [];
  if (filterWords.length === 0) return false;

  const message = text.toLowerCase();
  return filterWords.some(word => {
      word = word.toLowerCase();
      if (message.includes(word)){
          console.log(`${word} filtrado por palabra: ${message}`);
      }
      return message.includes(word);
  });
}
document.addEventListener('DOMContentLoaded', async () => {
  setupDragAndDrop();
});
export { socketManager }
