import { minecraftlive, Minecraftlivedefault } from './indexdb.js';
// import { replaceVariables } from './functions/replaceVariables.js';
import { fetchSimplifiedState } from './functions/simplifiedState.js';
import { searchSong, playNextInQueue } from './functions/YoutubeApi.js';
import { eventmanager } from './renderer.js';
let backendUrl = "http://localhost:8081"
let websocket = null;
let timeouttime = 3000;
let maxAttempts = 5;
let Attemptsconnection = 0;
function connectwebsocket() {
    if (websocket) return; // Already connected
    if (Attemptsconnection >= Attemptsconnection) return; 
    websocket = new WebSocket("ws://localhost:21213/");
    Attemptsconnection++;
    websocket.onopen = function () {
        document.getElementById("stateText").innerHTML = "Connected tikfinity";
        Attemptsconnection = 0;
    }
 
    websocket.onclose = function () {
        document.getElementById("stateText").innerHTML = "Disconnected";
        websocket = null;
        // setTimeout(connectwebsocket, 4000); // Schedule a reconnect attempt
    }

    websocket.onerror = function () {
        document.getElementById("stateText").innerHTML = "Connection Failed";
        websocket = null;
        setTimeout(connectwebsocket, 4000); // Schedule a reconnect attempt
    }

    websocket.onmessage = function (event) {
        let parsedData = JSON.parse(event.data); // Parse the JSON data
        let eventype = parsedData.event;
        let data = parsedData.data;
        switch (eventype) {
            case "chat":
                handlechat(data);
                break;
            case "share":
                console.log("share", data);
                break;
            case "likes":
                handlelike(data);
                break;
            case "like":
                handlelike(data);
                console.log("like", data);
                break;
            case "follow":
                console.log("follow", data);
                break;
            case "gift":
                handlegift('gift', data);
                console.log("gift", data);
                break;
            default:
                sendToServer(eventype, data);
                minecraftlive(eventype, data);
                console.log("default", data);
                break;
        }
    }
}
setTimeout(connectwebsocket, 3000);
// Crea la conexión al servidor Socket.IO con la URL obtenida
let connection = new TikTokIOConnection(backendUrl);

let viewerCount = 0;
let likeCount = 0;
let diamondsCount = 0;

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
})


function connect() {
    if (Attemptsconnection >= Attemptsconnection) return; 
    let uniqueId = window.settings.username || $('#uniqueIdInput').val();
    if (uniqueId !== '') {
        $('#stateText').text('Connecting...');
        Attemptsconnection++;
connection.connect(uniqueId, {
            processInitialData: true,
            enableExtendedGiftInfo: true,
            enableWebsocketUpgrade: true,
            requestPollingIntervalMs: 2000,
        }).then(state => {
            Attemptsconnection = 0;
            console.log(`Connected to roomId ${state.roomId} upgraded ${state.upgradedToWebsocket}`, state);
            console.log(`Available Gifts:`, state.availableGifts);
        // Función para cargar los datos desde el localStorage
            availableGiftsimage(state);
        // Enviar al servidor la información de la conexión establecida
            sendToServer('connected', uniqueId);
        // Restablecer estadísticas
            viewerCount = 0;
            likeCount = 0;
            diamondsCount = 0;
            updateRoomStats();
        // Generar enlace de perfil de usuario
            const userProfileLink = generateUsernameLink({ uniqueId });
        // Si hay una imagen de portada de la sala, mostrarla junto con el enlace del perfil de usuario
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
        }).catch(errorMessage => {
            // Manejar el error en caso de que falle la conexión
            console.error("Error in connection:", errorMessage);
            // Mostrar el  error en la interfaz de usuario
            $('#stateText').text(errorMessage);
            setTimeout(() => {
                connect();
                connectwebsocket(); // Schedule a reconnect attempt
            }, timeouttime);
        });
    } else {
        // Mostrar una alerta si no se proporciona un nombre de usuario
        alert('No username entered');
    }
}
var voiceSelect = document.createElement('select');

const jsonFilePath = './datosjson/simplifiedStates.json';
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

setTimeout(async () => {
    fetchvoicelist().then(data => {

        Object.keys(data).forEach(function(key) {
            var option = document.createElement('option');
            option.text = key;
            option.value = data[key];
            voiceSelect.appendChild(option);
            // console.log(key, data[key]);
        });
    });
    // fetchFilterWords()
}, 1000);

