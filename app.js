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

function connect() {
    let uniqueId = window.settings.username || $('#uniqueIdInput').val();
    if (uniqueId !== '') {
        $('#stateText').text('Conectando...');
        $('#connectButton').prop('disabled', true);

        connection.connect(uniqueId, {
            enableExtendedGiftInfo: true
        }).then(state => {
            $('#stateText').text(`Conectado a la sala ${state.roomId}`);

            // Habilitar el botón después de establecer la conexión
            $('#connectButton').prop('disabled', false);

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
        alert('No se ingresó nombre de usuario');
    }
}

// Prevent Cross site scripting (XSS)
function sanitize(text) {
    return text.replace(/</g, '&lt;')
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

    const specialChars = /[#$%^&*()/,.?":{}|<>]/;
    const startsWithSpecialChar = specialChars.test(text.charAt(0));
    const messagePrefix = startsWithSpecialChar ? "!" : "";
    const messageSuffix = summarize ? "" : ` ${text}`;

    // Modificación para eliminar o reemplazar los caracteres especiales
    let cleanedText = text;
    if (startsWithSpecialChar) {
        cleanedText = text.replace(/[@#$%^&*()/,.?":{}|<>]/, ""); // Elimina o reemplaza los caracteres especiales al comienzo del texto con "!"
    }

    const message = messagePrefix + (cleanedText.length > 50 ? `${data.uniqueId} dice ${messageSuffix}` : cleanedText);

    enviarMensaje(message);

    container.stop();
    container.animate({
        scrollTop: container[0].scrollHeight
    }, 400);
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
    cacheMessage(text);
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

    let html = `
      <div data-streakid=${isPendingStreak(data) ? streakId : ''}>
          <img class="miniprofilepicture" src="${data.profilePictureUrl}">
          <span>
              <b>${generateUsernameLink(data)}:</b> <span><span style="color: ${data.giftName ? 'purple' : 'black'}">${data.giftName}</span></span></span><br>
              <div>
                  <table>
                      <tr>
                          <td><img class="gifticon" src="${data.giftPictureUrl}"></td>
                          <td>
                              <span><b style="${isPendingStreak(data) ? 'color:red' : ''}">x${data.repeatCount.toLocaleString()} : ${(data.diamondCount * data.repeatCount).toLocaleString()} Diamantes </b><span><br>
                          </td>
                      </tr>
                  </tabl>
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
    obtenerComandosYEnviarMensaje(data.giftName, "");

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

// like stats
connection.on('like', (msg) => {
    if (typeof msg.totalLikeCount === 'number') {
        likeCount = msg.totalLikeCount;
        updateRoomStats();

        // Check if the like count has reached a multiple of 10, 100, 1000, etc.
        if (likeCount % 500 === 0 && likeCount !== previousLikeCount) {
            previousLikeCount = likeCount;
            const likeMessage = `${likeCount} likes.`;
            enviarMensaje(likeMessage);
        }
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
        // Si el mensaje ya ha sido procesado hace menos de
        return;
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
    let messageRate = 1000 / (currentTime - lastCommentTime);
    lastCommentTime = currentTime;

    // Check the repetition count
    if (!messageRepetitions[msg.comment]) {
        messageRepetitions[msg.comment] = 0;
    }
    messageRepetitions[msg.comment]++;

    // If the message rate is high and the message has been repeated many times, filter it
    if (messageRate > 1 && messageRepetitions[msg.comment] > 5) {
        return;
    }

    addChatItem('', msg, msg.comment);
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
connection.on('social', (data) => {
    if (window.settings.showFollows === "0") return;

    let color = data.displayType.includes('follow') ? '#CDA434' : '#CDA434';
    if (data.displayType.includes('follow')) {
        data.label = `${data.uniqueId} Te sigue`;
    }
    if (data.displayType.includes('share')) {
        data.label = `${data.uniqueId} compartió el directo`;
    }

    addChatItem(color, data, data.label.replace('{0:user}', ''));
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

function obtenerComandosYEnviarMensaje(giftname, message = "", isGift = false) {
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
                    const comandosEncontrados = listaComandos.filter(cmd => cmd.Name.toLowerCase().includes(giftname.toLowerCase()));                    if (comandosEncontrados.length === 0) {
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
const palabrasSpam = ['@'];

function enviarMensaje(message) {
    if (shouldSendMessage(message)) {
        if (!containspalabrasSpam(message)) {
            // Enviar el mensaje
            fetch("http://localhost:8911/api/v2/chat/message", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ "Message": message, "Platform": "Twitch", "SendAsStreamer": true })
                })
                .then(function(response) {
                    if (response.ok) {
                        leerMensajes();
                    }
                })
                .catch(function(error) {
                    console.error('Error al enviar el mensaje:', error);
                });

            lastComment = message;
            lastCommentTime = Date.now();
        }
    }
}

function shouldSendMessage(message) {
    return (
        message !== lastComment &&
        !containspalabrasSpam(message)
    );

}

function containspalabrasSpam(message) {
    const palabrasSpam = JSON.parse(localStorage.getItem('palabrasSpam')) || [];
    return palabrasSpam.some(word => message.includes(word));
}

function cacheMessage(text) {
    if (text.length >= 1 && text.length <= 400 && text !== lastText) {
        cache.push(text);
        lastText = text;
    }
    if (cache.length > 3) {
        cache.shift(); 
    }
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

function cacheMessage(text) {
    if (text.length >= 1 && text.length <= 400 && text !== lastText) {
        cache.push(text);
        lastText = text;
    }
    if (cache.length > 15) {
        cache.shift();
    }
}

function filtros(text) {
    // Apply the filter only if there are more than 3 messages in the queue
    if (cache.length > 1) { 
        if (cache.includes(text) || palabrasSpam.some(word => text.includes(word))) {
            return false;
        }
    }
    if (text.length >= 1 && text.length <= 400 && text !== lastText) {
        cache.push(text);
        lastText = text;
    }
    if (cache.length > 15) {
        cache.shift();
    }
    return true;
}

function leerMensajes() {
    if (cache.length > 0 && !isReading) {
        const text = cache.shift();
        const nextText = cache[0];

        // Comprobar si el mensaje es igual a los 5 anteriores
        const similarMessages = readMessages.filter(msg => msg === text).length;
        const isRepeated = similarMessages >= 5;

        if (!isRepeated && text !== nextText) {
            fetchAudio(text);
        }
    }
}

const readMessages = [];

async function fetchAudio(txt, voice) {
    try {
        if (!filtros(txt)) {
            return;
        }

        const selectedVoice = selectVoice(language);
        const resp = await fetch(TTS_API_ENDPOINT + makeParameters({ voice: selectedVoice, text: txt }));
        if (resp.status !== 200) {
            console.error("Mensaje incorrecto");
            return;
        }

        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        if (audioqueue) {
            audioqueue.enqueue(blobUrl);
            if (!isPlaying) kickstartPlayer();
        }
        const index = cache.indexOf(txt);
        if (index !== -1) {
            cache.splice(index, 1);
        }

        // Elimina el mensaje de cache una vez que se ha reproducido
        const interval = setInterval(() => {
            if (audio.ended) {
                clearInterval(interval);
                URL.revokeObjectURL(blobUrl);
            }
        }, 200); // Verifica cada segundo si el audio ha terminado de reproducirse

        readMessages.push(txt);
        if (readMessages.length > 5) {
            readMessages.shift(); // Si hay más de 5 mensajes, elimina el más antiguo
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function makeParameters(params) {
    return Object.keys(params)
        .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
        .join('&');
}

function skipAudio() {
    if (audioqueue.isEmpty()) {
        isPlaying = false;
        audio.pause();
    } else {
        isPlaying = true;
        audio.src = audioqueue.dequeue();
        audio.load();
        audio.play();
    }
}

function kickstartPlayer() {
    if (audioqueue.isEmpty()) {
        isPlaying = false;
        audio.pause();
        leerMensajes(); // Leer el próximo mensaje
    } else {
        isPlaying = true;
        audio.src = audioqueue.dequeue();
        audio.load();
        audio.play();
        audioqueue.dequeue();
        readMessages.shift();
    }
}

window.onload = async function() {
    try {
        audio = document.getElementById("audio");
        skip = document.getElementById("skip-button");
        isPlaying = false;
        audioqueue = new Queue();
        leerMensajes();

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