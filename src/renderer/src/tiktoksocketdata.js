import socketManager, { Websocket, socketurl } from './utils/socket';
import textReplacer, { imageManipulator } from './utils/textReplacer';
import  { IndexedDBManager, databases, DBObserver } from "./utils/indexedDB";
import { getformdatabyid, postToFileHandler, getdatafromserver, getAllDataFromDB, getdataIndexdb, modifyPoints } from './utils/getdata';
import TypeofData from './utils/typeof';
import { Counter } from './utils/counters';
import showAlert from '../assets/alerts'
import { ChatContainer, ChatMessage } from '../assets/items';
import { newTable } from './utils/UserPoints';
import { handleleermensaje } from './voice/tts';
import { loadFileList, setupDragAndDrop, handlePlayButton, getfileId, handlePasteFromClipboard} from './components/Fileshtml'
import { AccionEventoOverlayEval, getalldatafromAccionEventsDBManager } from './components/Accionevents'
import { addFilterItemToGroup } from './filters/filters'

const addfilterwordcallback = (word) => {
  console.log("addfilterwordcallback", word);
  if (typeof word === 'string') {
    addFilterItemToGroup('filter-words', 'containerfilter-words', 'filterWords', word.comment);
  }
  if (typeof word === 'object') {
    addFilterItemToGroup('filter-words', 'containerfilter-words', 'filterWords', word.comment);
  }
};
const observeruserPoints = new DBObserver();
const newChatContainer = new ChatContainer('.chatcontainer', 500);
const newGiftContainer = new ChatContainer('.giftcontainer', 500);
const newEventsContainer = new ChatContainer('.eventscontainer', 200);
const counterchat = new Counter(0, 1000);
const countergift = new Counter(0, 1000);
const countershare = new Counter(0, 1000);
const counterlike = new Counter(0, 1000);
const counterfollow = new Counter(0, 1000);
const countermember = new Counter(0, 1000);
let UniqueIdname;
function getlastuniqueid() {
  if (UniqueIdname) {
    return UniqueIdname;
  } else if (localStorage.getItem("UniqueId") || localStorage.getItem("tiktok_name")) {
    return localStorage.getItem("UniqueId") || localStorage.getItem("tiktok_name");
  } else {
    return null;
  }
}
// async function sendcreateserver(serverurl,data) {
//   const respone = await getdatafromserver(serverurl,data);
//   console.log("getdatafromserver", respone, serverurl, data);
// }
// sendcreateserver(`${socketurl.getport()}/create-overlaywindow`, {});
const textcontent = {
  content: {
    1: ["text", "nombre de usuario = ","white"],
    2: ["text", "uniqueId","gold"],
    3: ["text", "comentario = ","white"],
    4: ["text", "comment","gold"],
    // 4: ["url", "https://example.com", "blue", "Click para ir a mi perfil"]

  },
  comment: "texto de prueba123123123",
  // data: {
  //   comment: "texto de prueba123123123",
  //   number: 123,
  //   text: "text",
  // }
}
const numbercontent = {
  content: {
    1: ["text", "nombre de usuario = ","white"],
    2: ["text", "uniqueId","gold"],
    3: ["number", 1,"white"],
    4: ["text", "= repeatCount","gold"],
    5: ["text", "giftname = rose","cyan"],
  },
  data: {
    number: 123,
    text: "text",
  }
}
const eventcontent = {
  content: {
    1: ["text", "UniqueId","white"],
    2: ["text", "te","white"],
    3: ["text", "sigue!","yellow"],
  },
  data: {
    number: 123,
    text: "text",
  }
}
const splitfilterwords = (data) => {
  console.log("Callback 1 ejecutado:", data);
  if (data.comment) {
    const comments = data.comment.match(/.{1,10}/g) || [];
    console.log("comments", comments);
    comments.forEach(comment => {
      if (comment.length < 9) return;
      addFilterItemToGroup('filter-words', 'containerfilter-words', 'filterWords', comment);
    });
  }
};

const optionTexts = ['split filtrar comentarios', 'filtrar comentario'];