fetchSimplifiedState().then(data => {
    if (data) {
        // Usa los datos como desees
        console.log('Fetched simplified state:', data);
        globalSimplifiedStates.push(data);
    }
});

let globalSimplifiedStates = [];
window.globalSimplifiedStates = globalSimplifiedStates;

function availableGiftsimage(state) {
    const giftImages = {};
    if (!state || !state.availableGifts) {
        const savedStateJson = localStorage.getItem('simplifiedState');
        const savedState = JSON.parse(savedStateJson);
        if (savedState && savedState.availableGifts) {
            state = savedState;
        }
    }
    
    const container = document.getElementById('giftContainer');
    container.innerHTML = '';
    state.availableGifts.sort((a, b) => a.diamond_count - b.diamond_count);

    state.availableGifts.map(gift => {
        const giftName = gift.name;
        const imageUrl = gift.image.url_list[1];
        giftImages[giftName] = imageUrl;

        const giftBox = document.createElement('div');
        giftBox.classList.add('gift-box');

        const giftImage = document.createElement('img');
        giftImage.src = imageUrl;
        giftImage.alt = giftName;
        giftBox.appendChild(giftImage);

        const giftNameText = document.createElement('p');
        const foundGift = state.availableGifts.find(gift => gift.name.toLowerCase() === giftName.toLowerCase());
        if (foundGift) {
            giftNameText.textContent = `${foundGift.name} ${foundGift.diamond_count}🌟`;
        }
        giftBox.appendChild(giftNameText);

        container.appendChild(giftBox);
    });

    const simplifiedState = {
        availableGifts: state.availableGifts.map(gift => ({
            name: gift.name,
            diamondcost: gift.diamond_count,
            giftId: gift.id,
            imageUrl: gift.image.url_list[1]
        }))
    };

    globalSimplifiedStates.push(simplifiedState);

    const simplifiedStateJson = JSON.stringify(state);
    localStorage.setItem('simplifiedState', simplifiedStateJson);

    // Añadir el botón de descarga si no existe
    addDownloadButton();

    return giftImages;
}

function addDownloadButton() {
    const buttonContainer = document.getElementById('downloadButtonContainer');
    buttonContainer.innerHTML = '';

    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Descargar JSON';
    downloadButton.className = "custombutton";
    downloadButton.onclick = downloadJson;

    buttonContainer.appendChild(downloadButton);
}

function downloadJson() {
    const dataStr = JSON.stringify(globalSimplifiedStates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'simplifiedStates.json';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// Cargar los datos del localStorage al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    const simplifiedStateJson = localStorage.getItem('simplifiedState');
    if (simplifiedStateJson) {
        const state = JSON.parse(simplifiedStateJson);
        console.log("Recibe state localstorage", state);
        availableGiftsimage(state);
    }
});



// Prevent Cross site scripting (XSS)
function sanitize(text) {
    if (text) { // Verifica si la entrada no es undefined
        return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    } else {
        return ''; // Devuelve una cadena vacía si la entrada es undefined
    }
}

