// This will use the demo backend if you open index.html locally via file://, otherwise your server will be used
let backendUrl = location.protocol === 'file:' ? "https://tiktok-chat-reader.zerody.one/" : undefined;

let connection = new TikTokIOConnection(backendUrl);

let viewerCount = 0;
let likeCount = 0;
let diamondsCount = 0;
let previousLikeCount = 0;

// These settings are defined by obs.html
if (!window.settings) window.settings = {};
document.addEventListener('DOMContentLoaded', (event) => {
    document.body.addEventListener('mouseover', () => {
        // Cuando el cursor está sobre el cuerpo del documento, aplicar el tema oscuro
        if (document.body.className !== 'theme-dark') {
            document.body.className = 'theme-light-hover';
        }
    });

    document.body.addEventListener('mouseout', () => {
        // Cuando el cursor no está sobre el cuerpo del documento, hacerlo transparente
        if (document.body.className === 'theme-light-hover') {
            document.body.className = 'theme-light';
        }
    });
    const toggleButton = document.getElementById('dn');

    // Check if running in OBS
    if (window.obsstudio) {
        document.body.style.backgroundColor = 'transparent';
    } else {
        toggleButton.addEventListener('change', () => {
            if (toggleButton.checked) {
                // Si el botón de alternancia está marcado, aplicar el tema oscuro
                document.body.className = 'theme-dark';
            } else {
                // Si el botón de alternancia no está marcado, aplicar el tema claro
                document.body.className = 'theme-light';
            }
        });
    }
});

$(document).ready(() => {
    $('#connectButton').click(connect);
    $('#uniqueIdInput').on('keyup', function (e) {
        if (e.key === 'Enter') {
            connect();
        }
    });

    if (window.settings.username) connect();
})
let isConnected = false;
let currentRoomId = null;
let currentUniqueId = null;

