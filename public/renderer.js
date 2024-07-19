import tab5Action from "./tab5-action/tab5-action.js";
import { loadData, createGiftSelect, getAvailableGifts } from './functions/giftmanager.js';
import { 
    databases, 
    saveDataToIndexedDB, 
    deleteDataFromIndexedDB, 
    updateDataInIndexedDB, 
    loadDataFromIndexedDB, 
    getDataFromIndexedDB, 
    observer 
} from './functions/indexedDB.js';
import { replaceVariables } from "./functions/replaceVariables.js";
import { TTS, leerMensajes, skipAudio } from './functions/tts.js';
import { createElementWithButtons } from "./utils/createtable.js";
import { createFileItemHTML, setupDragAndDrop, handlePlayButton, getfileId} from "./utils/Fileshtml.js";
// Variables globales
let isReading = null;
let copyFiles = [];
let objectModal = null;
const EVENT_TYPES = {
    GIFT: 'gift',
    LIKES: 'likes',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    PROFILE: 'profile'
};

async function eventmanager(eventType, data) {
    const eventsfind = await getDataFromIndexedDB(databases.MyDatabaseActionevent);
    
    for (const eventname of eventsfind) {
        await processEvent(eventname, eventType, data);
    }
}

async function processEvent(eventname, eventType, data) {
    let matched = false;

    for (const [key, value] of Object.entries(eventname)) {
        const splitkey = key.split('-');
        if (splitkey[1] !== eventType) continue;
        if (!value.check) return true;
        console.log(splitkey[1], eventType, value, key);

        switch (eventType) {
            case EVENT_TYPES.GIFT:
                if (processGiftEvent(value, data)) {
                    matched = true;
                    break;
                }
                break;
            case EVENT_TYPES.LIKES:
                if (processLikesEvent(value, data)) {
                    matched = true;
                    break;
                }
                break;
        }

    }
    if (matched) {
        await processMediaTypes(eventname, data);
    }
    // Si no se encontró coincidencia y hay un valor 'default', ejecuta la lógica por defecto
    if (!matched) {
        for (const [key, value] of Object.entries(eventname)) {
            const splitkey = key.split('-');
            if (splitkey[1] !== eventType) continue;
            if (eventType === EVENT_TYPES.GIFT && value.select === 'default') {
                console.log('Ejecutando lógica por defecto para gift');
                // Aquí puedes colocar la lógica adicional que necesites para el caso 'default'
                await processMediaTypes(eventname, data);
                break;
            }
        }
    }
}

function processGiftEvent(value, data) {
    value.select = Number(value.select);
    return value.select === data.giftId;
}

function processLikesEvent(value, data) {
    value.number = Number(value.number) || 2;
    return value.number <= data.likeCount;
}

async function processMediaTypes(eventname, data) {
    const PROCESSED_TYPES = new Set();
    const mediaTypes = [
        { type: EVENT_TYPES.IMAGE, key: "type-imagen" },
        { type: EVENT_TYPES.VIDEO, key: "type-video" },
        { type: EVENT_TYPES.AUDIO, key: "type-audio" },
        { type: EVENT_TYPES.PROFILE, key: "type-profile" }
    ];

    for (const { type, key } of mediaTypes) {
        if (eventname[key] && eventname[key].check && !PROCESSED_TYPES.has(type)) {
            PROCESSED_TYPES.add(type);
            await processMediaType(type, eventname[key], data);
        }
    }
}

async function processMediaType(type, typeData, data) {
    if (type === EVENT_TYPES.PROFILE) {
        await processProfileType(typeData, data);
    } else {
        const srcoverlay = await getfileId(typeData.select);
        if (srcoverlay) {
            await sendOverlayData(srcoverlay, typeData);
        }
    }
}

async function processProfileType(typeData, data) {
    typeData.texto = replaceVariables(typeData.texto, data);
    await sendOverlayData({ path: data.profilePictureUrl, type: "image/png" }, typeData, true);
}

async function sendOverlayData(srcoverlay, options, isProfile = false) {
    await window.api.createOverlayWindow();
    await window.api.sendOverlayData('play', { 
        src: srcoverlay.path, 
        fileType: srcoverlay.type, 
        options 
    }, isProfile);
}
async function getFiles() {
    try {
        const files = await window.api.getFilesInFolder();
        copyFiles = [...files];
        return files;
    } catch (error) {
        console.error('Error fetching files:', error);
        return [];
    }
}

function populateVoiceList() {
    if (typeof speechSynthesis === "undefined") return;
    
    const voices = speechSynthesis.getVoices();
    const voiceSelect = document.getElementById("voiceSelect");
    
    voices.forEach(voice => {
        const option = document.createElement("option");
        option.textContent = `${voice.name} (${voice.lang})`;
        option.setAttribute("data-lang", voice.lang);
        option.setAttribute("data-name", voice.name);
        voiceSelect.appendChild(option);
    });
}
  
