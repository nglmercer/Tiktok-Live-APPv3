import { minecraftlive } from './Minecraft/indexdb.js';
// import { replaceVariables } from './functions/replaceVariables.js';
import { fetchSimplifiedState } from './functions/simplifiedState.js';
import { searchSong, playNextInQueue } from './functions/YoutubeApi.js';
import { handleleermensaje } from './renderer.js';
import { eventmanager } from './renderer.js';
import { createCustomCommandComponent, getCustomCommandComponent } from "./utils/Commandshtml.js";
import { saveLastData, getLastData, simulateWithLastData } from './functions/datamanager.js';
import { handleAvailableGifts, getAvailableGifts } from './functions/giftmanager.js';
import { connectWebsocket, connectTikTok } from './connections/connection.js';
import { initializeFilterComponent, addFilterItemToGroup } from './utils/filters.js';
import { obtenerDatos } from './functions/dataHandler.js';
import {ModalModule} from './modal/modal.js';
let backendUrl = "http://localhost:8081"
let timeouttime = 5000;
let viewerCount = 0;
let likeCount = 0;
let diamondsCount = 0;
let connection = new TikTokIOConnection(backendUrl);


// These settings are defined by obs.html
if (!window.settings) window.settings = {};

$(document).ready(() => {
    $('#connectButton').click(connect);
    $('#uniqueIdInput').on('keyup', function (e) {
        if (e.key === 'Enter') {
            connect();
        }
    });

    if (window.settings.username) connect();
    initializeFilterComponent('filter-words', 'addfilter-words', 'containerfilter-words', 'filterWords', 'load-known-filters');
    initializeFilterComponent('filter-users', 'addfilter-users', 'containerfilter-users', 'filterUsers');
    setTimeout(initializeApp, 2000);
});