function connect() {
    let uniqueId = window.settings.username || $('#uniqueIdInput').val();
    if (uniqueId !== '') {

        $('#stateText').text('Connecting...');

        connection.connect(uniqueId, {
            enableExtendedGiftInfo: true
        }).then(state => {
            $('#stateText').text(`Connected to roomId ${state.roomId}`);
            sendToServer('connected', uniqueId);
            // reset stats
            viewerCount = 0;
            likeCount = 0;
            diamondsCount = 0;
            updateRoomStats();

        }).catch(errorMessage => {
            $('#stateText').text(errorMessage);

            // schedule next try if obs username set
            if (window.settings.username) {
                setTimeout(() => {
                    connect(window.settings.username);
                }, 30000);
            }
        })

    } else {
        alert('no username entered');
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
    $('#roomStats').html(`Espectadores: <b>${viewerCount.toLocaleString()}</b> Likes: <b>${likeCount.toLocaleString()}</b> Diamantes: <b>${diamondsCount.toLocaleString()}</b>`)
}

function generateUsernameLink(data) {
    return `<a class="usernamelink" href="https://www.tiktok.com/@${data.uniqueId}" target="_blank">${data.uniqueId}</a>`;
}

function isPendingStreak(data) {
    return data.giftType === 1 && !data.repeatEnd;
}
/**
 * Add a new message to the chat container
 */
let lastMessage = "";
let lastNickname = "";
const ignoredUser = "buttowski";

function addChatItem(color, data, text, summarize) {
    let container = location && location.href ? (location.href.includes('obs.html') ? $('.eventcontainer') : $('.chatcontainer')) : $('.chatcontainer');
    if (container.find('div').length > 500) {
        container.find('div').slice(0, 200).remove();
    }
   
    // Modificación para eliminar o reemplazar los caracteres especiales
    container.find('.temporary').remove();;

    container.append(`
        <div class=${summarize ? 'temporary' : 'static'}>
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <span>
                <b>${generateUsernameLink(data)}:</b> 
                <span style="color:${color}">${sanitize(text)}</span>

            </span>
        </div>
    `);
    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 400);
    addOverlayEvent(data, text, color, false);

    let filterWordsInput = document.getElementById('filter-words').value;
    let filterWords = (filterWordsInput.match(/\/(.*?)\//g) || []).map(word => word.slice(1, -1));
    let remainingWords = filterWordsInput.replace(/\/(.*?)\//g, '');
    filterWords = filterWords.concat(remainingWords.split(/\s/).filter(Boolean));
    let lowerCaseText = text && text.toLowerCase() && text.replace(/[^a-zA-Z0-9áéíóúüÜñÑ.,;:!?¡¿'"(){}[\]\s]/g, '');
    let sendsoundCheckbox = document.getElementById('sendsoundCheckbox');
    if (!userPoints[data.nickname]) {
        userPoints[data.nickname] = 20; // Asignar 10 puntos por defecto
        console.log("puntos asignados nuevo usuario",userPoints[data.nickname]);
    }
    if (sendsoundCheckbox.checked) {
        playSoundByText(text);
    }
    
    const customFilterWords = [
        "opahsaron", "tedesku", "unanimalh", "doketesam", "unmachetedesfigurolacara",
        "Votame", "botatu", "ardah", "vhiolar", "yoagolokeh", "tihtuh", "demih", "petatemah",
        "tonash", "klezyanas", "onunasko", "melavosh", "tttthummamma", "vansokonun", "beshilketiensh",
        "ghram", "thekomeshtu", "phuto", "bherga", "chivholitos", "endopreh", "ejakah", "nenegrho",
        "pordio0", "ñateh", "graphuta", "portuhkabeh", "poniatazo", "tumamalaneh", "belkuh", "lodedah", "satejar",
        "eztesujeto", "miliah", "datufa",
        "chupa", "phinga", "haciah", "tiradoenelpuen", "tolasvo", "pidocalen", "péné",
        "joshua.ticona", "welcome", "wó", "jaja", "30hp", "phyngal", "0hp", "ijodephutha",
        "tucuh", "darunapa", "belkun", "ª", "teboyasacarlamih", "nodeni", "narentukara",
        "pides", "graphuta", "tumamalaneh", "mentirachupamibhrgha", "ilagranpehra",
        "rretiyeroijoepuhta", "astakeh", "directo", "comparti", "kameh", "neenunaba",
        "gobioh", "@admin", "comerh", "azekkk", "kometeh", "miqaqa", "mabaslapin",
        "íbamaos", "sigue", "éramoschivolitos", "enguyete", "soychih", "Yaaaaaaa",
        "grospeh", "tolaphin", "enapretadi", "ginadebe", "gokareka", "medarisaestepela",
        "drehesunazohrra", "unahpros", "🐈‍⬛", "kuloh", "kasinoh", "muchosh", "babhosoh",
        "nalditha", "wª", "bahsura", "anopahsaron", "tedesku", "unanimalh", "doketesam",
        "unmachetedesfigurolacara", "Votame", "botatu", "ardah", "vhiolar", "yoagolokeh",
        "tihtuh", "demih", "petatemah", "tonash", "klezyanas", "onunasko", "wibond", "kalateate",
        "grabadazo", "sinenbargo", "correte", "manko", "gueh", "pohortah", "queh", "rashpeh",
        "latemueh", "grih", "mhih", "ardhah", "vah", "llah", "driya", "temuh", "wi bom",
        "feh ih", "ih toh", "neh grih", "grih toh", "yosi tepar", "tola kah", "kah beza", "beza deum", "iasi temuh",
        "zojar jacha", "driya zojar", "lah driya", "+tur", "tu boca escuchaste", "ohn tu boca",
        "harda", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "", "", "", "", "",

      ];
      
    for (let word of customFilterWords) {
        if (word && lowerCaseText.includes(word.toLowerCase())) {
            if (userPoints[data.nickname] <= 0) {
                console.log('Usuario con 0 puntos,:', data.nickname, userPoints[data.nickname]);
                return;
            } 
            if (userPoints[data.nickname] >= 1) {
                userPoints[data.nickname] -= 1;
                userPoints[data.nickname]--;
                console.log('Puntos del usuario después de la deducción:', data.nickname, userPoints[data.nickname]);
            }
        }
    }

    const regex = /(.)\1{7,}/g;
    const matches = lowerCaseText.match(regex);
    
    if (matches && matches.length > 0) {
      console.log(`Se encontraron repeticiones de 1, 2 o 3 caracteres seguidamente más de 8 veces.`);
      return;
    }
        
    for (let word of filterWords) {
        if (word && lowerCaseText.includes(word.toLowerCase())) {
            if (userPoints[data.nickname] <= 2) {
                console.log('Usuario con 0 puntos,:', data.nickname, userPoints[data.nickname]);
                return;
            } 
            if (userPoints[data.nickname] >= 2) {
                userPoints[data.nickname]--;
                console.log('Puntos del usuario después de la deducción:', data.nickname, userPoints[data.nickname]);
            }
        }
    }

    const specialChars = /[#$%^&*()/,.?":{}|<>]/;
    const startsWithSpecialChar = specialChars.test(text.charAt(0));
    const messagePrefix = startsWithSpecialChar ? "!" : "";
    const messageSuffix = summarize ? "" : ` ${text}`;
    let cleanedText = text;
    if (startsWithSpecialChar) {
        cleanedText = text.replace(/[@#$%^&*()/,.?":{}|<>]/, ""); // Elimina o reemplaza los caracteres especiales al comienzo del texto con "!"
    }
    cleanedText = text.replace(/[#$%^&*/,.":{}|<>]/, "");
    let emojiRegex = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/ug;
    let emojis = text && text.match(emojiRegex);
    if (emojis) {
        let emojiCounts = {};
        for (let emoji of emojis) {
            if (emoji in emojiCounts) {
                emojiCounts[emoji]++;
            } else {
                emojiCounts[emoji] = 1;
            }

            if (emojiCounts[emoji] >= 2) {
                return;
            }
        }
    }
    const message = messagePrefix + (cleanedText.length > 60 ? `${data.nickname} dice ${messageSuffix}` : cleanedText);
    let nickname = data.nickname
    
    if (text.length <= 3) {
        console.log('filtrado');
        return;
    }
    if (message === lastMessage) {
        return;
    }
    // Filtrar mensajes de usuarios con pocos puntos

    lastMessage = message;
    let sendDataCheckbox = document.getElementById('sendDataCheckbox');

    if (sendDataCheckbox.checked) {
        if (startsWithSpecialChar) {
            if (userPoints[data.nickname] <= 3) {
                console.log('Usuario con 0 puntos, mensaje omitido:', data.nickname, userPoints[data.nickname]);
                return;
            }
            userPoints[data.nickname] -= 3;
            console.log('Usuario con puntos:', data.nickname, userPoints[data.nickname]);
        }
        enviarMensaje(message);
    }
    if (message.length <= 3) {
        console.log('filtrado');
        return;
    }
    leerMensajes(message);

    if (sendDataCheckbox.checked) {
        if (userPoints[data.nickname] <= 3) {
            console.log('Usuario con 0 puntos, mensaje omitido:', data.nickname, userPoints[data.nickname]);
            return;
        }
        if (nickname === lastNickname) {
            console.log('anti spam commandos');
            return;
        }
        userPoints[data.nickname] -= 3;
        obtenerYenviarCommandID({ eventType: 'chat', string: message });
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

let lastEvent = null;
let eventDivs = {};
let giftCounters = {};
let lastFilteredPositions = [];
let lastFilteredPositionIndex = 0;

function testOverlay() {
    // Obtener el valor del campo de entrada
    const inputValue = document.getElementById('inputest').value;
    var overlay = document.createElement('div');
    overlay.style.position = 'absolute';

    // Dividir el valor del campo de entrada en palabras
    const words = inputValue.split(' ');

    // Buscar la primera palabra que sea un número
    let numMessages = 1;
    const messageWords = [];
    for (const word of words) {
        const num = Number(word);
        if (!isNaN(num)) {
            numMessages = num;
        } else {
            messageWords.push(word);
        }
    }

    // Si el número es mayor que 30, limitarlo a 30
    if (numMessages > 30) {
        numMessages = 30;
    }

    // Crear un objeto de datos ficticio para pasar a addOverlayEvent
    const fakeData = {
        profilePictureUrl: 'https://example.com/profile.jpg' // Reemplazar con una URL de imagen real
    };

    // Llamar a addOverlayEvent tantas veces como numMessages
    const message = messageWords.join(' ');
    for (let i = 0; i < numMessages; i++) {
        const messageWithNumber = `${message} ${i + 1}`;
        addOverlayEvent(fakeData, messageWithNumber, 'black', false, 1);
    }
}
let userStats = {};

connection.on('like', (msg) => {
    if (typeof msg.totalLikeCount === 'number') {
        likeCount = msg.totalLikeCount;
        updateRoomStats();
    }
    // Initialize user's stats
    if (!userStats[msg.uniqueId]) {
        userStats[msg.uniqueId] = { likes: 0, totalLikes: 0, milestone: 50 };
    }

    // Increment user's like count and total like count
    userStats[msg.uniqueId].likes += msg.likeCount;
    userStats[msg.uniqueId].totalLikes += msg.likeCount;

    // Check if user's like count has reached the milestone
    let sendDataCheckbox = document.getElementById('sendDataCheckbox');
    while (sendDataCheckbox.checked && userStats[msg.uniqueId].likes >= userStats[msg.uniqueId].milestone && userStats[msg.uniqueId].milestone <= 300) {
        const milestoneLikes = `${userStats[msg.uniqueId].milestone}LIKES`;
        sendToServer('likes', msg, milestoneLikes, "color", "msg", "message");
        console.log(milestoneLikes);
        obtenerYenviarCommandID({ eventType: 'likes', string: milestoneLikes });

        // Send data or msg.uniqueId and $ likes
        addOverlayEvent(msg, `${userStats[msg.uniqueId].milestone} likes`, 'blue', false, 1);

        userStats[msg.uniqueId].likes -= userStats[msg.uniqueId].milestone; // Deduct milestone likes from user's like count
        userStats[msg.uniqueId].milestone += 50; // Increase the milestone
        if (userStats[msg.uniqueId].milestone > 300) {
            userStats[msg.uniqueId].milestone = 50; // Reset the milestone
        }
    }
});
let comboCounters = {};
let isImageLink = false;

function addOverlayEvent(data, text, color, isGift, repeatCount) {
    const eventContainer = document.getElementById('overlayEventContainer');
    // Update the last event and last text
    lastEvent = { text, isGift };
    lastText = text;
    const spacing = 30;

    // Initialize comboCounters[text] if it doesn't exist
    if (!comboCounters[text]) {
        comboCounters[text] = { count: 0, timeout: null, div: null };
    }

    // Increment comboCounters[text]
    comboCounters[text].count++;

    let baseTime = isGift ? 20000 : 18000; // 5 seconds for gifts, 3 seconds for text
    let totalTime = baseTime * Math.pow(1.01, comboCounters[text].count);
    let imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    isImageLink = text && imageExtensions.some(ext => text.endsWith(ext)); // Update isImageLink here

    let eventDiv; // Define eventDiv here

    if (comboCounters[text].count > 1) {
        // If we're in a combo, clear the existing timeout, update the existing div and set a new timeout
        clearTimeout(comboCounters[text].timeout);
        eventDiv = comboCounters[text].div; // Update eventDiv with the existing div
        if (isImageLink) {
            // If the text is an image link, display the image
            eventDiv.innerHTML = `<img src="${text}" class="event-image"><img class="profile-picture profile-animation" src="${data.profilePictureUrl}" style="border-radius: 50%;"> <span style="color:red;">x${comboCounters[text].count}</span>`;
            let left = Math.random() * (eventContainer.getBoundingClientRect().width - eventDiv.offsetWidth - spacing);
            eventDiv.style.left = `${left}px`; // Set left to a random value within the container
        } else {
            eventDiv.innerHTML = `<span class="event-text text-animation" style="color:${color}">${sanitize(text)} <span style="color:red;">x${comboCounters[text].count}</span></span>`;
        }
        comboCounters[text].timeout = setTimeout(() => {
            comboCounters[text].count = 0;
            if (eventDiv.parentNode) {
                eventContainer.removeChild(eventDiv);
            }
            comboCounters[text].div = null;
        }, totalTime);
    } else {
        eventDiv = document.createElement('div'); // Assign a new div to eventDiv
        eventDiv.className = 'event-div';
        let { top, left } = getRandomPosition(eventContainer, eventDiv, 100);
        eventDiv.style.top = `${top}px`;
        eventDiv.style.left = `${(eventContainer.getBoundingClientRect().width - eventDiv.offsetWidth) / 2}px`;
        if (isImageLink) {
            // If the text is an image link, display the image
            eventDiv.innerHTML = `<img src="${text}" class="event-image"><img class="profile-picture profile-animation" src="${data.profilePictureUrl}" style="border-radius: 50%;">`;
            let left = Math.random() * (eventContainer.getBoundingClientRect().width - eventDiv.offsetWidth - spacing);
            eventDiv.style.left = `${left}px`;
        } else if (text && (text.includes('sige') || text.includes('compartió') || text.includes('gato') || text.includes('directo') || text && text.includes('likes'))) {
            eventDiv.innerHTML = `<img class="profile-picture profile-animation" src="${data.profilePictureUrl}" style="border-radius: 50%;"><span class="event-text text-animation" style="color: ${color};">${text}</span>`;

        } else {
            eventDiv.className += ' marquee';
            eventDiv.innerHTML = `<span class="event-text text-animation" style="color:${color}">${sanitize(text)}</span>`;
            eventDiv.style.left = `${(eventContainer.getBoundingClientRect().width - eventDiv.offsetWidth) / 2}px`;
        }
        // Add the div to the container
        eventContainer.appendChild(eventDiv);
        comboCounters[text].div = eventDiv;
    }

    if (comboCounters[text].timeout) {
        clearTimeout(comboCounters[text].timeout);
    }

    // Set a timeout to reset comboCounters[text] to 0 after totalTime
    comboCounters[text].timeout = setTimeout(() => {
        comboCounters[text].count = 0;
        if (eventDiv.parentNode) {
            eventContainer.removeChild(eventDiv);
        }
        comboCounters[text].div = null;
    }, totalTime);
}
let grid = [];
const gridSize = 100; // Tamaño de la celda de la cuadrícula en píxeles
let precalculatedPositions = [];

function initializeGrid(container) {
    const containerRect = container.getBoundingClientRect();
    const gridRows = Math.floor(containerRect.height / gridSize);
    const gridColumns = Math.floor(containerRect.width / gridSize);
    grid = new Array(gridRows).fill(0).map(() => new Array(gridColumns).fill(false));

    // Precalculate 50 random positions
    for (let i = 0; i < 30; i++) {
        let row, column;
        do {
            row = Math.floor(Math.random() * gridRows);
            column = Math.floor(Math.random() * gridColumns);
        } while (grid[row][column] || isNearCorner(row, column, gridRows, gridColumns));

        grid[row][column] = true;
        precalculatedPositions.push({
            top: row * gridSize,
            left: column * gridSize
        });
    }
}

function isNearCorner(row, column, gridRows, gridColumns) {
    const cornerMargin = 2; // Margen para evitar las esquinas
    return (
        (row < cornerMargin && column < cornerMargin) || // Esquina superior izquierda
        (row < cornerMargin && column >= gridColumns - cornerMargin) || // Esquina superior derecha
        (row >= gridRows - cornerMargin && column < cornerMargin) || // Esquina inferior izquierda
        (row >= gridRows - cornerMargin && column >= gridColumns - cornerMargin) // Esquina inferior derecha
    );
}
let existingPositions = [];

function getRandomPosition() {
    const elementSize = 50; // Define el tamaño del elemento que estás generando
    const spacing = 50; // Define el espaciado entre elementos
    const maxAttempts = 50; // Define el número máximo de intentos para encontrar una nueva posición

    const container = document.getElementById('overlayEventContainer');
    const containerRect = container.getBoundingClientRect();

    for (let attempts = 0; attempts < maxAttempts; attempts++) {
        // Generar una nueva posición
        const newPosition = {
            top: Math.random() * (containerRect.height - elementSize - spacing), // Resta elementSize y spacing del valor aleatorio generado para top
            left: Math.random() * (containerRect.width - elementSize) // Resta elementSize del valor aleatorio generado para left
        };

        // Comprobar si la nueva posición está demasiado cerca de alguna de las posiciones existentes
        if (!existingPositions.some(existingPosition => Math.abs(existingPosition.top - newPosition.top) < elementSize + spacing)) {
            // Si la nueva posición no está demasiado cerca, añadirla a la lista de posiciones existentes y devolverla
            existingPositions.push(newPosition);
            return newPosition;
        }
    }

    // Si no se puede encontrar una nueva posición después de maxAttempts intentos, reiniciar la lista de posiciones existentes
    existingPositions = [];
    return getRandomPosition();
}
// Llamar a initializeGrid con el contenedor cuando la página se carga
window.onload = function() {
    const eventContainer = document.getElementById('overlayEventContainer');
    initializeGrid(eventContainer);
}

// Resto del código...
/** ID[${data.giftId}] id regalo
 * Agregar un nuevo regalo al contenedor de regalos
 */
function addGiftItem(data) {
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
            playSound(data.giftName);

        }
    }
    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 800);
}

// viewer stats
connection.on('roomUser', (msg) => {
    if (typeof msg.viewerCount === 'number') {
        viewerCount = msg.viewerCount;
        updateRoomStats();
    }
})

// Member join
let joinMsgDelay = 0;
connection.on('member', (msg) => {

    if (window.settings.showJoins === "0") return;

    let addDelay = 250;
    if (joinMsgDelay > 500) addDelay = 100;
    if (joinMsgDelay > 1000) addDelay = 0;

    joinMsgDelay += addDelay;

    setTimeout(() => {
        joinMsgDelay -= addDelay;
        addChatItem('#CDA434', msg, 'welcome', true);
        message = msg.uniqueId;
        sendToServer('welcome', msg, message, null, msg);
    }, joinMsgDelay);
})
let processedMessages = {};
let lastComments = [];
let lastTenMessages = [];
let userPoints = {};

connection.on('chat', (data) => {
    let message = data.comment;
    
    let filterWordsInput = document.getElementById('filter-words').value;
    let filterWords = (filterWordsInput.match(/\/(.*?)\//g) || []).map(word => word.slice(1, -1));
    // Eliminar estas secuencias del texto de entrada
    let remainingWords = filterWordsInput.replace(/\/(.*?)\//g, '');
    // Dividir el texto restante por espacios y añadir las palabras al array
    filterWords = filterWords.concat(remainingWords.split(/\s/).filter(Boolean));
    let lowerCaseText = message.toLowerCase();
    for (let word of filterWords) {
        if (word && lowerCaseText.includes(word.toLowerCase())) {
            return;
        }
    }
    if (!userPoints[data.nickname]) {
        userPoints[data.nickname] = 20; // Asignar 10 puntos por defecto
        console.log("puntos asignados nuevo usuario",userPoints[data.nickname]);
    }
    if (userPoints[data.nickname] <= -500) {
        console.log('Usuario con 0 puntos,:', data.nickname, userPoints[data.nickname]);
        userPoints[data.nickname] += 200;
        userPoints[data.nickname] + 200;    
        return;
    } 
    if (userPoints[data.nickname] >= 1) {
        userPoints[data.nickname] -= 1;
        userPoints[data.nickname]--;
        console.log('Puntos del usuario después de la deducción:', data.nickname, userPoints[data.nickname]);
    } 

    if (window.settings.showChats === "0") return;

    addChatItem('', data, message);
    sendToServer('chat', data, message, null, msg);

    if (message === lastMessage) {
        return;
    }

    lastMessage = message;
    let tiempoActual = Math.floor(Date.now() / 1000);

    if (tiempoActual - data.ultimoTiempo <= 60) {
        return data.nickname; // Retorna la cantidad actual de puntos sin cambios
    }
    if (data.nickname < 20) {
        data.nickname += 5;
    }
    data.ultimoTiempo = tiempoActual;
    return data.nickname;
});
// New gift received
connection.on('gift', (data) => {
    if (!userPoints[data.nickname]) {
        userPoints[data.nickname] = 10; // Asignar 10 puntos por defecto
    } else if (userPoints[data.nickname] >= 1) {
        userPoints[data.nickname] += 20;
        userPoints[data.nickname] + 10;
        console.log('Puntos aumentados:', data.nickname, userPoints[data.nickname]);
    }
    if (sendDataCheckbox.checked) {
    obtenerYenviarCommandID({ eventType: 'gift', string: data.giftName });
    }
    addOverlayEvent(data, data.giftPictureUrl, 'red', true, data.repeatCount);
    sendToServer('gift', data, null, null, data);
    if (!isPendingStreak(data) && data.diamondCount > 0) {
        diamondsCount += (data.diamondCount * data.repeatCount);

        updateRoomStats();
    }

    if (window.settings.showGifts === "0") return;
    addGiftItem(data);
})

// share, follow
let seguidores = new Set();

connection.on('social', (data) => {
    if (window.settings.showFollows === "0") return;
    let color;
    let message;
    let sendDataCheckbox = document.getElementById('sendDataCheckbox');

    if (data.displayType.includes('follow')) {
        color = '#CDA434'; // Cambia esto al color que quieras para los seguidores
        message = `${data.nickname} te sige`;
        if (sendDataCheckbox.checked) {
            if (!seguidores.has(data.nickname)) {
                obtenerYenviarCommandID({ eventType: 'follow', string: `follow` });
                console.log(`${data.nickname} es un gato mas`);
                seguidores.add(data.nickname);
                // Establecer un temporizador para eliminar data.uniqueId de seguidores después de 5 minutos
                setTimeout(() => {
                    seguidores.delete(data.nickname);
                }, 60000); // 5 minutos
            }
        }
    } else if (data.displayType.includes('share')) {
        color = '#CDA434'; // Cambia esto al color que quieras para las comparticiones
        message = `${data.nickname} compartió el directo`;
        if (sendDataCheckbox.checked) {
            obtenerYenviarCommandID({ eventType: 'share', string: `share` });
        }
    } else {
        color = '#CDA434'; // Color por defecto
        message = data.label.replace('{0:user}', '');
    }

    addChatItem(color, data, message);
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
    message = 'Transmisión terminada.';

    // Send data to server
    sendToServer('streamEnd', message);
})

connection.on('questionNew', (data) => {
    console.log(`${data.uniqueId} asks ${data.questionText}`);

})
connection.on('linkMicBattle', (data) => {

    console.log(`New Battle: ${data.battleUsers[0].uniqueId} VS ${data.battleUsers[1].uniqueId}`);

})
connection.on('linkMicArmies', (data) => {
    console.log('linkMicArmies', data);
    console.log(`${data.uniqueId} linkMicArmies!`);
})
connection.on('liveIntro', (msg) => {
    console.log(msg);
})
connection.on('emote', (data) => {
    console.log(`${data.uniqueId} emote!`);
    console.log('emote received', data);
})
connection.on('envelope', (data) => {
    console.log(`${data.uniqueId} envelope!`);
    console.log('envelope received', data);
})
connection.on('subscribe', (data) => {
    console.log(`${data.uniqueId} subscribe!`);
})

function obtenerYenviarCommandID(event) {
    const { eventType, likes, giftname, message, follow, share, string } = event;
    if (string && string.length > 20) {
        console.error('El string es demasiado largo:', string);
        return;
    }
    const listaComandos = [];
    const pageSize = 100;
    let skip = 0;


    function obtenerPaginaDeComandos() {
        fetch(`http://localhost:8911/api/v2/commands?skip=${skip}&pageSize=${pageSize}`)
            .then(response => response.json())
            .then(data => {
                if (!Array.isArray(data.Commands)) {
                    throw new Error('La respuesta no contiene un array de comandos');
                }

                const comandos = data.Commands;
                listaComandos.push(...comandos);

                if (comandos.length === pageSize) {
                    skip += pageSize;
                    obtenerPaginaDeComandos();
                } else {
                    listaComandos.forEach(cmd => {
                        if (!cmd || cmd < 1) {
                            console.error('Comando ignorado:', cmd);
                            return;
                        }
                    });

                    const MAX_COMMANDS = 50;
                    let filterCondition;
                    if (string) {
                        filterCondition = cmd => {
                            if (eventType === 'gift') {
                                console.log('Filtrando comandos para giftname. Valor de string:', string); // Nuevo registro de consola
                                return cmd.Name.toLowerCase().includes(string.toLowerCase());
                            } else {
                                return cmd.Name.toLowerCase().split(' ').includes(string.toLowerCase());
                            }
                        };
                    } else {
                        filterCondition = () => true;
                    }

                    const comandosEncontrados = listaComandos.filter(filterCondition);
                    if (comandosEncontrados.length === 0) {
                        console.error(`No hay comando con: ${string}`);
                        return;
                    }

                    const comandosLimitados = comandosEncontrados.slice(0, MAX_COMMANDS);

                    let index = 0;
                    let ultimoComandoEnviado = "";

                    function enviarcomandoConRetraso() {
                        if (index < comandosLimitados.length) {
                            const comando = comandosLimitados[index];
                            if (!comando || comando < 1 || !comando.Name) {
                                console.error('Comando ignorado:', cmd);
                                return;
                            }
                            if (typeof comando.Name !== 'string') {
                                console.error('El nombre del comando no es un string');
                                return;
                            }
                            if (comando.Name === ultimoComandoEnviado && eventType !== 'gift') {
                                console.error('El comando no puede ser repetido:', comando.Name);
                                return;
                            }
                            let delay;
                            if (comandosLimitados.length > 20) {
                                delay = comando.Name === ultimoComandoEnviado ? 20000 : 10000;
                            } else if (comandosLimitados.length > 10) {
                                delay = comando.Name === ultimoComandoEnviado ? 15000 : 7000;
                            } else {
                                delay = 0;
                            }

                            setTimeout(() => {
                                fetch(`http://localhost:8911/api/commands/${comando.ID}`, {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json"
                                        },
                                        body: JSON.stringify({
                                            id: comando.ID,
                                            name: comando.Name,
                                        })
                                    })
                                    .then(response => {
                                        if (!response.ok) {
                                            throw new Error(`HTTP error! status: ${response.status}`);
                                        }
                                        ultimoComandoEnviado = comando.Name;
                                        index++;
                                        enviarcomandoConRetraso();
                                    })
                                    .catch(error => {
                                        console.error('Error al enviar el comando:', error);
                                        // Si el servidor responde con un error 404, incrementa el índice y llama a enviarcomandoConRetraso
                                        if (error.message.includes('404')) {
                                            index++;
                                            enviarcomandoConRetraso();
                                        }
                                    });
                            }, delay);
                        }
                    }
                    enviarcomandoConRetraso();
                }
            })
            .catch(error => {
                console.error('Error al obtener la página de comandos:', error);
            });
    }

    obtenerPaginaDeComandos();
}

window.isIframePlaying = false;

function mostrarOverlay() {
    const overlayContainer = document.getElementById("overlayEventContainer");
    let iframeElement = document.getElementById("overlay-frame");

    // Si el iframe ya existe, no hagas nada
    if (iframeElement) return;

    // Crear y configurar el iframe
    iframeElement = document.createElement("iframe");
    iframeElement.id = "overlay-frame";
    iframeElement.src = "http://localhost:8111/overlay/";
    iframeElement.frameborder = "0";
    iframeElement.style.width = "100%";
    iframeElement.style.height = "100%";
    iframeElement.allow = "autoplay";


    // Agregar el iframe al contenedor del overlay
    overlayContainer.appendChild(iframeElement);

    // Mostrar el contenedor del overlay
    overlayContainer.style.display = "flex";
    window.isIframePlaying = true;
}

function ocultarOverlay() {
    const overlayContainer = document.getElementById("overlayEventContainer");
    const iframeElement = document.getElementById("overlay-frame");

    // Si el iframe no existe, no hagas nada
    if (!iframeElement) return;

    // Eliminar el iframe
    overlayContainer.removeChild(iframeElement);

    // Ocultar el contenedor del overlay
    overlayContainer.style.display = "none";
}

var audio, chatbox, button, channelInput, audioqueue, isPlaying, add, client, skip;

const TTS_API_ENDPOINT = 'https://api.streamelements.com/kappa/v2/speech?'; // unprotected API - use with caution
const PRONOUN_API_ENDPOINT = 'https://pronouns.alejo.io/api/users/';
const maxMsgInChat = 2 * 10;
const DESCENDING = true; // newest on top
const VOICE_PREFIX = '&';
const pronoun_DB = {}; // username -> pronound_id
const FEM_PRONOUNS = ['sheher', 'shethey'];
var CHANNEL_BLACKLIST = [
    'streamlabs',
    'streamelements',
    'moobot',
    'nightbot',
    'ch4tsworld',
    'streamstickers',
    'laia_bot',
    'soundalerts',
    'ankhbot',
    'phantombot',
    'wizebot',
    'botisimo',
    'coebot',
    'deepbot',
];
var VOICE_LIST = {
    "Penélope (Spanish, American)": "Penelope",
    "Miguel (Spanish, American)": "Miguel",
    "Enrique (Spanish, European)": "Enrique",
    "Conchita (Spanish, European)": "Conchita",
    "Mia (Spanish, Mexican)": "Mia",
    "Rosalinda (Spanish, Castilian)": "es-ES-Standard-A",
    "Brian (English, British)": "Brian",
    "Amy (English, British)": "Amy",
    "Emma (English, British)": "Emma",
    "Geraint (English, Welsh)": "Geraint",
    "Russell (English, Australian)": "Russell",
    "Nicole (English, Australian)": "Nicole",
    "Joey (English, American)": "Joey",
    "Justin (English, American)": "Justin",
    "Matthew (English, American)": "Matthew",
    "Ivy (English, American)": "Ivy",
    "Joanna (English, American)": "Joanna",
    "Kendra (English, American)": "Kendra",
    "Kimberly (English, American)": "Kimberly",
    "Salli (English, American)": "Salli",
    "Raveena (English, Indian)": "Raveena",
    "Zhiyu (Chinese, Mandarin)": "Zhiyu",
    "Mads (Danish)": "Mads",
    "Naja (Danish)": "Naja",
    "Ruben (Dutch)": "Ruben",
    "Lotte (Polly) (Dutch)": "Lotte",
    "Mathieu (French)": "Mathieu",
    "Céline (French)": "Celine",
    "Chantal (French, Canadian)": "Chantal",
    "Hans (German)": "Hans",
    "Marlene (German)": "Marlene",
    "Vicki (German)": "Vicki",
    "Aditi (+English) (Hindi)": "Aditi",
    "Karl (Icelandic)": "Karl",
    "Dóra (Icelandic)": "Dora",
    "Carla (Italian)": "Carla",
    "Bianca (Italian)": "Bianca",
    "Giorgio (Italian)": "Giorgio",
    "Takumi (Japanese)": "Takumi",
    "Mizuki (Japanese)": "Mizuki",
    "Seoyeon (Korean)": "Seoyeon",
    "Liv (Norwegian)": "Liv",
    "Ewa (Polish)": "Ewa",
    "Maja (Polish)": "Maja",
    "Jacek (Polish)": "Jacek",
    "Jan (Polish)": "Jan",
    "Ricardo (Portuguese, Brazilian)": "Ricardo",
    "Vitória (Portuguese, Brazilian)": "Vitoria",
    "Cristiano (Portuguese, European)": "Cristiano",
    "Inês (Portuguese, European)": "Ines",
    "Carmen (Romanian)": "Carmen",
    "Maxim (Russian)": "Maxim",
    "Tatyana (Russian)": "Tatyana",
    "Astrid (Swedish)": "Astrid",
    "Filiz (Turkish)": "Filiz",
    "Gwyneth (Welsh)": "Gwyneth",
    "Carter (English, American)": "en-US-Wavenet-A",
    "Paul (English, American)": "en-US-Wavenet-B",
    "Evelyn (English, American)": "en-US-Wavenet-C",
    "Liam (English, American)": "en-US-Wavenet-D",
    "Jasmine (English, American)": "en-US-Wavenet-E",
    "Madison (English, American)": "en-US-Wavenet-F",
    "Mark (English, American)": "en-US-Standard-B",
    "Vanessa (English, American)": "en-US-Standard-C",
    "Zachary (English, American)": "en-US-Standard-D",
    "Audrey (English, American)": "en-US-Standard-E",
    "Layla (English, British)": "en-GB-Standard-A",
    "Ali (English, British)": "en-GB-Standard-B",
    "Scarlett (English, British)": "en-GB-Standard-C",
    "Oliver (English, British)": "en-GB-Standard-D",
    "Bella (English, British)": "en-GB-Wavenet-A",
    "John (English, British)": "en-GB-Wavenet-B",
    "Victoria (English, British)": "en-GB-Wavenet-C",
    "Ron (English, British)": "en-GB-Wavenet-D",
    "Zoe (English, Australian)": "en-AU-Standard-A",
    "Luke (English, Australian)": "en-AU-Standard-B",
    "Samantha (English, Australian)": "en-AU-Wavenet-A",
    "Steve (English, Australian)": "en-AU-Wavenet-B",
    "Courtney (English, Australian)": "en-AU-Wavenet-C",
    "Jayden (English, Australian)": "en-AU-Wavenet-D",
    "Ashleigh (English, Australian)": "en-AU-Standard-C",
    "Daniel (English, Australian)": "en-AU-Standard-D",
    "Anushri (English, Indian)": "en-IN-Wavenet-A",
    "Sundar (English, Indian)": "en-IN-Wavenet-B",
    "Satya (English, Indian)": "en-IN-Wavenet-C",
    "Sonya (Afrikaans)": "af-ZA-Standard-A",
    "Aisha (Arabic)": "ar-XA-Wavenet-A",
    "Ahmad 1 (Arabic)": "ar-XA-Wavenet-B",
    "Ahmad 2 (Arabic)": "ar-XA-Wavenet-C",
    "Nikolina (Bulgarian)": "bg-bg-Standard-A",
    "Li Na (Chinese, Mandarin)": "cmn-CN-Wavenet-A",
    "Wang (Chinese, Mandarin)": "cmn-CN-Wavenet-B",
    "Bai (Chinese, Mandarin)": "cmn-CN-Wavenet-C",
    "Mingli (Chinese, Mandarin)": "cmn-CN-Wavenet-D",
    "Silvia (Czech)": "cs-CZ-Wavenet-A",
    "Marie (Danish)": "da-DK-Wavenet-A",
    "Annemieke (Dutch)": "nl-NL-Standard-A",
    "Eva (Dutch)": "nl-NL-Wavenet-A",
    "Lars (Dutch)": "nl-NL-Wavenet-B",
    "Marc (Dutch)": "nl-NL-Wavenet-C",
    "Verona (Dutch)": "nl-NL-Wavenet-D",
    "Lotte (Wavenet) (Dutch)": "nl-NL-Wavenet-E",
    "Tala (Filipino (Tagalog))": "fil-PH-Wavenet-A",
    "Marianne (Finnish)": "fi-FI-Wavenet-A",
    "Yvonne (French)": "fr-FR-Standard-C",
    "Gaspard (French)": "fr-FR-Standard-D",
    "Emilie (French)": "fr-FR-Wavenet-A",
    "Marcel (French)": "fr-FR-Wavenet-B",
    "Brigitte (French)": "fr-FR-Wavenet-C",
    "Simon (French)": "fr-FR-Wavenet-D",
    "Juliette (French, Canadian)": "fr-CA-Standard-A",
    "Felix (French, Canadian)": "fr-CA-Standard-B",
    "Camille (French, Canadian)": "fr-CA-Standard-C",
    "Jacques (French, Canadian)": "fr-CA-Standard-D",
    "Karolina (German)": "de-DE-Standard-A",
    "Albert (German)": "de-DE-Standard-B",
    "Angelika (German)": "de-DE-Wavenet-A",
    "Oskar (German)": "de-DE-Wavenet-B",
    "Nina (German)": "de-DE-Wavenet-C",
    "Sebastian (German)": "de-DE-Wavenet-D",
    "Thalia (Greek)": "el-GR-Wavenet-A",
    "Sneha (Hindi)": "hi-IN-Wavenet-A",
    "Arnav (Hindi)": "hi-IN-Wavenet-B",
    "Aadhav (Hindi)": "hi-IN-Wavenet-C",
    "Ishtevan (Hungarian)": "hu-HU-Wavenet-A",
    "Helga (Icelandic)": "is-is-Standard-A",
    "Anisa (Indonesian)": "id-ID-Wavenet-A",
    "Budi (Indonesian)": "id-ID-Wavenet-B",
    "Bayu (Indonesian)": "id-ID-Wavenet-C",
    "Gianna (Italian)": "it-IT-Standard-A",
    "Valentina (Italian)": "it-IT-Wavenet-A",
    "Stella (Italian)": "it-IT-Wavenet-B",
    "Alessandro (Italian)": "it-IT-Wavenet-C",
    "Luca (Italian)": "it-IT-Wavenet-D",
    "Koharu (Japanese)": "ja-JP-Standard-A",
    "Miho (Japanese)": "ja-JP-Wavenet-A",
    "Eiko (Japanese)": "ja-JP-Wavenet-B",
    "Haruto (Japanese)": "ja-JP-Wavenet-C",
    "Eichi (Japanese)": "ja-JP-Wavenet-D",
    "Heosu (Korean)": "ko-KR-Standard-A",
    "Grace (Korean)": "ko-KR-Wavenet-A",
    "Juris (Latvian)": "lv-lv-Standard-A",
    "Nora (Norwegian, Bokmål)": "nb-no-Wavenet-E",
    "Malena (Norwegian, Bokmål)": "nb-no-Wavenet-A",
    "Jacob (Norwegian, Bokmål)": "nb-no-Wavenet-B",
    "Thea (Norwegian, Bokmål)": "nb-no-Wavenet-C",
    "Aksel (Norwegian, Bokmål)": "nb-no-Wavenet-D",
    "Amelia (Polish)": "pl-PL-Wavenet-A",
    "Stanislaw (Polish)": "pl-PL-Wavenet-B",
    "Tomasz (Polish)": "pl-PL-Wavenet-C",
    "Klaudia (Polish)": "pl-PL-Wavenet-D",
    "Beatriz (Portuguese, Portugal)": "pt-PT-Wavenet-A",
    "Francisco (Portuguese, Portugal)": "pt-PT-Wavenet-B",
    "Lucas (Portuguese, Portugal)": "pt-PT-Wavenet-C",
    "Carolina (Portuguese, Portugal)": "pt-PT-Wavenet-D",
    "Alice (Portuguese, Brazilian)": "pt-BR-Standard-A",
    "Маша (Masha) (Russian)": "ru-RU-Wavenet-A",
    "Илья (Ilya) (Russian)": "ru-RU-Wavenet-B",
    "Алёна (Alena) (Russian)": "ru-RU-Wavenet-C",
    "Пётр (Petr) (Russian)": "ru-RU-Wavenet-D",
    "Aleksandra (Serbian)": "sr-rs-Standard-A",
    "Eliska (Slovak)": "sk-SK-Wavenet-A",
    "Elsa (Swedish)": "sv-SE-Standard-A",
    "Zehra (Turkish)": "tr-TR-Standard-A",
    "Yagmur (Turkish)": "tr-TR-Wavenet-A",
    "Mehmet (Turkish)": "tr-TR-Wavenet-B",
    "Miray (Turkish)": "tr-TR-Wavenet-C",
    "Elif (Turkish)": "tr-TR-Wavenet-D",
    "Enes (Turkish)": "tr-TR-Wavenet-E",
    "Vladislava (Ukrainian)": "uk-UA-Wavenet-A",
    "Linh (Vietnamese)": "vi-VN-Wavenet-A",
    "Nguyen (Vietnamese)": "vi-VN-Wavenet-B",
    "Phuong (Vietnamese)": "vi-VN-Wavenet-C",
    "Viet (Vietnamese)": "vi-VN-Wavenet-D",
    "Linda (English, Canadian)": "Linda",
    "Heather (English, Canadian)": "Heather",
    "Sean (English, Irish)": "Sean",
    "Hoda (Arabic, Egypt)": "Hoda",
    "Naayf (Arabic, Saudi Arabia)": "Naayf",
    "Ivan (Bulgarian)": "Ivan",
    "Herena (Catalan)": "Herena",
    "Tracy (Chinese, Cantonese, Traditional)": "Tracy",
    "Danny (Chinese, Cantonese, Traditional)": "Danny",
    "Huihui (Chinese, Mandarin, Simplified)": "Huihui",
    "Yaoyao (Chinese, Mandarin, Simplified)": "Yaoyao",
    "Kangkang (Chinese, Mandarin, Simplified)": "Kangkang",
    "HanHan (Chinese, Taiwanese, Traditional)": "HanHan",
    "Zhiwei (Chinese, Taiwanese, Traditional)": "Zhiwei",
    "Matej (Croatian)": "Matej",
    "Jakub (Czech)": "Jakub",
    "Guillaume (French, Switzerland)": "Guillaume",
    "Michael (German, Austria)": "Michael",
    "Karsten (German, Switzerland)": "Karsten",
    "Stefanos (Greek)": "Stefanos",
    "Szabolcs (Hungarian)": "Szabolcs",
    "Andika (Indonesian)": "Andika",
    "Heidi (Finnish)": "Heidi",
    "Kalpana (Hindi)": "Kalpana",
    "Hemant (Hindi)": "Hemant",
    "Rizwan (Malay)": "Rizwan",
    "Filip (Slovak)": "Filip",
    "Lado (Slovenian)": "Lado",
    "Valluvar (Tamil, India)": "Valluvar",
    "Pattara (Thai)": "Pattara",
    "An (Vietnamese)": "An",
};
const VOICE_LIST_ALT = Object.keys(VOICE_LIST).map(k => VOICE_LIST[k]);
var voiceSelect = document.createElement('select');
Object.keys(VOICE_LIST).forEach(function(key) {
    var option = document.createElement('option');
    option.text = key;
    option.value = VOICE_LIST[key];
    voiceSelect.appendChild(option);
});
document.addEventListener('DOMContentLoaded', (event) => {
    var voiceSelectContainer = document.getElementById('voiceSelectContainer');
    voiceSelectContainer.appendChild(voiceSelect);
});

console.log('Voz seleccionada:', voiceSelect.value);
voiceSelect.addEventListener('change', function() {
    fetchAudio(voiceSelect.value);
});
let isReading = false;
let cache = [];
let lastText = "";
let lastComment = '';
let lastCommentTime = 0;


function enviarMensaje(message) {

    // Enviar el mensaje
    fetch("http://localhost:8911/api/v2/chat/message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ "Message": message, "Platform": "Twitch", "SendAsStreamer": true })
        })
        .then(function(response) {
            if (response.ok) {}
        })
        .catch(function(error) {
            console.error('Error al enviar el mensaje:', error);
        });

    lastComment = message;
    lastCommentTime = Date.now();
}
class Queue {
    constructor() {
        this.items = [];
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
}

function leerMensajes(text) {
    if (text && !isReading) {
        fetchAudio(text).then(audioUrl => {
            if (audioUrl) {
                audioqueue.enqueue(audioUrl);
                if (!isPlaying) kickstartPlayer();
            }
        });
    }
}

let audioQueue = [];
let lastReadText = null;
let audioMap = {};
let audioKeys = [];
let lastSelectedVoice = null;

function calculatePercentageOfAlphabets(text) {
    let alphabetCount = 0;
    for (let i = 0; i < text.length; i++) {
        if (/^[a-z]$/i.test(text[i])) {
            alphabetCount++;
        }
    }
    return (alphabetCount / text.length) * 100;
}
let lastTwoSelectedVoices = [null, null];

async function fetchAudio(txt) {
    try {
        // Si el texto es igual al último texto leído, simplemente retornar
        if (txt === lastReadText) {
            return;
        }

        // Actualizar el último texto leído
        lastReadText = txt;

        // Si el audio ya existe en el mapa, usarlo
        if (audioMap[txt]) {
            return audioMap[txt];
        }

        // Si menos del 80% del texto está en el rango de 'a' a 'z', usar la voz anterior que es distinta a la actual
        // Si menos del 80% del texto está en el rango de 'a' a 'z', usar la segunda voz anterior que sea distinta a la actual
        let selectedVoice;
        if (calculatePercentageOfAlphabets(txt) < 80) {
            selectedVoice = lastTwoSelectedVoices[1];
        } else {
            // Seleccionar una nueva voz que no sea la última voz seleccionada ni la segunda voz anterior
            do {
                selectedVoice = selectVoice(language);
            } while (selectedVoice === lastSelectedVoice || selectedVoice === lastTwoSelectedVoices[1]);
            lastTwoSelectedVoices[0] = lastSelectedVoice;
            lastTwoSelectedVoices[1] = selectedVoice;
            lastSelectedVoice = selectedVoice;
        }

        // Si el audio no existe en el mapa, solicitar un nuevo audio
        const resp = await fetch(TTS_API_ENDPOINT + makeParameters({ voice: selectedVoice, text: txt }));
        if (resp.status !== 200) {
            console.error("Mensaje incorrecto");
            return;
        }

        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Agregar el nuevo audio al mapa
        audioMap[txt] = blobUrl;
        audioKeys.push(txt);

        // Si el mapa tiene más de 30 audios, eliminar el audio más antiguo
        if (audioKeys.length > 30) {
            const keyToRemove = audioKeys.shift();
            delete audioMap[keyToRemove];
        }

        return blobUrl;
    } catch (error) {
        console.error("Error fetchaudio:", error);
    }
}

function makeParameters(params) {
    return Object.keys(params)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&');
}

function skipAudio() {
    audio.pause();
    audio.currentTime = 0;

    // If the queue is not empty, dequeue the next audio and start playing it
    if (!audioqueue.isEmpty()) {
        audio.src = audioqueue.dequeue();
        audio.load();
        audio.play();
    } else {
        isPlaying = true;
        audio.src = audioqueue.dequeue();
        audio.load();
        audio.play();
    }
}

function kickstartPlayer() {
    // If the queue is empty, do nothing
    if (audioqueue.isEmpty()) {
        isPlaying = false;
        return;
    }

    // Dequeue the first text from the queue and fetch its audio
    isPlaying = true;
    const audioUrl = audioqueue.dequeue();
    audio.src = audioUrl;
    audio.load();
    audio.play().catch(() => {
        // If there is an error while playing the audio, try to play the next audio in the queue
        kickstartPlayer();
    });

    // When the audio ends, try to play the next audio in the queue
    audio.onended = function() {
        kickstartPlayer();
    };
}
// Crear una base de datos IndexedDB
let openRequest = indexedDB.open("audioDB", 1);

openRequest.onupgradeneeded = function() {
    let db = openRequest.result;
    if (!db.objectStoreNames.contains('audios')) {
        db.createObjectStore('audios');
    }
}

openRequest.onerror = function() {
    console.error("Error", openRequest.error);
};

openRequest.onsuccess = function() {
    let db = openRequest.result;
    db.onversionchange = function() {
        db.close();
        alert("La base de datos está obsoleta, por favor, recargue la página.");
    };
};

// Guardar un audio en la base de datos
function saveAudio(audioName, audioData) {
    let db = openRequest.result;
    let transaction = db.transaction("audios", "readwrite");
    let audios = transaction.objectStore("audios");
    let request = audios.put(audioData, audioName);

    request.onsuccess = function() {
        console.log("Audio guardado con éxito.");
    };

    request.onerror = function() {
        console.log("Error al guardar el audio.", request.error);
    };
}

// Obtener un audio de la base de datos
function getAudio(audioName) {
    let db = openRequest.result;
    let transaction = db.transaction("audios", "readonly");
    let audios = transaction.objectStore("audios");
    let request = audios.get(audioName);

    request.onsuccess = function() {
        if (request.result) {
            console.log("Audio encontrado.");
            playAudio(request.result);
        } else {
            console.log("No se encontró el audio.");
        }
    };

    request.onerror = function() {
        console.log("Error al obtener el audio.", request.error);
    };
}

// Reproducir un audio
function playAudio(audioData) {
    let audio = new Audio(audioData);
    audio.play();
}


function isValidUrl(string) {
    try {
        new URL(string);
    } catch (_) {
        return false;
    }

    return true;
}

document.addEventListener('DOMContentLoaded', function() {
    let soundList = document.getElementById('soundList');

    // Load existing sounds
    for (let i = 0; i < localStorage.length; i++) {
        let giftName = localStorage.key(i);
        addSoundToList(giftName, soundList);
    }

    soundList.addEventListener('click', function(event) {
        if (event.target.matches('.deleteButton')) {
            handleDelete(event);
        } else if (event.target.matches('.renameButton')) {
            handleRename(event);
        }
        event.stopPropagation(); // Stop event propagation
    });

    // Hide soundList when clicking outside of it
    document.addEventListener('click', function() {
        soundList.style.display = 'none';
    });
});
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('soundForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Evita que el formulario se envíe y la página se recargue
        let soundFiles = document.getElementById('soundFiles').files;
        for (let i = 0; i < soundFiles.length; i++) {
            let soundFile = soundFiles[i];
            let reader = new FileReader();
            reader.onload = function(e) {
                let soundData = e.target.result;
                let soundName = soundFile.name;
                localStorage.setItem(soundName, soundData);
                addSoundToList(soundName, document.getElementById('soundList'));
            };
            reader.readAsDataURL(soundFile);
        }
    });
});

function addSoundToList(giftName, soundList) {
    let listItem = document.createElement('li');
    listItem.textContent = giftName;

    let deleteButton = document.createElement('button');
    deleteButton.textContent = 'X';
    deleteButton.className = 'deleteButton';

    let renameButton = document.createElement('button');
    renameButton.textContent = 'Renombrar';
    renameButton.className = 'renameButton';

    let playButton = document.createElement('button'); // Crear el botón de reproducción
    playButton.textContent = '';
    playButton.className = 'playButton';
    playButton.addEventListener('click', function() { // Agregar un controlador de eventos al botón
        playSound(giftName);
    });

    listItem.prepend(playButton); // Agregar el botón de reproducción al elemento de la lista
    listItem.prepend(renameButton);
    listItem.prepend(deleteButton);
    soundList.appendChild(listItem);
}

function handleDelete(event) {
    let giftName = event.target.parentElement.dataset.giftName; // Obtener el nombre del sonido del atributo de datos
    if (confirm('¿Estás seguro de que quieres eliminar este sonido?')) {
        localStorage.removeItem(giftName);
        event.target.parentElement.remove();
    }
}

function handleRename(event) {
    let listItem = event.target.parentElement;
    let giftName = listItem.dataset.giftName; // Obtener el nombre del sonido del atributo de datos
    let newName = prompt('Introduce el nuevo nombre para el sonido:', giftName);
    if (newName && newName !== giftName) {
        let audioSrc = localStorage.getItem(giftName);
        localStorage.removeItem(giftName);
        localStorage.setItem(newName, audioSrc);
        listItem.dataset.giftName = newName; // Actualizar el nombre del sonido en el atributo de datos
        listItem.firstChild.textContent = newName; // Actualizar el texto del elemento de la lista
    }
}

function playSound(giftName) {
    // Convertir el nombre del regalo a minúsculas
    let lowerCaseGiftName = giftName.toLowerCase();
    let audioSrc = localStorage.getItem(giftName);
    let audio = new Audio(audioSrc);
    // Buscar en el almacenamiento local un sonido que contenga el nombre del regalo en su nombre
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);

        // Convertir la clave a minúsculas antes de hacer la comparación
        if (key.toLowerCase().includes(lowerCaseGiftName)) {
            let audioSrc = localStorage.getItem(key);

            // Agregar el audio a la cola de audioqueue
            audioqueue.enqueue(audioSrc);

            // Si el audio no está reproduciéndose, iniciar el reproductor
            if (!isPlaying) {
                kickstartPlayer();
            }
        }
    }
}

let lastAudioSrc = null; // Variable para almacenar el último audio añadido a la cola

function playSoundByText(text) {
    // Convertir el texto a minúsculas
    let lowerCaseText = text.toLowerCase();

    // Verificar si el texto tiene una longitud mínima y máxima
    let minLength = 1; // Define tu longitud mínima aquí
    let maxLength = 20; // Define tu longitud máxima aquí
    if (lowerCaseText.length < minLength || lowerCaseText.length > maxLength) {
        return;
    }
    // Buscar en el almacenamiento local un sonido que contenga el texto en su nombre
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);

        // Convertir la clave a minúsculas antes de hacer la comparación
        if (key.toLowerCase().includes(lowerCaseText)) {
            let audioSrc = localStorage.getItem(key);

            // Si el audio es el mismo que el último añadido a la cola, no lo añade
            if (audioSrc === lastAudioSrc) {
                console.log('El audio es el mismo que el último añadido a la cola');
                return;
            }

            console.log('audio al texto:', text);

            // Agregar el audio a la cola de audioqueue
            audioqueue.enqueue(audioSrc);
            lastAudioSrc = audioSrc; // Actualizar el último audio añadido a la cola

            // Si el audio no está reproduciéndose, iniciar el reproductor
            if (!isPlaying) {
                kickstartPlayer();
            }

            // Salir de la función después de encontrar el primer audio que coincide
            return;
        }
    }
}

function exportSettings() {
    // Convertir las configuraciones y sonidos a una cadena JSON
    let settings = JSON.stringify(localStorage);

    // Crear un elemento 'a' invisible
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(settings));
    element.setAttribute('download', 'settings.json');

    // Simular un click en el elemento 'a' para descargar el archivo
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function importSettings() {
    // Show the loading indicator
    document.getElementById('loadingIndicator').style.display = 'inline';

    // Read the file uploaded by the user
    let file = document.getElementById('importButton').files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            // Parse the file content to a JavaScript object
            let settings = JSON.parse(e.target.result);

            // Store the settings and sounds in localStorage
            for (let key in settings) {
                localStorage.setItem(key, settings[key]);
            }

            // Hide the loading indicator
            document.getElementById('loadingIndicator').style.display = 'none';
        };
        reader.readAsText(file);
    } else {
        // Hide the loading indicator
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

const sentData = new Set(); // Conjunto para almacenar los datos enviados

async function sendToServer(eventType, data, text, color, msg, message) {
  const ports = [3000, 3001];
  let retryCount = 0;
  let lastRetryTimestamp = 0;

  // Función para verificar si el servidor está disponible
  async function isServerAvailable(port) {
    return new Promise((resolve) => {
      setTimeout(async () => {
          const response = await fetch(`http://localhost:${port}/api/health`);
          if (response.ok) {
            resolve(true);
          } else {
            resolve(false);
          }
      }, 5000); // Retraso de 5 segundos (ajusta el valor según tus necesidades)
    });
  }

  // Verificar si ha pasado al menos un minuto desde el último intento
  const currentTimestamp = Date.now();
  if (currentTimestamp - lastRetryTimestamp >= 60000) {
    retryCount = 0; // Reiniciar el conteo de intentos si ha pasado un minuto
  }

  // Hacer hasta 20 intentos en un minuto
  while (retryCount < 2) {
    let serverAvailable = false;

    for (const port of ports) {
      serverAvailable = await isServerAvailable(port);

      if (serverAvailable) {
        const dataKey = JSON.stringify({ eventType, data, text, color, msg, message });

        // Verificar si los datos ya se enviaron previamente
        if (sentData.has(dataKey)) {
          continue;
        }

        try {
          const response = await fetch(`http://localhost:${port}/api/receive`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ eventType, data, text, color, msg, message }),
          });

          if (response.ok) {
            sentData.add(dataKey); // Agregar los datos al conjunto de datos enviados
            const responseData = await response.json();
            console.log(responseData);
          } else {
            console.error(`Server on port ${port} status: ${response.status}`);
          }
        } catch (error) {
          console.error(`Error sending data to server on port ${port}:`, error);
        }
      }
    }

    // Reiniciar el conteo de intentos si se ha establecido la conexión
    retryCount = 0;
    lastRetryTimestamp = 0;

  }

  lastRetryTimestamp = currentTimestamp; // Registrar la marca de tiempo del último intento
  retryCount = 0; // Reiniciar el conteo de intentos después de la pausa
}

window.onload = async function() {
    try {
        audio = document.getElementById("audio");
        skip = document.getElementById("skip-button");
        isPlaying = false;
        audioqueue = new Queue();

        if (skip) {
            skip.onclick = skipAudio;
        } else {
            console.error("Error: skip-button is undefined");
        }

        if (audio) {
            audio.addEventListener("ended", kickstartPlayer);
        } else {
            console.error("Error: audio is undefined");
        }

    } catch (error) {
        console.error("Error:", error);
    }
};