window.speechSynthesis.onvoiceschanged = function() {
populateVoiceList();
}
  
async function getFileById(fileId) {
    return window.api.getFileById(fileId);
}
async function handleleermensaje(text) {
    const selectedVoice = document.querySelector('input[name="selectvoice"]:checked');
    const selectedCommentType = document.querySelector('input[name="comment-type"]:checked').value;
    let shouldRead = false;

    switch (selectedCommentType) {
        case 'any-comment':
            shouldRead = true;
            break;
        case 'dot-comment':
            shouldRead = text.startsWith('.');
            break;
        case 'slash-comment':
            shouldRead = text.startsWith('/');
            break;
        case 'command-comment':
            const commandPrefix = document.getElementById('command').value;
            if (text.startsWith(commandPrefix)) {
                shouldRead = true;
                text = text.replace(commandPrefix, '');
            }
            break;
    }

    if (shouldRead && text && !isReading) {
        selectedVoice.id === 'selectvoice2' ? new TTS(text) : leerMensajes(text);
    }

    return true;
}
getFiles()

function setupTab5Action() {
    tab5Action({
        elementContainer: document.getElementById('tab5-action'),
        files: getFiles(),
        optionsgift: getAvailableGifts(),
        onSave: (datos) => {
            loadDataFromIndexedDB123();
            saveDataToIndexedDB(databases.eventsDB, datos);
        },
        onCancel: getFiles,
    }).then((modal) => {
        objectModal = modal;
        document.getElementById('openaction').addEventListener('click', objectModal.open);
        document.getElementById('closeaction').addEventListener('click', objectModal.close);
    });
}

function loadDataFromIndexedDB123() {
    loadDataFromIndexedDB(databases.eventsDB, createElementWithButtons);
    loadDataFromIndexedDB(databases.MyDatabaseActionevent, createElementWithButtons);
}
function setupInitialState() {
    if (document.getElementById('overlayOff').checked) {
        window.api.createOverlayWindow();
    }
}

function setupEventListeners() {
    window.api.onShowMessage((event, message) => console.log(message));
    
    window.signal = (data) => {
        console.log('signal received', data);
        handleleermensaje(data);
    };

    document.getElementById('file-list').addEventListener('click', handleFileListClick);

    window.speechSynthesis.onvoiceschanged = populateVoiceList;
}
async function handleFileListClick(event) {
    const target = event.target;
    if (target.classList.contains('play-button')) {
        await handlePlayButton(target);
    } else if (target.classList.contains('deleteButton')) {
        handleDeleteButton(target);
    }
}
async function loadFileList() {
    const files = await window.api.getFilesInFolder();
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = files.map(file => createFileItemHTML(file)).join('');
}
async function deleteFile(fileName) {
    await window.api.deleteFile(fileName);
    loadFileList();
}
document.addEventListener('DOMContentLoaded', () => {
    setupInitialState();
    setupEventListeners();
    loadDataFromIndexedDB123();
    loadFileList();
    setTimeout(setupTab5Action, 4000);
    setupDragAndDrop();
});
document.addEventListener('DOMContentLoaded', () => {
    window.api.onShowMessage((event, message) => {
        console.log(message);
    });

    if (localStorage.getItem('lastLike')) {
        // eventmanager('likes', JSON.parse(localStorage.getItem('lastLike')));
    }
    if (localStorage.getItem('lastChatItem')) {
        // eventmanager('chat', JSON.parse(localStorage.getItem('lastChatItem')));
        console.log('lastChatItem', JSON.parse(localStorage.getItem('lastChatItem')));
    }
    loadDataFromIndexedDB123();
    observer.subscribe(loadDataFromIndexedDB123);
    loadFileList();
    // document.getElementById('connect-button').addEventListener('click', async () => {
    //     const result = await window.api.createClientOsc();

    //     if (result.success) {
    //         console.log('OSC Client created successfully');
    //     } else {
    //         console.error('Failed to create OSC Client');
    //     }
    // });
    document.getElementById('createBotForm').addEventListener('submit', async (event) => {
        event.preventDefault();
      
        const keyBOT = document.getElementById('keyBOT').value.trim();
        const keySERVER = document.getElementById('keySERVER').value.trim();
        const [serverip, serverport = 25565] = keySERVER.split(':');
        const keyLOGIN = document.getElementById('InitcommandInput').value.trim();
        const resultMessage = document.getElementById('resultMessage');
        const versionminecraft = document.getElementById('versionminecraft').value.trim();
        const options = {
          host: serverip,
          port: parseInt(serverport, 10),
          username: keyBOT,
          version: versionminecraft ||'1.20',
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
    setTimeout(getBotStatus, 1000);
    
    const skipButton = document.getElementById('skip-button');
    skipButton.addEventListener('click', skipAudio);
});
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
    // const optionsgift = () => {
    //     const result = window.globalSimplifiedStates;
    //     console.log('optionsgift', result);
    //     return result;
    // }
export { handleleermensaje, objectModal, eventmanager };