function updateRoomStats() {
    $('#roomStats').html(`<div class="stats stats-vertical lg:stats-horizontal shadow">
    <div class="stat">
    <div class="stat-title text-sm">Espectadores</div>
    <div class="stat-value text-sm">${viewerCount.toLocaleString()}</div>
  </div>
  <div class="stat">
  <div class="stat-title text-sm">Likes</div>
  <div class="stat-value text-sm">${likeCount.toLocaleString()}</div>
</div>
<div class="stat">
<div class="stat-title text-sm">Diamantes</div>
<div class="stat-value text-sm">${diamondsCount.toLocaleString()}</div>
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
let lastNickname = "";
setTimeout(()=>{
    if (localStorage.getItem('lastChatItem')) {
        const datachatitem = JSON.parse(localStorage.getItem('lastChatItem'));
        const message = datachatitem.comment;
        const userData = {
            uniqueId: "12345",
            allUsers: false,
            followRole: 0,
            isModerator: false,
            isNewGifter: false,
            isSubscriber: false,
            teamMemberLevel: 2,
            topGifterRank: 3,
        };
if (localStorage.getItem('lastLike')) {
    

}
    console.log(evalBadge(userData));
// console.log(evalBadge(userData));
addChatItem('blue', datachatitem, message);
    }
},3000);
    console.log(JSON.parse(localStorage.getItem('lastChatItem')));
    window.signal = () => {}
    let signalmessage = new Proxy({ value: 0 }, {
        set: (target, prop, value) => {
            target[prop] = value;
            signal(target[prop])
            return true;
        },
        get: (target, prop) => {
            return target[prop];
        }
    });
    function sendleertext(text) {
        signalmessage.value = text;
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
    
        console.log("values", values);
        console.log(data.uniqueId, "data uniqueId evalBadge", values);
    
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
    function returnbadge(badge,valor,data) {
        Object.entries(data).forEach(([key, value]) => {
            if (key === badge) {
                valor = value;
            } else {
                valor = false;
            }
        });
        return valor;
    };
    
    function addEventsItem(eventType, data) {
        let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.eventscontainer');
        
        if (container.find('div').length > 200) {
            container.find('div').slice(0, 100).remove();
        }
    
        const profilePictureUrl = isValidUrl(data.profilePictureUrl) ? data.profilePictureUrl : 'url_de_imagen_por_defecto';
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
function addChatItem(color, data, text, summarize) {
        const wordsfilterwords = JSON.parse(localStorage.getItem('filterWords')) || [];
        const filteruserswhite = JSON.parse(localStorage.getItem('filterUsers')) || [];
        console.log(filteruserswhite,wordsfilterwords);
        let lowerCaseText = data.comment?.toLowerCase().replace(/[^a-zA-Z0-9áéíóúüÜñÑ.,;:!?¡¿'"(){}[\]\s]/g, '');
        lowerCaseText = lowerCaseText.toString().replaceAll('“', '"').replaceAll('”', '"');
        localStorage.setItem('lastChatItem', JSON.stringify(data));
    
        const container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.chatcontainer');
        if (container.find('div').length > 500) {
            container.find('div').slice(0, 200).remove();
        }

        let message = data.comment.toString().toLowerCase();
        const nickname = data.nickname;
        let nameuser = data.uniqueId; 
        const userpointsInput = document.getElementById('users-points');
        const userlevel = document.getElementById('users-level');
        const userlevelCheckbox = document.getElementById('userlevelCheckbox');
        const levelValue = parseInt(userlevel.value);
        const parsedValue = parseInt(userpointsInput.value);
        let sendDataCheckbox = document.getElementById('sendDataCheckbox');
        let userpointsCheckbox = document.getElementById('userpointsCheckbox');
        let messagelenght3 = document.getElementById('messagelenght3');
        let sendsoundCheckbox = document.getElementById('sendsoundCheckbox');
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
    

        if (filteruserswhite.length > 0) {
            for (let user of filteruserswhite) {
                if (user && data.uniqueId.includes(user.toLowerCase())) {
                    sendleertext(message);
                    console.log(`${data.nickname} filtrado por usuario: ${user}`);
                    return;
                }
            }
        }
        if (evalBadge(data) === false) {
            return;
        }
        if (wordsfilterwords.length > 0) {
            for (let word of wordsfilterwords) {
                if (word && lowerCaseText.includes(word.toLowerCase())) {
                    console.log(`${data.nickname} filtrado por palabra: ${lowerCaseText}`);
                    return;
                }
            }
        }
        let votesforskip = Number(viewerCount) / 10;
        message.toLowerCase();
        if (message.startsWith("!play") || message.startsWith("/play") || message.startsWith("play")) {
            const query = message.replace("!play", "").replace("/play", "").replace("play", "");
            console.log("query", query);
            searchSong(query);
            if (votesforskip > votesforskip) {
                console.log("skip");
                playNextInQueue();
            }
            return;
        }
        if (message.startsWith("!skip") || message.startsWith("/skip") || message.startsWith("skip")) {
            counsforskip++;
            if (votesforskip > votesforskip) {
                console.log("skip");
                playNextInQueue();
            }
            return;
        }
        if (message === lastMessage) {
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
    console.log(data)
    if (sendDataCheckbox.checked) {
            if (userPoints[data.nickname] <= 4) {
                console.log('Usuario con 0 puntos, mensaje omitido:', data.nickname, userPoints[data.nickname]);
            }
    }


    if (color === "#CDA434"){
        console.log('followchatdata', `${message}`);
        sendleertext(message);
        return;
    }
    
    if (readUserMessage.checked) {
        let messagewithuser = nameuser + prefixusermessage + message;
        sendleertext(messagewithuser);
    } else {
        sendleertext(message);
    }
    if (nickname !== lastNickname) {
        if (!isNaN(parsedValue)) {
            // Si es un número válido, sumarlo al puntaje del usuario
            userPoints[data.nickname] += parsedValue;
          } else {
            // Si no es un número válido, utilizar el valor por defecto de 5
            userPoints[data.nickname] += 2;
          }
        console.log('nicknamePoints', `el usuario ${data.nickname}tiene mas puntos`,userPoints[data.nickname]);
    }
    if (sendsoundCheckbox.checked) {
        if (nickname !== lastNickname) {
    }
        userPoints[data.nickname]--;
        lastNickname = nickname
    }

}

function isValidUrl(string) {
    try {
        new URL(string);
    } catch (_) {
        return false;
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
        Minecraftlivedefault('likes', data);
        
        userStats[data.uniqueId].likes -= userStats[data.uniqueId].milestone; // Deduct milestone likes from user's like count
        userStats[data.uniqueId].milestone += 25; // Increase the milestone
        userPoints[data.nickname] + 15;
        userPoints[data.nickname] += 15;
        if (userStats[data.uniqueId].milestone > 300) {
            userStats[data.uniqueId].milestone = 25; // Reset the milestone
        }
    }
}

// function addOverlayEvent(eventType, data) {
//         let overlayOff = document.getElementById('overlayOff');
//         if (overlayOff.checked) {
//             let overlayPage = null;
//             if (!overlayPage || overlayPage.closed) {
//                 overlayPage = window.open('index2.html', 'transparent', 'width=auto,height=auto,frame=false,transparent=true,alwaysOnTop=true,nodeIntegration=no');
//                 }
//             const event = new CustomEvent('pageAB', { detail: { eventType, indexData: data }});
//             overlayPage.dispatchEvent(event);
//         }
// }

//        pageB = window.open('index2.html', 'transparent', 'width=auto,height=auto,frame=false,transparent=true,nodeIntegration=no');
//        pageB = window.open('index2.html', 'transparent', 'width=auto,height=auto,frame=true,transparent=false,nodeIntegration=no');
console.log(JSON.parse(localStorage.getItem('lastGiftItem')));
function addGiftItem(data) {
    localStorage.setItem('lastGiftItem', JSON.stringify(data));
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.giftcontainer');
    if (container.find('div').length > 200) {
        container.find('div').slice(0, 100).remove();
    }

    let streakId = data.userId.toString() + '_' + data.giftId;
    let totalDiamonds = data.diamondCount * data.repeatCount;
    let giftIconSize = 150; // Tamaño base del icono del regalo
    if (totalDiamonds > 100) {
        giftIconSize += totalDiamonds; // Aumenta el tamaño del icono del regalo en 1 píxel por cada diamante
    }
    const profilePictureUrl = isValidUrl(data.profilePictureUrl) ? data.profilePictureUrl : 'url_de_imagen_por_defecto';
    const giftPictureUrl = isValidUrl(data.giftPictureUrl) ? data.giftPictureUrl : 'url_de_imagen_por_defecto';

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
                              <span><b style="${isPendingStreak(data) ? 'color:red' : ''}">x${data.repeatCount.toLocaleString()} : ${(data.diamondCount * data.repeatCount).toLocaleString()} Diamantes </b><span><br>
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


    let sendsoundCheckbox = document.getElementById('sendsoundCheckbox');

    if (sendsoundCheckbox.checked) {
        for (let i = 0; i < data.repeatCount; i++) {

        }
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
        Minecraftlivedefault('welcome', data, message, null, data);
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
        Minecraftlivedefault('chat', data);
        return;
      }

    if (window.settings.showChats === "0") return;

    addChatItem('', data, message);
    sendToServer('chat', data);
    Minecraftlivedefault('chat', data);

    if (message === lastMessage) {
        return;
    }

    lastMessage = message;
    let tiempoActual = Math.floor(Date.now() / 1000);

    if (tiempoActual - data.ultimoTiempo <= 60) {
        return data.nickname; // Retorna la cantidad actual de puntos sin cambios
    }

    data.ultimoTiempo = tiempoActual;
}

// New gift received
connection.on('gift', (data) => {
    handlegift(data);
    // const audioGiftdata = loadData();
    // const eventData2 = audioGiftdata.find(data1 => data1.eventName === data.giftName);
    // if (eventData2) {
    //     const audioPath = eventData2.audioPath; // Obtener el audioPath del objeto encontrado
    //     const audioElement = new Audio(audioPath); // Crear un nuevo elemento de audio
    //     audioElement.play(); // Reproducir el audio
    //   } 

})
function handlegift(data) {
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

$(document).ready(() => {
    const EventNameInput = document.getElementById("test-event");
    const TestButton = document.getElementById("testButton");

    if (TestButton) {
        TestButton.onclick = function() {
            TESTsound(EventNameInput.value.trim());
        };
        // Simular clic en el botón TestButton al cargar el documento
        $(TestButton).click();
    }
});

function TESTsound(eventName) {
    const audioData1 = loadData();
    audioData1.forEach((data) => {
        console.log(data.audioPath, data.audioName, data.eventName, data.volume, data.enable);
    });
    const eventData1 = audioData1.find(data1 => data1.eventName === eventName);
    if (eventData1) {
        const audioPath = eventData1.audioPath; // Obtener el audioPath del objeto encontrado
        const audioElement = new Audio(audioPath); // Crear un nuevo elemento de audio
        audioElement.play(); // Reproducir el audio
      } 

}

function loadData1() {
    const storedData = localStorage.getItem("audioData");
    return storedData ? JSON.parse(storedData) : [];
}


// share, follow
let seguidores = new Set();

connection.on('social', (data) => {
    if (window.settings.showFollows === "0") return;
    let color;
    let message;
    let lastfollow = localStorage.setItem('lastfollow', JSON.stringify(data));
    let sendDataCheckbox = document.getElementById('sendDataCheckbox');
    let prefixuserfollow = document.getElementById('prefixuserfollow').value || "te sige";
    if (data.displayType.includes('follow')) {
        color = '#CDA434'; // Cambia esto al color que quieras para los seguidores
        message = `${data.nickname} ${prefixuserfollow}`;
        Minecraftlivedefault('follow', data);
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

    } else if (data.displayType.includes('share')) {
        color = '#CDA434'; // Cambia esto al color que quieras para las comparticiones
        message = `${data.nickname} compartió el directo`;
        Minecraftlivedefault('share', data);
        sendToServer('share', data);
        addEventsItem("share", data);
    } else {
        color = '#CDA434'; // Color por defecto
        message = data.label.replace('{0:user}', '');
    }

    sendToServer('social', data, null, color, message);
});

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
    const modal = document.createElement('div');
    modal.classList.add('modal');
    
    // Contenido de la modal
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>${data.nickname} asks:</h2>
            <p>${data.questionText}</p>
        </div>
    `;
    
    // Agregar modal al cuerpo del documento
    document.body.appendChild(modal);
    
    // Cerrar modal cuando se hace clic en la "x"
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });
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

// appendvoicelist voicelistarray
// const VOICE_LIST_ALT = Object.keys(VOICE_LIST).map(k => VOICE_LIST[k]);
document.addEventListener('DOMContentLoaded', (event) => {
    var voiceSelectContainer = document.getElementById('voiceSelectContainer');
    voiceSelectContainer.appendChild(voiceSelect);

    // Inicializar Select2
    $(voiceSelect).select2();
    $(voiceSelect).on('change', function() {
        const selectedValue = $(this).val();
    });
    console.log(voiceSelect.value);
});
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
})    
async function sendToServer(eventType, data) {
    if (data.comment === lastComment) {
        return;
    }
    lastComment = data.comment; 
    let objet = {eventType, data};
    eventmanager(eventType, data);
    /// aqui enviamos a eventos eventmanager
    elemento.value = objet;
    fetch(`${backendUrl}/api/receive1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ eventType, data}),
      })
      .then(response => response.json())
      .then(data => {
        //console.log(data); // Maneja la respuesta del servidor si es necesario
      })
      .catch(error => {
        console.error('Error:', error);
      });
}

window.onload = async function() {
    loadRowsOnPageLoad(tableBody);
};
export { sendReplacedCommand };