function initializeApp() {
    connectWebsocket(handleWebsocketMessage);
    // loadVoiceList();
    // loadLastGift();
    const voiceSelect1 = document.getElementById('voiceSelect1');
    fetchSimplifiedState();
    fetchvoicelist().then(data => {
        Object.keys(data).forEach(function(key) {
            var option = document.createElement('option');
            option.text = key;
            option.value = data[key];
            voiceSelect1.appendChild(option);
        });
        console.log("fetchvoicelist", data);
    });
    const simplifiedStateJson = localStorage.getItem('simplifiedState');
    if (simplifiedStateJson) {
        const state = JSON.parse(simplifiedStateJson);
        console.log("Recibe state localstorage", state);
        handleAvailableGifts(state);
    }
}
let uniqueId = null;
function connect() {
    uniqueId = window.settings.username || $('#uniqueIdInput').val();
    if (uniqueId !== '') {
        $('#stateText').text('Connecting...');
        connectTikTok(uniqueId, handleConnectionSuccess, handleConnectionError);
    } else {
        $('#stateText').text('coloque un nombre de usuario');
    }
}
function handleConnectionSuccess(state) {
    console.log(`Connected to roomId ${state.roomId} upgraded ${state.upgradedToWebsocket}`, state);
    console.log(`Available Gifts:`, state.availableGifts);
    handleAvailableGifts(state);
    sendToServer('connected', uniqueId);
    updateUserProfile(state, uniqueId);
    updateRoomStats();
}
function handleConnectionError(errorMessage) {
    console.error("Error in connection:", errorMessage);
    $('#stateText').text(errorMessage);
    setTimeout(connect, timeouttime);
}
function handleWebsocketMessage(event) {
    let parsedData = JSON.parse(event.data);
    let eventype = parsedData.event;
    let data = parsedData.data;
    switch (eventype) {
        case "chat":
            handlechat(data);
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
        default:
            sendToServer(eventype, data);
            minecraftlive(eventype, data);
            break;
    }
}
function updateUserProfile(state, uniqueId) {
    const userProfileLink = generateUsernameLink({ uniqueId });
    if (state.roomInfo.cover) {
        const userProfileImage = `<img src="${state.roomInfo.cover.url_list[1]}" alt="${uniqueId}" width="50" height="50">`;
        const userProfileContainer = `
            <div class="user-profile-container">
                <div class="user-profile-image">${userProfileImage}</div>
                <div class="user-profile-link">${userProfileLink}</div>
            </div>
        `;
        $('#stateText').html(userProfileContainer);
    } else {
        const userProfileContainer = `
            <div class="user-profile-container">
                <div class="user-profile-image">Conectado</div>
                <div class="user-profile-link">${userProfileLink}</div>
            </div>
        `;
        $('#stateText').html(userProfileContainer);
    }
}
var voiceSelect = document.createElement('select');
const jsonVoicelist = './datosjson/voicelist.json';
async function fetchvoicelist() {
    try {
        const response = await fetch(jsonVoicelist);
        if (!response.ok) {
            throw new Error(`Error fetching JSON file: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched JSON voicelist:', data);
        return data;
    }
         catch (error) {
        console.error('Error fetching JSON:', error);
        return null;
    }
}
// Prevent Cross site scripting (XSS)
function sanitize(text) {
    if (text) { // Verifica si la entrada no es undefined
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    } else {
        return ''; // Devuelve una cadena vacía si la entrada es undefined
    }
}

function updateRoomStats() {
    $('#roomStats').html(`<div class="stats stats-vertical lg:stats-vertical shadow">
    <div class="stat">
    <div class="stat-title text-sm">Espectadores</div>
    <div class="stat-value text-sm">${viewerCount}</div>
  </div>
  <div class="stat">
  <div class="stat-title text-sm">Likes</div>
  <div class="stat-value text-sm">${likeCount}</div>
</div>
<div class="stat">
<div class="stat-title text-sm">Diamantes</div>
<div class="stat-value text-sm">${diamondsCount}</div>
</div>`);
    return diamondsCount;
}


function generateUsernameLink(data) {
    return `<a class="usernamelink" href="https://www.tiktok.com/@${data.uniqueId}" target="_blank">${data.uniqueId}</a>`;
}

function isPendingStreak(data) {
    return data.giftType === 1 && !data.repeatEnd;
}

let lastMessage = "";
    // window.signal = () => {}
    // let signalmessage = new Proxy({ value: 0 }, {
    //     set: (target, prop, value) => {
    //         target[prop] = value;
    //         signal(target[prop])
    //         return true;
    //     },
    //     get: (target, prop) => {
    //         return target[prop];
    //     }
    // });
    function sendleertext(text) {
        handleleermensaje(text);
        console.log('sendleertext', text);
        // signalmessage.value = text;
    }
    function evalBadge(data) {
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
    
        console.log("evalBadge values", values);
        console.log(data.uniqueId, "uniqueId evalBadge", values);
    
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
    
    function addEventsItem(eventType, data) {
        let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.eventscontainer');
        
        if (container.find('div').length > 200) {
            container.find('div').slice(0, 100).remove();
        }
    
        const profilePictureUrl = data.profilePictureUrl;
        const colormessage = getEventColor(eventType);
    
        container.append(generateEventHTML(eventType, data.uniqueId, profilePictureUrl, colormessage));
    
        if (eventType === 'welcome') {
            setTimeout(() => {
                container.find('.event.temporal').remove();
            }, 10000);
        }
    
        container.stop();
        container.animate({
            scrollTop: container[0].scrollHeight
        }, 800);
    }
    function generateEventHTML(eventType, uniqueId, profilePictureUrl, colormessage) {
        return `
            <div class="event${eventType === 'welcome' ? ' temporal' : ''}">
                <img class="profile-picture" src="${profilePictureUrl}" alt="Profile Picture">
                <span style="color:${colormessage}">${uniqueId} ${getEventMessage(eventType)}</span>
            </div>
        `;
    }
    
    function getEventMessage(eventType) {
        switch (eventType) {
            case 'welcome':
                return 'ha sido bienvenido!';
            case 'share':
                return 'ha compartido!';
            case 'likes':
                return 'ha dado un me gusta!';
            case 'follow':
                return 'ha seguido!';
            default:
                return `tipo de evento: ${eventType}!`;
        }
    }
    
    function getEventColor(eventType) {
        switch (eventType) {
            case 'welcome':
                return 'white';
            case 'share':
                return 'gold';
            case 'likes':
                return 'blue';
            case 'follow':
                return 'gold';
            default:
                return 'green';
        }
    }
    let counsforskip = 0;
    let customCommandHandler;
    function addFilterWord(word) {
        addFilterItemToGroup('filter-words', 'containerfilter-words', 'filterWords', word);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const customFunctions = {
            mensajes: {
                leerMensaje: handleleermensaje
            },
            musica: {
                songrequest: searchSong,
                nextsong: playNextInQueue
            },
            moderacion: {
                filtrarpalabras: addFilterWord
            }
        };
        // Crear el componente solo si no existe
        if (!customCommandHandler) {
            customCommandHandler = createCustomCommandComponent('customCommandContainer', 'customCommands', customFunctions);
        }
    
        // Configurar el procesador de comandos
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendButton');
        // siempre es chat y el valor es chatInput.value chattext
        if (sendButton) {
            sendButton.onclick = () => {
                const chatText = chatInput.value;
                commandchatsend(chatText);
                chatInput.value = '';
            };
        }

    });
    function commandchatsend(comando) {
        const customCommandComponent = getCustomCommandComponent();
        if (customCommandComponent && customCommandComponent.existCommand(comando)) {
            customCommandComponent.commandChatSend(comando);
            return true;
        } else {
            return false;
        }
    }
function addChatItem(color, data, text, summarize) {
        const wordsfilterwords = JSON.parse(localStorage.getItem('filterWords')) || [];
        const filteruserswhite = JSON.parse(localStorage.getItem('filterUsers')) || [];
        console.log(filteruserswhite,wordsfilterwords);
        localStorage.setItem('lastChatItem', JSON.stringify(data));
    
        const container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.chatcontainer');
        if (container.find('div').length > 500) {
            container.find('div').slice(0, 200).remove();
        }
        let message = data.comment;
        let nameuser = data.uniqueId; 
        const userpointsInput = document.getElementById('users-points');
        const userlevel = document.getElementById('users-level');
        const userlevelCheckbox = document.getElementById('userlevelCheckbox');
        const levelValue = parseInt(userlevel.value);
        const parsedValue = parseInt(userpointsInput.value);
        let userpointsCheckbox = document.getElementById('userpointsCheckbox');
        let messagelenght3 = document.getElementById('messagelenght3');
        let prefixusermessage = document.getElementById('prefixusermessage').value;
        let readUserMessage = document.getElementById('readUserMessage');
        if (!userPoints[data.nickname]) {
            userPoints[data.nickname] = !isNaN(parsedValue) ? parsedValue * 2 : 10;
        }
        if (userlevelCheckbox.checked) {
            userPoints[data.nickname] += levelValue;
            console.log("Añadir puntos por nivel", data.nickname, levelValue, userPoints[data.nickname]);
        }
        container.find('.temporary').remove();
        container.append(`
            <div class=${summarize ? 'temporary' : 'static'}>
                <img class="miniprofilepicture" src="${data.profilePictureUrl}">
                <span>
                    <b>${generateUsernameLink(data)}:</b> 
                    <span style="color:${color}">${sanitize(text)}</span>
                </span>
            </div>
        `);
    
        container.stop().animate({
            scrollTop: container[0].scrollHeight
        }, 400);
        console.log("evalBadge",evalBadge(data))
        // if (filteruserswhite.length > 0) {
        //     for (let user of filteruserswhite) {
        //         if (user && data.uniqueId.includes(user.toLowerCase())) {
        //             sendleertext(message);
        //             console.log(`${data.nickname} filtrado por usuario: ${user}`);
        //             return;
        //         }
        //     }
        // }
        if (typeof message !== 'string') {
            return; // Si no es una cadena, sale de la función
        }
        if (!evalBadge(data)) {
            console.log("evalBadge",false, data)
            return;
        }
        if (evalmessagecontainsfilter(message)) {
            console.log("evalmessagecontainsfilter",evalmessagecontainsfilter(message), data)
            return;
        }
        message.toLowerCase();
        if (message === lastMessage) {
            return;
        }
        if (commandchatsend(message)) {
                return;
        }
        lastMessage = message;
        if (userpointsCheckbox.checked) {
            if (userPoints[data.nickname] <= 0) {
                return;
            }
        }

    if (text.length <= 3 && messagelenght3.checked) {
            return;
    }
    if (readUserMessage.checked) {
        let messagewithuser = nameuser + prefixusermessage + message;
        sendleertext(messagewithuser);
    } else {
        sendleertext(message);
    }
}
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
function isValidUrl(string) {
    try {
        new URL(string);
    } catch (_) {
        return string;
    }

    return true;
}

let userStats = {};

connection.on('like', (data) => {
    handlelike(data);
});
function handlelike(data) {
    localStorage.setItem('lastLike', JSON.stringify(data));
    if (typeof data.totalLikeCount === 'number') {
        likeCount = data.totalLikeCount;
        updateRoomStats();
    }
    // Initialize user's stats
    if (!userStats[data.uniqueId]) {
        userStats[data.uniqueId] = { likes: 0, totalLikes: 0, milestone: 50 };
    }

    // Increment user's like count and total like count
    userStats[data.uniqueId].likes += data.likeCount;
    userStats[data.uniqueId].totalLikes += data.likeCount;
    addEventsItem('likes', data);
    sendToServer('likes', data);
    // console.log("likes", data.likeCount, data);
    // Check if user's like count has reached the milestone
    while (userStats[data.uniqueId].likes >= userStats[data.uniqueId].milestone && userStats[data.uniqueId].milestone <= 500) {
        // Send data or data.uniqueId and $ likes
        minecraftlive('likes', data);
        
        userStats[data.uniqueId].likes -= userStats[data.uniqueId].milestone; // Deduct milestone likes from user's like count
        userStats[data.uniqueId].milestone += 25; // Increase the milestone
        userPoints[data.nickname] + 15;
        userPoints[data.nickname] += 15;
        if (userStats[data.uniqueId].milestone > 300) {
            userStats[data.uniqueId].milestone = 25; // Reset the milestone
        }
    }
}
console.log("lastGiftItem", JSON.parse(localStorage.getItem('lastGiftItem')));
function addGiftItem(data) {
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.giftcontainer');
    if (container.find('div').length > 200) {
        container.find('div').slice(0, 100).remove();
    }

    let streakId = data.userId + '_' + data.giftId;
    let totalDiamonds = data.diamondCount * data.repeatCount;
    let giftIconSize = 150; // Tamaño base del icono del regalo
    if (totalDiamonds > 100) {
        giftIconSize += totalDiamonds; // Aumenta el tamaño del icono del regalo en 1 píxel por cada diamante
    }
    const profilePictureUrl = data.profilePictureUrl;
    const giftPictureUrl = data.giftPictureUrl;

    let html = `
      <div data-streakid=${isPendingStreak(data) ? streakId : ''}>
          <img class="miniprofilepicture" src="${profilePictureUrl}">
          <span>
              <b>${generateUsernameLink(data)}:</b> <span><span style="color: ${data.giftName ? 'purple' : 'black'}">${data.giftName}</span></span></span><br>
              <div>
                  <table>
                      <tr>
                          <td><img class="gifticon" src="${giftPictureUrl}" style="width: ${giftIconSize}px; height: ${giftIconSize}px;"></td>
                          <td>
                              <span><b style="${isPendingStreak(data) ? 'color:red' : ''}">x${data.repeatCount} : ${(data.diamondCount * data.repeatCount)} Diamantes </b><span><br>
                          </td>
                      </tr>
                  </table>
              </div>
          </span>
      </div>
    `;

    let existingStreakItem = container.find(`[data-streakid='${streakId}']`);

    if (existingStreakItem.length) {
        existingStreakItem.replaceWith(html);
    } else {
        container.append(html);
    }
    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);
}

// viewer stats
connection.on('roomUser', (data) => {
    if (typeof data.viewerCount === 'number') {
        viewerCount = data.viewerCount;
        updateRoomStats();
    }
})

// Member join
let joinMsgDelay = 0;
// Member join
connection.on('member', (data) => {
    if (window.settings.showJoins === "0") return;

    let addDelay = 250;
    if (joinMsgDelay > 500) addDelay = 100;
    if (joinMsgDelay > 1000) addDelay = 0;

    joinMsgDelay += addDelay;

    setTimeout(() => {
        joinMsgDelay -= addDelay;
        addEventsItem('welcome', data, 'welcome', true);
        let message = data.uniqueId;
        minecraftlive('welcome', data, message, null, data);
    }, joinMsgDelay);
})
let userPoints = {};

connection.on('chat', (data) => {
    handlechat(data);
});
function handlechat(data) {
    const userpointsInput = document.getElementById('users-points');

    const inputValue = userpointsInput.value;
    const parsedValue = parseInt(inputValue);
    if (!userPoints[data.nickname]) {
        if (!isNaN(parsedValue)) {
            // Si es un número válido, sumarlo al puntaje del usuario
            userPoints[data.nickname] = parsedValue * 2;
        } else {
            // Si no es un número válido, utilizar el valor por defecto de 5
            userPoints[data.nickname] = 10;
        }
        //console.log("puntos asignados",data.nickname,userPoints[data.nickname]);
    }
    let message = data.comment; 
    let nameuser = data.uniqueId; 
    let filterUsersInput = document.getElementById('filter-users').value;
    let lowerCaseUser = nameuser.toLowerCase();
    let filterUsers = filterUsersInput.toLowerCase().split(/\s+/);

    if (filterUsers.includes(lowerCaseUser)) {
        console.log("WhiteList", lowerCaseUser);
        addChatItem('', data, message);
        sendToServer('chat', data);
        minecraftlive('chat', data);
        return;
      }

    if (window.settings.showChats === "0") return;

    addChatItem('', data, message);
    sendToServer('chat', data);
    minecraftlive('chat', data);
    if (message === lastMessage) {
        return;
    }
    chattocommand(data);
    lastMessage = message;
    let tiempoActual = Math.floor(Date.now() / 1000);

    if (tiempoActual - data.ultimoTiempo <= 60) {
        return data.nickname; // Retorna la cantidad actual de puntos sin cambios
    }

    data.ultimoTiempo = tiempoActual;
}
function chattocommand(data) {
    let message = data.comment;
    
}
// socket new gift
connection.on('gift', (data) => {
    handlegift(data);
})

function handlegift(data) {
    console.log("handlegift", data);
    localStorage.setItem('lastGiftItem', JSON.stringify(data));
    if (!userPoints[data.nickname]) {
        userPoints[data.nickname] = 10; // Asignar 10 puntos por defecto
    } else if (userPoints[data.nickname] >= 1) {
        userPoints[data.nickname] += 10;
        userPoints[data.nickname] + 10;
        //console.log('Puntos aumentados:', data.nickname, userPoints[data.nickname]);
    }
    minecraftlive('gift', data);

    if (!isPendingStreak(data) && data.diamondCount > 0) {
        diamondsCount += (data.diamondCount * data.repeatCount);
        let readGiftEvent = document.getElementById('readGiftEvent');
        let prefixGiftEvent = document.getElementById('prefixGiftEvent').value; 
        if (readGiftEvent.checked && data.giftName) {
            let readGiftText = `${data.uniqueId} ${prefixGiftEvent} ${data.repeatCount} ${data.giftName}`
            sendleertext(readGiftText);
    }
        console.log('isPendingStreak', data.uniqueId + prefixGiftEvent + data.giftName,"data repeatcount si terminoooooo",true,data.repeatCount);
        userPoints[data.nickname] + data.diamondCount;
        updateRoomStats();
    }
    sendToServer('gift', data);

    if (window.settings.showGifts === "0") return;
    addGiftItem(data);
}

// share, follow
let seguidores = new Set();

connection.on('social', (data) => {
    handlesocial(data);
});
function handlesocial(data) {
    console.log("social", data);
    if (window.settings.showFollows === "0") return;
    let lastfollow = localStorage.setItem('lastfollow', JSON.stringify(data));
    console.log("follow", data);
    if (data.displayType.includes('follow')) {
        handlefollow(data);

    } else if (data.displayType.includes('share')) {
        handleshare(data);
    }
    sendToServer('social', data);
}
function handlefollow(data) {
    let prefixuserfollow = document.getElementById('prefixuserfollow').value || "te sige";
    let color = '#CDA434'; // Cambia esto al color que quieras para los seguidores
    let message = `${data.nickname} ${prefixuserfollow}`;
    minecraftlive('follow', data);
    sendToServer('follow', data);
    if (!seguidores.has(data.nickname)) {
        console.log('followsocial', `${data.nickname} ${prefixuserfollow}`);
        seguidores.add(data.nickname);
        // Establecer un temporizador para eliminar data.uniqueId de seguidores después de 5 minutos
        setTimeout(() => {
            seguidores.delete(data.nickname);
        }, 60000); // 5 minutos
    }
    addEventsItem("follow", data);
}
function handleshare(data) {
    let color = '#CDA434'; // Color por defecto
    let message = `${data.nickname} compartió el directo`;
    minecraftlive('share', data);
    sendToServer('share', data);
    addEventsItem("share", data);
}
connection.on('streamEnd', () => {
    $('#stateText').text('Transmisión terminada.');
    // schedule next try if obs username set
    if (window.settings.username) {
        setTimeout(() => {
            connect(window.settings.username);
        }, 30000);
    }
    let message = 'Transmisión terminada.';

    // Send data to server
    sendToServer('streamEnd', message);
})

connection.on('questionNew', data => {
    // Crear modal
});
/*
connection.on('linkMicBattle', (data) => {
console.log(`New Battle: ${data.battleUsers[0].uniqueId} VS ${data.battleUsers[1].uniqueId}`,data);
/*user1.querySelector('.username').textContent = data.battleUsers[0].uniqueId;
user2.querySelector('.username').textContent = data.battleUsers[1].uniqueId;
battleStatus.textContent = 'Battle in Progress'
});

connection.on('linkMicArmies', (data) => {
console.log('linkMicArmies', data);
user1.querySelector('.points').textContent = data.battleArmies[0].points;
user2.querySelector('.points').textContent = data.battleArmies[1].points;
if (data.battleStatus === 1) {
    battleStatus.textContent = 'Battle in Progress';
} else if (data.battleStatus === 2) {
    battleStatus.textContent = 'Battle Ended';
}
});*/

  
connection.on('liveIntro', (msg) => {
    console.log('User Details:', msg.description);
    console.log('Nickname:', msg.nickname);
    console.log('Unique ID:', msg.uniqueId);
    console.log(msg)
});
connection.on('Disconnected', (msg) => {
    connect();
});
connection.on('emote', (data) => {
    console.log(`${data.uniqueId} emote!`);
    console.log('emote received', data);
    addChatItem('blue', data, data.comment);
})
connection.on('envelope', data => {
    console.log('Unique ID:', data.uniqueId);
    console.log('Coins:', data.coins);
    addEventsItem('envelope',data)
    sendleertext(`${data.uniqueId} envio cofre de ${data.coins} monedas para ${data.canOpen} personas`);
    console.log('envelope:', data);
});

connection.on('subscribe', (data) => {
    console.log(`${data.uniqueId} subscribe!`);
    addEventsItem('subscribe', data);
})
let lastComment = '';

window.señal = ()=>{}
let elemento = new Proxy({ value: 0, data: {} }, {
    set: (target, propiedad, value) => {
        target[propiedad] = value;
        window.señal(target[propiedad])
        return true;
    },
    get: (target, prop) => {
        return target[prop];
    }
});

async function sendReplacedCommand(replacedCommand) {
    window.api.sendChatMessage(replacedCommand);
    console.log("sendreplacedcommand",replacedCommand); 
        document.getElementById('lastcomandsended').innerHTML = replacedCommand;
        await wsManager.sendCommand(replacedCommand);
        console.log(replacedCommand);
    }
    
function showModal(title, content) {
    const modal = document.getElementById('my_modal_2');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    modalTitle.innerText = title;
    modalContent.innerText = content;

    modal.showModal();
}
document.cookie = "x-servertap-key=change_me"; // Cambia esto por tu clave de autenticación si es necesario
// let ws;
// let reconnectInterval = 5000; // Intervalo de reconexión en milisegundos
// let reconnectAttempts = 0;
// let maxReconnectAttempts = 10;
class WebSocketManager {
    constructor(maxReconnectAttempts = 10, reconnectInterval = 5000) {
        this.maxReconnectAttempts = maxReconnectAttempts;
        this.reconnectInterval = reconnectInterval;
        this.reconnectAttempts = 0;
        this.ws = null;
    }

    connect(wsurl) {
        this.ws = new WebSocket(wsurl);

        this.ws.onopen = () => {
            console.log('Opened connection');
            document.getElementById('output').innerText = 'Opened connection';
            this.ws.send(`/say conectado `);
            this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        };

        this.ws.onmessage = (event) => {
            console.log('Message from server:', event.data);
            // document.getElementById('output').innerText += '\n' + event.data.replace(/\n/g, '<br>');
        };

        this.ws.onerror = (error) => {
            console.log('WebSocket Error:', error);
            document.getElementById('output').innerText += '\nWebSocket Error: ' + error.message;
        };

        this.ws.onclose = () => {
            console.log('Closed connection');
            document.getElementById('output').innerText += '\nClosed connection';

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                document.getElementById('output').innerText += `\nAttempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`;
                setTimeout(() => this.connect(), this.reconnectInterval);
            } else {
                console.log('Max reconnect attempts reached. Giving up.');
                document.getElementById('output').innerText += '\nMax reconnect attempts reached. Giving up.';
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
        document.getElementById('lastcomandsended').innerText = command;
    }

    async waitForConnection() {
        while (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}
// function wsconsole() {

//     function connect() {
//         ws = new WebSocket('ws://localhost:4567/v1/ws/console');

//         ws.onopen = function() {
//             console.log('Opened connection');
//             document.getElementById('output').innerText = 'Opened connection';
//             ws.send(`/say ${reconnectAttempts}/${maxReconnectAttempts} intentos de reconexión`);
//             reconnectAttempts = 0; // Resetear los intentos de reconexión al conectar con éxito
//         };

//         ws.onmessage = function(event) {
//             console.log('Message from server:', event.data);
//             // document.getElementById('output').innerText += '\n' + event.data.replaceAll('\n', '<br>');
//         };

//         ws.onerror = function(error) {
//             console.log('WebSocket Error:', error);
//             document.getElementById('output').innerText += '\nWebSocket Error: ' + error.message;
//         };

//         ws.onclose = function() {
//             console.log('Closed connection');
//             document.getElementById('output').innerText += '\nClosed connection';

//             if (reconnectAttempts < maxReconnectAttempts) {
//                 reconnectAttempts++;
//                 console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`);
//                 document.getElementById('output').innerText += `\nAttempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`;
//                 setTimeout(connect, reconnectInterval);
//             } else {
//                 console.log('Max reconnect attempts reached. Giving up.');
//                 document.getElementById('output').innerText += '\nMax reconnect attempts reached. Giving up.';
//             }
//         };
//     }
//     setTimeout(connect, 500);
// }
const wsManager = new WebSocketManager('ws://localhost:4567/v1/ws/console');
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('testConnection').addEventListener('click', function(event) {
        event.preventDefault(); // Evita el comportamiento predeterminado del botón
    
        const ip = document.getElementById('ip').value;
        const port = document.getElementById('port').value;
        const password = document.getElementById('password').value;
    
        const formData = {
            ip: ip,
            port: port,
            password: password
        };
    
        console.log('Form Data:', formData);
        fetch(`http://${ip}:${port}/v1/server`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'key': `${password}` // Cambia esto por tu clave de autenticación si es necesario
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Server status:', data);
            showModal('Server Status', JSON.stringify(data, null, 2)); // Usar showModal para mostrar los datos
            wsManager.connect(`ws://${ip}:${port}/v1/ws/console`);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
            showModal('Error', 'Error: ' + error.message); // Usar showModal para mostrar el error
        });
    });
    document.getElementById('Rconconnect').addEventListener('click', async function(event) {
        event.preventDefault(); // Evita el comportamiento predeterminado del botón
        const Rconip = document.getElementById('Rconip').value;
        const Rconport = document.getElementById('Rconport').value;
        const Rconpassword = document.getElementById('Rconpassword').value;
        const keyLOGIN = document.getElementById('InitcommandInput').value.trim();
        const resultMessage = document.getElementById('resultMessage');

        console.log('Rconconnect', Rconip, Rconport, Rconpassword);
        const options = { ip: Rconip, password: Rconpassword, port: Rconport };
        const result = await window.api.createRconClient(options, keyLOGIN);
        if (result.success) {
          console.log('Bot created successfully');
          resultMessage.textContent = 'Bot creado y conectado';
          resultMessage.style.color = 'green';
        } else {
          console.error('Failed to create bot');
          resultMessage.textContent = 'Error al crear el bot';
          resultMessage.style.color = 'red';
        }
    });
    document.getElementById('createBotForm').addEventListener('submit', async (event) => {
        event.preventDefault();
      
        const keyBOT = document.getElementById('keyBOT').value.trim();
        const keySERVER = document.getElementById('keySERVER').value.trim();
        const [serverip, serverport = 25565] = keySERVER.split(':');
        const keyLOGIN = document.getElementById('InitcommandInput').value.trim();
        const resultMessage = document.getElementById('resultMessage');
        const options = {
          host: serverip,
          port: parseInt(serverport, 10),
          username: keyBOT,
        };
        console.log("createbot", options, keyLOGIN);

        const result = await window.api.createBot(options, keyLOGIN);
        if (result.success) {
          console.log('Bot created successfully');
          window.api.onBotEvent((event, type, data) => {
            if (type === 'login') {
              console.log('Bot logged in');
              if (!keyLOGIN.startsWith('/')) {
                window.api.sendChatMessage(keyLOGIN).then(response => {
                  if (response.success) {
                    console.log('Login command sent successfully');
                  } else {
                    console.error('Failed to send login command:', response.error);
                  }
                });
              }
            } else if (type === 'chat') {
              console.log(`${data.username}: ${data.message}`);
              if (data.message === 'hello') {
                window.api.sendChatMessage('Hello there!');
              }
            }
          });
          resultMessage.textContent = 'Bot creado y conectado';
          resultMessage.style.color = 'green';
        } else {
          console.error('Failed to create bot');
          resultMessage.textContent = 'Error al crear el bot';
          resultMessage.style.color = 'red';
        }
      });
    document.getElementById('clientconnect').addEventListener('click', async function(event) {
        event.preventDefault(); // Evita el comportamiento predeterminado del botón
        const clientipport = document.getElementById('clientipport').value;
        const serveripport = document.getElementById('serveripport').value;
        const keyLOGIN = document.getElementById('InitcommandInput').value.trim();
        const clientbotstatus = document.getElementById('clientbotstatus');
        const optionsclient = {
          host: clientipport.split(':')[0],
          port: parseInt(clientipport.split(':')[1], 10),
        };
        const optionsserver = {
          host: serveripport.split(':')[0],
          port: parseInt(serveripport.split(':')[1], 10),
        };
        console.log("createclientbot", optionsclient, optionsserver);
        const result = await window.api.createClientOsc(optionsclient);
        const result2 = await window.api.createServerOsc(optionsserver);
        window.api.sendOscMessage("hola");
        if (result.success && result2.success) {
          console.log('Bot created successfully');
          clientbotstatus.textContent = 'Bot creado y conectado';
          clientbotstatus.style.color = 'green';
        } else {
          console.error('Failed to create bot');
          clientbotstatus.textContent = 'Error al crear el bot';
          clientbotstatus.style.color = 'red';
        }
    });
    setTimeout(getBotStatus, 1000);
})    
async function getBotStatus() {
    const botStatus = document.getElementById('botStatus');

    try {
        const response = await window.api.botStatus();
        console.log('botStatus || Bot-status:', response);
        if (response.success) {
            botStatus.innerText = 'Bot online🟢';
            return response.success;
        } else {
            botStatus.innerText = 'Bot offline🟥';
            return response.error;
        }
    } catch (error) {
        console.error('Error fetching bot status:', error);
        botStatus.innerText = 'Error fetching bot status';
        return false;
    }
}
async function sendToServer(eventType, data) {
    lastComment = data.comment; 
    let objet = {eventType, data};
    eventmanager(eventType, data);
    /// aqui enviamos a eventos eventmanager
    elemento.value = objet;
}

window.onload = async function() {
    loadRowsOnPageLoad(tableBody);
};
export { sendReplacedCommand, connection };