const message1 = new ChatMessage( `msg${counterchat.increment()}`, 'https://cdn-icons-png.flaticon.com/128/6422/6422200.png', textcontent, [splitfilterwords, addfilterwordcallback],optionTexts);
const message2 = new ChatMessage( `msg${counterchat.increment()}`, 'https://cdn-icons-png.flaticon.com/128/6422/6422200.png', numbercontent);
const message3 = new ChatMessage( `msg${counterchat.increment()}`, 'https://cdn-icons-png.flaticon.com/128/6422/6422200.png', eventcontent);
// Crear callbacks
newChatContainer.addMessage(message1);
newGiftContainer.addMessage(message2);
newEventsContainer.addMessage(message3);
const userPointsDBManager = new IndexedDBManager(databases.userPoints,observeruserPoints);
const initialData = await getAllDataFromDB(userPointsDBManager);
console.log("initialData", initialData);
const tableColumns = [
  { key: 'imageUrl', label: 'Perfil', type: 'image' },
  { key: 'points', label: 'Points', type: 'number' },
  { key: 'nickname', label: 'Nickname', type: 'string' },
  { key: 'uniqueId', label: 'Name', type: 'string' },
  // { key: 'joinedAt', label: 'Joined At', type: 'date' }
];
const userTable = new newTable('userPointsTable', tableColumns, initialData);
// initialData.forEach(item => PointsTable.clearAndAddRows(item));
observeruserPoints.subscribe(async (action, data) => {
 if (action === "delete") {
  const updatedata = await getAllDataFromDB(userPointsDBManager);
  userTable.clearAndAddRows(updatedata);
  } else if (action === "save") {
    const updatedata = await getAllDataFromDB(userPointsDBManager);
    userTable.clearAndAddRows(updatedata);
  }
  // else if (action === "update") {
  //   const updatedata = await getAllDataFromDB(userPointsDBManager);
  //   PointsTable.clearAndAddRows(updatedata);
  // }
});

const getdataIndexdbInstance = new getdataIndexdb();

