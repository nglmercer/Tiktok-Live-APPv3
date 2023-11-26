// This will use the demo backend if you open index.html locally via file://, otherwise your server will be used
let backendUrl = location.protocol === 'file:' ? "https://tiktok-chat-reader.zerody.one/" : undefined;
let connection = new TikTokIOConnection(backendUrl);
const chatContainer = document.getElementById('chatContainer');
const playButton = document.getElementById('playButton');
// Counter
let viewerCount = 0;
let likeCount = 0;
let diamondsCount = 0;
let previousLikeCount = 0;

// These settings are defined by obs.html
if (!window.settings) window.settings = {};
document.addEventListener('DOMContentLoaded', (event) => {
    const toggleButton = document.getElementById('dn');

    // Check if running in OBS
    if (window.obsstudio) {
        document.body.style.backgroundColor = 'transparent';
    } else {
        // Cargar el tema actual desde localStorage
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme) {
            document.body.className = currentTheme;
            toggleButton.checked = currentTheme === 'theme-dark';
        }

        toggleButton.addEventListener('change', () => {
            if (toggleButton.checked) {
                // Si el botón de alternancia está marcado, aplicar el tema oscuro
                document.body.className = 'theme-dark';
                localStorage.setItem('theme', 'theme-dark');
            } else {
                // Si el botón de alternancia no está marcado, aplicar el tema claro
                document.body.className = 'theme-light';
                localStorage.setItem('theme', 'theme-light');
            }
        });
    }
});
$(document).ready(() => {
    $('#connectButton').click(connect);
    $('#uniqueIdInput').on('keyup', function(e) {
        if (e.key === 'Enter') {
            connect();
        }
    });

    if (window.settings.username) {
        $('#connectButton').prop('disabled', true); // Desactivar el botón hasta que se establezca la conexión
        connect();
    }
});
let isConnected = false;

let currentRoomId = null;
let isReconnecting = false;

function connect() {
    let uniqueId = $('#uniqueIdInput').val();
    isReconnecting = true;
    if (uniqueId !== '') {
        $('#stateText').text('Conectando...');
        $('#connectButton').prop('disabled', true);

        // Si ya está conectado y el uniqueId es diferente, desconectar la conexión actual
        if (isConnected && uniqueId !== currentUniqueId) {
            connection.disconnect();
            isConnected = false;
        }

        // Si no está conectado, establecer una nueva conexión
        if (!isConnected) {
            connection.connect(uniqueId, {
                enableExtendedGiftInfo: true
            }).then(state => {
                if (currentRoomId && currentRoomId === state.roomId) {
                    alert('Ya estás conectado a esta sala');
                    return;
                }
                currentRoomId = state.roomId;
                $('#stateText').text(`Conectado a la sala ${state.roomId}`);

                // Habilitar el botón después de establecer la conexión
                $('#connectButton').prop('disabled', false);
                isConnected = true;
                currentUniqueId = uniqueId; // Guardar el uniqueId actual

            }).catch(errorMessage => {
                $('#stateText').text(errorMessage);

                // programar próximo intento si se establece el nombre de usuario obs
                if (window.settings.username) {
                    setTimeout(() => {
                        connect(window.settings.username);
                    }, 30000);
                }

                // Habilitar el botón en caso de error
                $('#connectButton').prop('disabled', false);
            });
        } else {
            alert('Ya estás conectado');
        }
    } else {
        alert('No se ingresó nombre de usuario');
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
function addChatItem(color, data, text, summarize) {
    let container = location.href.includes('obs.html') ? $('.eventcontainer') : $('.chatcontainer');

    if (container.find('div').length > 500) {
        container.find('div').slice(0, 200).remove();
    }

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

    let filterWords = document.getElementById('filter-words').value.split(' ');
    // Convertir el texto a minúsculas para la comparación
    let lowerCaseText = text.toLowerCase();
    // Verificar si el texto contiene alguna de las palabras para filtrar
    for (let word of filterWords) {
        if (word && lowerCaseText.includes(word.toLowerCase())) {
            console.log('filtrado');
            return;
        }
    }
    const specialChars = /[#$%^&*()/,.?":{}|<>]/;
    const startsWithSpecialChar = specialChars.test(text.charAt(0));
    const messagePrefix = startsWithSpecialChar ? "!" : "";
    const messageSuffix = summarize ? "" : ` ${text}`;

    // Modificación para eliminar o reemplazar los caracteres especiales
    let cleanedText = text;
    if (startsWithSpecialChar) {
        cleanedText = text.replace(/[@#$%^&*()/,.?":{}|<>]/, ""); // Elimina o reemplaza los caracteres especiales al comienzo del texto con "!"
    }

    const message = messagePrefix + (cleanedText.length > 60 ? `${data.uniqueId} dice ${messageSuffix}` : cleanedText);

    enviarMensaje(message);
    leerMensajes(message);
    onMessageReceived(message);
}
// Supongamos que tienes una lista de nombres de videos
let videoNames = ["video1.mp4", "video2.mp4", "video3.mp4"];

function onMessageReceived(message) {
    for (let videoName of videoNames) {
        if (message.includes(videoName)) {
            let video = document.createElement("video");
            video.src = videoName;
            video.style.position = "fixed";
            video.style.zIndex = "1000";
            video.style.width = "100%";
            video.style.height = "100%";
            console.log(videoName);
            document.body.appendChild(video);
            video.play();
            break;
        }
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

function createGiftDiv(data, repeatCount, userId) {
    let giftDiv = document.createElement('div');
    giftDiv.className = 'gift-div';

    if (repeatCount <= 2) {
        // Si repeatCount es 1 o 2, muestra la imagen del perfil
        giftDiv.innerHTML = `
            <img class="profile-picture profile-animation" src="${data.profilePictureUrl}" style="border-radius: 50%;">
            <img class="gift-image gift-animation" src="${data.giftPictureUrl}" style="border-radius: 50%;">`;
    } else if (repeatCount >= 3) {
        // Si repeatCount es mayor que 4, muestra solo la imagen del regalo
        giftDiv.innerHTML = `
            <img class="gift-image gift-animation" src="${data.giftPictureUrl}" style="border-radius: 50%;">`;
    }

    // Reinicia el contador para este usuario
    giftCounters[userId] = 0;

    return giftDiv;
}
let giftCounters = {};
let lastFilteredPositions = [];
let lastFilteredPositionIndex = 0;

function addOverlayEvent(data, text, color, isGift, repeatCount) {
    const eventContainer = document.getElementById('overlayEventContainer');
    let userId = data.profilePictureUrl;
    if (text === lastText) {
        return;
    }

    // Update the last event and last text
    lastEvent = { text, isGift };
    lastText = text;

    let eventDiv = document.createElement('div');
    eventDiv.className = 'event-div'; // Add class



    // Si no es un regalo y no contiene 'sige' ni 'compartió', agregamos la clase 'marquee'
    if (!isGift && !text.includes('sige') && !text.includes('compartió')) {
        eventDiv.className += ' marquee';
        eventDiv.innerHTML = `<span class="event-text text-animation" style="color: ${color};">${text}</span>`;
    }
    if (isGift) {
        let userId = data.profilePictureUrl;
        if (!giftCounters[userId]) {
            giftCounters[userId] = 0;
        }
        if (repeatCount >= 2) {
            giftCounters[userId]++;
        }
        if (giftCounters[userId] % 2 !== 0 || repeatCount < 2) {
            let giftDiv = createGiftDiv(data, repeatCount, userId);
            eventDiv.appendChild(giftDiv);
        }
    } else if (text.includes(`sige`) || text.includes('compartió')) {
        eventDiv.innerHTML = `<img class="profile-picture profile-animation" src="${data.profilePictureUrl}" style="border-radius: 50%;"><span class="event-text text-animation" style="color: ${color};">${text}</span>`;
    } else {
        eventDiv.innerHTML = `<span class="event-text text-animation" style="color: ${color};">${text}</span>`;
    }

    // Get a random position for the div within the container
    let top, left;
    let filterWords = document.getElementById('filter-words').value.split(' ');
    let lowerCaseText = text.toLowerCase();
    let isFiltered = filterWords.some(word => word && lowerCaseText.includes(word.toLowerCase()));
    if (isFiltered && lastFilteredPositions.length > 0) {
        // If the text is filtered and there are last filtered positions, use one of them
        top = lastFilteredPositions[lastFilteredPositionIndex].top;
        left = lastFilteredPositions[lastFilteredPositionIndex].left;
        // Increment the index, and reset it to 0 if it's greater than the length of lastFilteredPositions
        lastFilteredPositionIndex = (lastFilteredPositionIndex + 1) % lastFilteredPositions.length;
    } else {
        // If the text is not filtered or there are no last filtered positions, generate a new one
        ({ top, left } = getRandomPosition(eventContainer, eventDiv, 100));
        if (isFiltered) {
            // If the text is filtered, store the new position
            lastFilteredPositions.push({ top, left });
            if (lastFilteredPositions.length > 5) {
                lastFilteredPositions.shift();
            }
        }
    }
    eventDiv.style.top = `${top}px`;
    eventDiv.style.left = `${left}px`;

    // Add the div to the container
    eventContainer.appendChild(eventDiv);

    // Determine the removal time based on the category
    let removalTime;
    if (isGift) {
        removalTime = 20000; // 30 seconds for gifts
    } else if (text.includes('sige') || text.includes('compartió')) {
        removalTime = 15000; // 20 seconds for 'sige' and 'compartió'
    } else {
        removalTime = 15000; // 10 seconds for everything else
    }

    // Remove the div after the determined time
    setTimeout(() => {
        eventContainer.removeChild(eventDiv);
    }, removalTime);
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
    for (let i = 0; i < 50; i++) {
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

function getRandomPosition() {
    const elementSize = 500; // Define el tamaño del elemento que estás generando

    // If precalculatedPositions is empty, generate a new random position
    if (precalculatedPositions.length === 0) {
        const container = document.getElementById('overlayEventContainer');
        const containerRect = container.getBoundingClientRect();
        return {
            top: Math.random() * (containerRect.height - elementSize), // Resta elementSize del valor aleatorio generado para top
            left: Math.random() * (containerRect.width - elementSize) // Resta elementSize del valor aleatorio generado para left
        };
    }

    // Get a random index from the precalculated positions
    const index = Math.floor(Math.random() * precalculatedPositions.length);
    // Remove the selected position from the array to avoid reusing it
    return precalculatedPositions.splice(index, 1)[0];
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
                          <td><img class="gifticon" src="${giftPictureUrl}"></td>
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

    if (data.repeatCount === 1) {
        obtenerComandosYEnviarMensaje(data.giftName, "");
        addOverlayEvent(data, data.giftPictureUrl, 'red', true, data.repeatCount);
        createGiftDiv(data, data.giftPictureUrl, 'red', true, data.repeatCount);
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
let userLikes = {};
let userTotalLikes = {};

connection.on('like', (msg) => {
    if (typeof msg.totalLikeCount === 'number') {
        likeCount = msg.totalLikeCount;
        updateRoomStats();
    }

    // Increment user's like count
    if (!userLikes[msg.uniqueId]) {
        userLikes[msg.uniqueId] = 0;
    }
    userLikes[msg.uniqueId] += msg.likeCount;

    // Increment user's total like count
    if (!userTotalLikes[msg.uniqueId]) {
        userTotalLikes[msg.uniqueId] = 0;
    }
    userTotalLikes[msg.uniqueId] += msg.likeCount;

    // Check if user's like count has reached 10, 50, 200, 300, 500 or 1000
    // Check if user's like count is a multiple of 10 up to 500
    const likes = userLikes[msg.uniqueId];
    if (likes % 25 === 0 && likes <= 500) {
        obtenerComandosYEnviarMensaje(`${likes}LIKES`, likes);
        console.log(`${likes}LIKES`);
        if (likes >= 500) {
            userLikes[msg.uniqueId] = 0; // Reset user's like count if it reaches 500
        }
    }
});
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
    }, joinMsgDelay);
})
let processedMessages = {};
// New chat comment received
let lastComments = [];
let messageRepetitions = {};

connection.on('chat', (msg) => {
    if (window.settings.showChats === "0") return;

    // Add the new comment to the list
    let now = Date.now();
    if (processedMessages[msg.comment] && now - processedMessages[msg.comment] < 30000) {
        // Si el mensaje ya ha sido procesado hace menos de 30 segundos, no lo envíe
        // a menos que no estemos en el proceso de reconexión
        if (isReconnecting) {
            return;
        }
    }
    // Si el mensaje no ha sido procesado o fue procesado hace más de un minuto,
    // añadirlo a la estructura de datos con la hora actual
    processedMessages[msg.comment] = now;
    lastComments.push(msg.comment);

    // If the list has more than 20 elements, remove the oldest one
    if (lastComments.length > 20) {
        let removedComment = lastComments.shift();
        messageRepetitions[removedComment]--;
        if (messageRepetitions[removedComment] === 0) {
            delete messageRepetitions[removedComment];
        }
    }

    // Calculate the message rate
    let currentTime = Date.now();
    let messageRate = 10000 / (currentTime - lastCommentTime);
    lastCommentTime = currentTime;

    // Check the repetition count
    if (!messageRepetitions[msg.comment]) {
        messageRepetitions[msg.comment] = 0;
    }
    messageRepetitions[msg.comment]++;

    // If the message rate is high and the message has been repeated many times, filter it
    if (messageRate > 1 && messageRepetitions[msg.comment] > 10) {
        return;
    }

    addChatItem('', msg, msg.comment);
    // After processing a message, if we were reconnecting, we're not anymore
    if (isReconnecting) {
        isReconnecting = false;
    }
});

// New gift received
connection.on('gift', (data) => {
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

    if (data.displayType.includes('follow')) {
        color = '#CDA434'; // Cambia esto al color que quieras para los seguidores
        if (!seguidores.has(data.uniqueId)) {
            seguidores.add(data.uniqueId);
            message = `${data.uniqueId} te acaba de seguir`;
            obtenerComandosYEnviarMensaje('follow', "");
        }
    } else if (data.displayType.includes('share')) {
        color = '#CDA434'; // Cambia esto al color que quieras para las comparticiones
        message = `${data.uniqueId} compartió el directo`;
        obtenerComandosYEnviarMensaje('share', "");
    } else {
        color = '#CDA434'; // Color por defecto
        message = data.label.replace('{0:user}', '');
    }

    addChatItem(color, data, message);
});
connection.on('streamEnd', () => {
    $('#stateText').text('Transmisión terminada.');

    // schedule next try if obs username set
    if (window.settings.username) {
        setTimeout(() => {
            connect(window.settings.username);
        }, 30000);
    }
})
let contadorGiftname = {};
let ultimaVezGiftname = {};

function obtenerComandosYEnviarMensaje(giftname, likes, message = "", isGift = false) {
    let ahora = Date.now();

    if (contadorGiftname[giftname] === undefined) {
        contadorGiftname[giftname] = 0;
    } else if (ahora - ultimaVezGiftname[giftname] < 4000 && contadorGiftname[giftname] >= 2) {
        contadorGiftname[giftname]--;
    }

    ultimaVezGiftname[giftname] = ahora;
    contadorGiftname[giftname]++;

    const pageSize = 100; // Cantidad de comandos a devolver por página
    let skip = 0; // Comenzar desde el primer comando

    const listaComandos = [];

    function obtenerPaginaDeComandos() {
        fetch(`http://localhost:8911/api/v2/commands?skip=${skip}&pageSize=${pageSize}`)
            .then(response => response.json())
            .then(data => {
                if (!Array.isArray(data.Commands)) {
                    throw new Error('La respuesta no contiene un array de comandos');
                }

                const comandos = data.Commands;
                listaComandos.push(...comandos);

                // Si hay más comandos, pasar a la siguiente página
                if (comandos.length === pageSize) {
                    skip += pageSize;
                    obtenerPaginaDeComandos();
                } else {
                    // Se han obtenido todos los comandos, imprimirlos
                    listaComandos.forEach(cmd => {});

                    // Buscar el ID del comando según el nombre
                    const comandosEncontrados = listaComandos.filter(cmd => cmd.Name.toLowerCase().includes(giftname.toLowerCase()) || cmd.Name.toLowerCase().includes(`${likes}likes`.toLowerCase()));
                    if (comandosEncontrados.length === 0) {
                        console.error(`No se encontró ningún comando con el nombre que contiene: ${giftname}`);
                        return; // Salir de la función si no se encuentran comandos
                    }

                    // Enviar el mensaje con el ID de cada comando encontrado
                    const chat_message = {
                        Message: message,
                        Platform: "Twitch",
                        SendAsStreamer: true
                    };

                    let index = 0;

                    function enviarMensajeConRetraso() {
                        if (index < comandosEncontrados.length) {
                            const comando = comandosEncontrados[index];
                            fetch(`http://localhost:8911/api/commands/${comando.ID}`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify(chat_message)
                                })
                                .then(function(response) {
                                    if (response.ok) {
                                        // La solicitud se realizó correctamente
                                        // Hacer algo con la respuesta si es necesario
                                    } else {
                                        throw new Error('Error al enviar el mensaje');
                                    }
                                })
                                .catch(function(error) {
                                    console.error('Error al enviar el mensaje:', error);
                                })
                                .finally(function() {
                                    index++;
                                    setTimeout(enviarMensajeConRetraso, 2000); // Esperar 2 segundos antes de enviar el siguiente mensaje
                                });
                        }
                    }

                    enviarMensajeConRetraso();
                }
            })
            .catch(error => {
                console.error('Error al obtener los comandos:', error);
            });
    }

    obtenerPaginaDeComandos(); // Llamada a la función para iniciar la secuencia
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
    "Miguel (Spanish, American)": "Miguel",
    "Penélope (Spanish, American)": "Penelope",
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
    "Enrique (Spanish, European)": "Enrique",
    "Conchita (Spanish, European)": "Conchita",
    "Mia (Spanish, Mexican)": "Mia",
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
    "Rosalinda (Spanish, Castilian)": "es-ES-Standard-A",
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
    leerMensajes(); // Llama a leerMensajes() después de agregar un mensaje a la cola

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

const readMessages = new Set();

async function fetchAudio(txt, voice) {
    try {
        const selectedVoice = selectVoice(language);
        const resp = await fetch(TTS_API_ENDPOINT + makeParameters({ voice: selectedVoice, text: txt }));
        if (resp.status !== 200) {
            console.error("Mensaje incorrecto");
            return;
        }

        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);

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