let websocket = null;
const uniqueidform = document.getElementById("uniqueidform")
uniqueidform.addEventListener("submit", function(event) {
  event.preventDefault();
  const formData = getformdatabyid(uniqueidform);
  // Recorrer todos los pares clave-valor y mostrarlos en la consola

  const uniqueid = formData.tiktok_name;
  localStorage.setItem("UniqueId", uniqueid);
  if (uniqueid) {
    console.log(uniqueid);
    connect(uniqueid);
    UniqueIdname = uniqueid;
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
  let evenType = parsedData.event;
  let data = parsedData.data;
  handleevents(evenType, data);
}
class UserManagementSystem {
  constructor(id) {
    this.id = id;
    this.users = new Map();
    this.userCount = 0;
    this.recentUsers = [];
  }

  addUser(userId, userData) {
    if (!this.users.has(userId)) {
      this.users.set(userId, userData);
      this.userCount++;
      this.recentUsers.unshift(userId);
      if (this.recentUsers.length > 10) {  // Mantener solo los 10 más recientes
        this.recentUsers.pop();
      }
      return true;
    }
    return false;  // Usuario ya existe
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  removeUser(userId) {
    if (this.users.delete(userId)) {
      this.userCount--;
      this.recentUsers = this.recentUsers.filter(id => id !== userId);
      return true;
    }
    return false;
  }

  getUserCount() {
    return this.userCount;
  }

  getRecentUsers(count = 5) {
    return this.recentUsers.slice(0, count);
  }
  clearAllUsers() {
    this.users.clear();
    this.userCount = 0;
    this.recentUsers = [];
    return true;
  }
}

// Uso del sistema
const followedUsers = new UserManagementSystem('followedUsers');
setInterval(() => {
  // const userId = `user_${Math.floor(Math.random() * 1000)}`;
  // const added = followedUsers.addUser(userId, { name: `User ${userId}` });

  // console.log(`Intento de añadir ${userId}: ${added ? 'Éxito' : 'Ya existe'}`);
  // console.log(`Número total de usuarios: ${followedUsers.getUserCount()}`);
  // console.log(`Usuarios recientes: ${followedUsers.getRecentUsers().join(', ')}`);
  followedUsers.clearAllUsers();
}, 600 * 1000);
async function handleevents(evenType, data, additionalData) {
    let userpoints;
    let alldatadb = [];
    if (data && data.uniqueId) {
      userpoints = {
        uniqueId: data.uniqueId,
        nickname: data.nickname,
        uniqueId: data.uniqueId,
        name: data.uniqueId,
        points: TypeofData.toNumber(await getdataIndexdbInstance.getdataIndexdb(data, 'points')) || 0,
        imageUrl: data.profilePictureUrl,
        userId: TypeofData.toNumber(data.userId),
        id: TypeofData.toNumber(data.userId),
    }
    }
  const evaldata = evalBadge(data);
  if (evaldata) {
    console.log("evaldata", evaldata);
  } else {
  }
  evalsystempoints(evenType,data);

  switch (evenType) {
    case "chat":
        handlechat(data);
        if (!evalBadge(data)) {
          console.log("evalBadge",false, data)
          return;
        }

        if (evalmessagecontainsfilter(data.comment)) {
            console.log("evalmessagecontainsfilter",evalmessagecontainsfilter(data.comment), data)
            userpoints.points -= 10;
            userPointsDBManager.saveOrUpdateDataByName(userpoints);
            return;
        }
        if (userpoints.points  <= -1) return userpoints.points = -1;
        handleleermensaje(data.comment);
        alldatadb = await getalldatafromAccionEventsDBManager();
        AccionEventoOverlayEval(evenType,alldatadb,data);
        break;
    case "share":
      alldatadb = await getalldatafromAccionEventsDBManager();
      AccionEventoOverlayEval(evenType,alldatadb,data);
        handleshare(data);
        break;
    case "social":
        handlesocial(data);
        break;
    case "member":
      alldatadb = await getalldatafromAccionEventsDBManager();
        handlemember(data);
        AccionEventoOverlayEval(evenType,alldatadb,data);
        break
    case "likes":
    case "like":
      alldatadb = await getalldatafromAccionEventsDBManager();
      AccionEventoOverlayEval(evenType,alldatadb,data);
      console.log("likes",evenType, data);
        handlelike(data);
        break;
    case "follow":
        handlefollow(data);
        if (!followedUsers.addUser(data.uniqueId, { name: `${data.uniqueId}` })) return;
        alldatadb = await getalldatafromAccionEventsDBManager();
        AccionEventoOverlayEval(evenType,alldatadb,data);
        break;
    case "gift":
      alldatadb = await getalldatafromAccionEventsDBManager();
      AccionEventoOverlayEval(evenType,alldatadb,data);
        handlegift(data);
        break;
    case "suscribe":
      alldatadb = await getalldatafromAccionEventsDBManager();
      console.log("suscribe", data);
      AccionEventoOverlayEval(evenType,alldatadb,data);
      break;
    case "connected":
        onConnected(data, additionalData);
        break;
    case "roominfo":
        onRoominfo(data, additionalData);
        break;
    case "streamEnd":
        onStreamEnded(data, additionalData);
        console.log("streamEnd");
        break;
    case "disconnected":
        console.log("disconnected");
        break;
    default:
        sendToServer(evenType, data);
        break;
}
}

async function evalsystempoints(evenType, data) {
  if (!data || !data.uniqueId) return;
  const getpoinifexists = TypeofData.toNumber(await getdataIndexdbInstance.getdataIndexdb(data, 'points')) || 0;
  let userpoints = {
    uniqueId: data.uniqueId,
    nickname: data.nickname,
    uniqueId: data.uniqueId,
    name: data.uniqueId,
    points: getpoinifexists || 0,
    imageUrl: data.profilePictureUrl,
    userId: TypeofData.toNumber(data.userId),
    id: TypeofData.toNumber(data.userId),
  };
  const form = document.getElementById('pointsForm');
  const config = getformdatabyid(form);
  localStorage.setItem(evenType, JSON.stringify(data));
  const eventPointscheck = {
    follow: config.Pointsperfollow.check,
    share: config.Pointspershare.check,
    gift: config.Pointspercoin.check,
    chat: config.Pointsperchat.check,
    like: config.Pointsperlike.check,
  }
  const ponistvalue = {
    follow: TypeofData.toNumber(config.Pointsperfollow.value) || 2,
    share: TypeofData.toNumber(config.Pointspershare.value) || 2,
    gift: TypeofData.toNumber(config.Pointspercoin.value )|| 2,
    chat: TypeofData.toNumber(config.Pointsperchat.value )|| 2,
    like: TypeofData.toNumber(config.Pointsperlike.value )|| 2,
  };

  if (eventPointscheck[evenType]) {
    switch (evenType) {
      case "chat":
        userpoints.points = getpoinifexists + (TypeofData.toNumber(config.Pointsperchat.value) || 1);
        console.log("chat", userpoints.points);
        break;
      case "share":
        userpoints.points = getpoinifexists + (TypeofData.toNumber(config.Pointspershare.value) || 1);
        console.log("share", userpoints.points);
        break;
      case "gift":
        const numbergiftcoins = TypeofData.toNumber(data.diamondCount) || 2;
        userpoints.points = getpoinifexists + (TypeofData.toNumber(config.Pointspercoin.value) || 2) * numbergiftcoins;
        console.log("gift", userpoints.points);
        break;
      case "follow":
        userpoints.points = getpoinifexists + (TypeofData.toNumber(config.Pointsperfollow.value) || 1);
        console.log("follow", userpoints.points);
        break;
      case "like":
        userpoints.points = getpoinifexists + (TypeofData.toNumber(config.Pointsperlike.value) || 1);
        console.log("like", userpoints.points);
        break;
      default:
        userpoints.points = 0;
        break;
    }
  }

  if (userpoints.points  === 0) return userpoints;
  userPointsDBManager.saveOrUpdateDataByName(userpoints);
  console.log("Puntos asignados:",evenType, userpoints);
  return userpoints;
}

function handlechat(data) {
  const parsedchatdata = {
    content: {
      1: ["url", `http://tiktok.com/@${data.uniqueId}`,"blue",`${data.nickname}`],
      2: ["text", data.comment,"white"],
      // 3: ["text", "!","gold"],
    },
    comment: data.comment,
  }
  const newMessage = new ChatMessage( `msg${counterchat.increment()}`, data.profilePictureUrl, parsedchatdata,[splitfilterwords, addfilterwordcallback],optionTexts);
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
class LikeTracker {
  constructor(resetInterval = 30000) { // Intervalo de reinicio por defecto: 30 segundos
    this.likeCounters = {}; // Almacena los contadores de likes por uniqueId
    this.resetInterval = resetInterval; // Intervalo en milisegundos para reiniciar los contadores

    // Iniciar el temporizador para restablecer los contadores
    this.startResetTimer();
  }

  // Método para manejar likes entrantes y retornar el total acumulado
  addLike(data) {
    const { uniqueId, likeCount } = data;

    if (!this.likeCounters[uniqueId]) {
      // Inicializar el contador en 0 si no existe
      this.likeCounters[uniqueId] = 0;
    }

    // Sumar los nuevos likes al contador existente
    this.likeCounters[uniqueId] += likeCount;

    // Retornar el total acumulado de likes para este usuario
    return this.likeCounters[uniqueId];
  }

  // Método para restablecer los contadores de likes
  resetLikeCounters() {
    Object.keys(this.likeCounters).forEach(uniqueId => {
      this.likeCounters[uniqueId] = 0; // Reinicia el contador para cada usuario
    });
  }

  // Iniciar el temporizador que restablece los contadores periódicamente
  startResetTimer() {
    setInterval(() => {
      this.resetLikeCounters();
      // console.log("Los contadores de likes han sido restablecidos.");
    }, this.resetInterval);
  }
}

// Crear una instancia de LikeTracker con un intervalo de reinicio de 30 segundos
const likeTracker = new LikeTracker(10000);

function handlelike(data) {
  console.log("like", data);

  // Obtener el total acumulado de likes
  const totalLikes = likeTracker.addLike(data);

  const parsedlikedata = {
    content: {
      1: ["url", `http://tiktok.com/@${data.uniqueId}`, "blue", `${data.nickname}`],
      2: ["text", "likes", "gold"],
      3: ["number", totalLikes, "gold"],
    }
  };

  // Crear y añadir el mensaje
  const newMessage = new ChatMessage(`msg${counterlike.increment()}`, data.profilePictureUrl, parsedlikedata);
  newEventsContainer.addMessage(newMessage, true);

  // Mostrar una alerta con la suma acumulada de likes
  showAlert('info', `${data.uniqueId} likes ${totalLikes}`, 2000);
}


function handlefollow(data) {
  console.log("follow", data);
  showAlert('info', `${data.uniqueId} te sige`, 5000);
  const parsedfollowdata = {
    content: {
      1: ["text", data.uniqueId,"white"],
      2: ["text", "te sige","gold"],
    }
  }
  const newMessage = new ChatMessage( `msg${counterfollow.increment()}`, data.profilePictureUrl, parsedfollowdata);
  newEventsContainer.addMessage(newMessage, true);
}
function handlemember(data) {
  console.log("member", data);
  const parsedmemberdata = {
    content: {
      1: ["text", data.uniqueId,"white"],
      2: ["text", "ingreso al live","gold"],
    }
  }
  const newMessage = new ChatMessage( `msg${countermember.increment()}`, data.profilePictureUrl, parsedmemberdata);
  newEventsContainer.addMessage(newMessage, true);
}
function handlegift(data) {
  console.log("gift", data);
  const parsedgiftdata = {
    content: {
      1: ["text", data.uniqueId,"white"],
      2: ["text", "gifted","white"],
      3: ["number", data.diamondCount,"gold"],
      4: ["text", data.giftName,"gold"],
      5: ["image", data.giftPictureUrl],
    }
  }
  const newMessage = new ChatMessage( `msg${countergift.increment()}`, data.profilePictureUrl, parsedgiftdata);
  newGiftContainer.addMessage(newMessage);
  showAlert('info', `${data.uniqueId} gifted ${data.diamondCount}`, 5000);
}
function sendToServer(evenType, data) {
  console.log("sendToServer", evenType, data);
}
function onConnected(data, additionalData = getlastuniqueid()) {
  console.log("onConnected", data, additionalData);
  textReplacer.replaceText("#stateText", `${additionalData} 🟢`, "green");
  showAlert('success', `${additionalData}  ${data.roomId}`, 10000);
}
function onStreamEnded(data, additionalData = getlastuniqueid()) {
  console.log("onStreamEnded", data);
  textReplacer.replaceText("#stateText", `${additionalData}🔴`, "red");
}
function onRoominfo(data, additionalData = getlastuniqueid()) {
  localStorage.setItem("RoomInfo", JSON.stringify(data));
  if (data.cover) {
    imageManipulator.manipulateImage("#uniqueIdImage", data.cover.url_list[0], "src");
  } else if (data.owner) {
    textReplacer.replaceText("#btnConnectTikTok", `Conectado a ${data.owner.nickname}`, "green" );
  }
  console.log("onRoominfo", data.nickname,data);
  showAlert('info', `${data.cover}`, 10000);
  textReplacer.replaceText("#stateText", `${additionalData}🟢`, "green");
}

const events = ['connected', 'chat', 'share', 'social', 'like', 'follow', 'gift', 'streamEnd', 'disconnected', 'emote', 'envelope', 'questionNew', 'subscribe', 'member', 'roomUser'];
events.forEach(event => {
  socketManager.on(event, (data,additionalData) => {
    try {
      handleevents(event, data, additionalData); // Lógica para manejar el evento
    } catch (error) {
      console.error(`Error handling event ${event}:`, error);
    }
  });
});
socketManager.on('rconconnectresponse', (data) => {
  console.log('rconconnectresponse', data);
})
socketManager.on("roominfo", (data) => {
    onRoominfo(data);
  });

setTimeout(async () => {
  await loadFileList();
  console.log("loadFileList");
}, 1000);
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

function evalmessagecontainsfilter(text) {
  if (typeof text !== 'string') return false;
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
  setTimeout(async () => {
    setupDragAndDrop();
    console.log("setupDragAndDrop");
  }, 1000);

export { socketManager }
