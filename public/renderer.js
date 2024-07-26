import tab5Action from "./tab5-action/tab5-action.js";
import { loadData, createGiftSelect, getAvailableGifts } from './functions/giftmanager.js';
import { replaceVariables } from "./functions/replaceVariables.js";
import { TTS, leerMensajes } from './functions/tts.js';
import { createElementWithButtons } from "./utils/createtable.js";
import { createFileItemHTML, setupDragAndDrop, handlePlayButton, getfileId, handlePasteFromClipboard} from "./utils/Fileshtml.js";
import {     validateForm,
    obtenerDatos,
    resetForm,
    getFiles123,
    filesform, } from './functions/dataHandler.js';
import { fillForm, setPendingSelectValues } from './utils/formfiller.js';
import {ModalModule} from './modal/modal.js';
import {observer ,databases, createDBManager } from './functions/indexedDB.js';
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
const eventsDBManager = createDBManager(databases.eventsDB);
const actionEventDBManager = createDBManager(databases.MyDatabaseActionevent);
async function eventmanager(eventType, data) {
    const eventsfind = await actionEventDBManager.getAllData();
    let matched = false;
    
    for (const eventname of eventsfind) {
        matched = await processEvent(eventname, eventType, data);
        if (matched) break; // Si se encuentra una coincidencia, salir del bucle
    }
    console.log('matched', matched);
    // Si no se encontró ninguna coincidencia, ejecutar la lógica por defecto para 'gift'
    if (!matched) {
        for (const eventname of eventsfind) {
            for (const [key, value] of Object.entries(eventname)) {
                const splitkey = key.split('-');
                if (splitkey[1] !== eventType) continue;
                if (eventType === EVENT_TYPES.GIFT && value.select === 'default') {
                    console.log('Default logic for GIFT');
                    await processMediaTypes(eventname, data);
                    break;
                }
            }
        }
    }
}
async function processEvent(eventname, eventType, data) {
    let matched = false;
    for (const [key, value] of Object.entries(eventname)) {
        const splitkey = key.split('-');
        if (splitkey[1] !== eventType) continue;
        if (!value.check) return false;
        switch (eventType) {
            case EVENT_TYPES.GIFT:
                if (processGiftEvent(value, data)) {
                    matched = true;
                    console.log("Matched GIFT eventType",matched);
                }
                break;
            case EVENT_TYPES.LIKES:
                if (processLikesEvent(value, data)) {
                    matched = true;
                    console.log("Matched LIKES eventType",matched);
                }
                break;
            default:
                matched = true;
                await processMediaTypes(eventname, data);
                return false;
        }
    }
    if (matched) {
        await processMediaTypes(eventname, data);
    } 
    console.log('matched', matched);
    return matched;
}

function processGiftEvent(value, data) {
    const selectValue = Number(value.select);  // Crear una copia y convertirla a número
    return selectValue === data.giftId;
}

function processLikesEvent(value, data) {
    const numberValue = Number(value.number) || 2;  // Crear una copia y convertirla a número
    return numberValue <= data.likeCount;
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
    // tab5Action({
    //     elementContainer: document.getElementById('tab5-action'),
    //     files: getFiles(),
    //     optionsgift: getAvailableGifts(),
    //     onSave: (datos) => {
    //         loadDataFromIndexedDB123();
    //         saveDataToIndexedDB(databases.eventsDB, datos);
    //     },
    //     onCancel: () => {
    //         console.log('onCancel');
    //     }
    // }).then((modal) => {
        
    //     objectModal = modal;
    //     document.getElementById('openaction').addEventListener('click', objectModal.open);
    //     document.getElementById('closeaction').addEventListener('click', objectModal.close);
    // });
}
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const modal1 = new ModalModule(
            'openModal2',
            './modal/modalhtml.html',
            './modal/modal.css',
            (modal) => {
                console.log('Modal 1 opened', modal);

                modal1.addCustomEventListener('.obtenerinfo', 'click', () => {
                    const dataById = modal1.captureData({
                        parseMethod: 'id',
                        idPrefix: 'input_',
                        separator: '_'
                    });
                    console.log('Datos por ID:', dataById);

                    const dataByData = modal1.captureData({
                        parseMethod: 'data',
                        dataAttr: 'data-field'
                    });
                    console.log('Datos por data-attribute:', dataByData);

                    const dataByClass = modal1.captureData({
                        parseMethod: 'class',
                        classPrefix: 'field-',
                        separator: '-'
                    });
                    console.log('Datos por clase:', dataByClass);
                });
            }
        );

        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('modal1', modal1);
    } catch (error) {
        console.error('Error creating modal:', error);
    }
    try {
        const modal2 = new ModalModule(
            'openModal1',
            './tab5-action/AccionEvents.html',
            './tab5-action/tabstyle.css',    
            async (modal) => {
                const cacheAssign = {};
                const formmodal = modal.modal.querySelector('form');
                objectModal = modal;
                console.log("formmodal", formmodal);
                resetForm(formmodal);
    
                // Crear el selector personalizado para los regalos
                const giftSelector = modal.createCustomSelector({
                    id: 'giftSelector',
                    title: 'Seleccionar regalo',
                    getItemsFunction: async () => {
                        // Obtener los regalos disponibles
                        return getAvailableGifts();
                    },
                    renderOptionFunction: (gift) => {
                        // Renderizar cada opción de regalo
                        console.log(gift);
                        return `<div class="gift-option">
                            <img src="${gift.image.url_list[0]}" alt="${gift.name}">
                            <span>${gift.name}</span>
                        </div>`;
                    },
                    onSelectFunction: (input, selectedGift) => {
                        // Manejar la selección del regalo
                        input.value = selectedGift.id;
                        input.dataset.name = selectedGift.name;
                    },
                    inputSelector: '#event-gift_select' // ID del input para el regalo
                });
    
                // Inicializar el selector de regalos
                giftSelector.initialize();
    
                filesform(formmodal, cacheAssign);
    
                // Añadir event listener para la acción de añadir
                modal.addCustomEventListener('.modalActionAdd', 'click', async () => {
                    const formelement = modal.modal.querySelector('.AccionEvents');
                    const nameFilter = obtenerDatos(formelement, '_', {});
                    console.log(nameFilter);
                    await actionEventDBManager.saveData(nameFilter);
                });
            }
        );
    } catch (error) {
        console.error('Error creating modal:', error);
    }
    const actionEventDBManager = createDBManager(databases.MyDatabaseActionevent);


    // try {
    //     const modal2 = new ModalModule(
    //         'openModal1',
    //         './tab5-action/AccionEvents.html',
    //         './tab5-action/tabstyle.css',    
    //         async (modal) => {
    //             console.log('Modal 2 opened', modal);
    //             await modal.setupImageSelector('imageSelectorContainer', getAvailableGifts, (id, value) => {
    //                 console.log(`Option selected in ${id}: ${value}`);
    //             });
    //             modal2.addCustomEventListener('.modalActionAdd', 'click', () => {
    //                 const formelement = modal.querySelector('.tab5-action');
    //                 const nameFilter = obtenerDatos(formelement, '_', {});
    //                 console.log(nameFilter);
    //             });
    //         }
    //     );
    // } catch (error) {
    //     console.error('Error creating modal:', error);
    // }
});
class CustomSelectorModal {
    constructor(options) {
        this.options = options;
        this.modal = null;
        this.selectedValue = null;
        this.init();
    }

    async init() {
        this.createModal();
        this.addEventListeners();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'custom-selector-modal';
        this.modal.innerHTML = `
            <div class="custom-selector-content">
                <span class="close-custom-selector">&times;</span>
                <h2>${this.options.title || 'Seleccionar'}</h2>
                <div id="custom-options"></div>
                <button id="confirm-custom-selection">Aceptar</button>
            </div>
        `;
        document.body.appendChild(this.modal);
    }

    addEventListeners() {
        const openButton = document.querySelector(this.options.buttonSelector);
        if (openButton) {
            openButton.addEventListener('click', () => this.openModal());
        }

        this.modal.querySelector('.close-custom-selector').addEventListener('click', () => this.closeModal());
        this.modal.querySelector('#confirm-custom-selection').addEventListener('click', () => this.confirmSelection());
    }

    async openModal() {
        const items = await this.options.getItemsFunction();
        this.populateOptions(items);
        this.modal.style.display = 'block';
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    populateOptions(items) {
        const optionsContainer = this.modal.querySelector('#custom-options');
        optionsContainer.innerHTML = '';
        items.forEach(item => {
            const optionElement = document.createElement('div');
            optionElement.className = 'custom-option';
            optionElement.innerHTML = this.options.renderOptionFunction(item);
            optionElement.dataset.value = JSON.stringify(item);
            optionElement.addEventListener('click', () => this.selectOption(optionElement));
            optionsContainer.appendChild(optionElement);
        });
    }

    selectOption(optionElement) {
        const prevSelected = this.modal.querySelector('.custom-option.selected');
        if (prevSelected) prevSelected.classList.remove('selected');
        optionElement.classList.add('selected');
        this.selectedValue = JSON.parse(optionElement.dataset.value);
    }

    confirmSelection() {
        if (this.selectedValue) {
            const input = document.querySelector(this.options.inputSelector);
            if (input) {
                this.options.onSelectFunction(input, this.selectedValue);
            }
            this.closeModal();
        }
    }
}
// async function modal2() {
//     try {
//         const modal2 = new ModalModule(
//             'openModal1',
//         './tab5-action/AccionEvents.html',
//         './tab5-action/tabstyle.css',     
//             (modal) => {
//                 console.log('Modal 2 opened', modal);
//                             modal.setupGiftSelector('giftSelectorContainer', (id, value) => {
//                 console.log(`Gift selected in ${id}: ${value}`);
//             });
//                 modal2.addCustomEventListener('.modalActionAdd', 'click', () => {
//                     const formelement = modal.querySelector('.tab5-action');
//                     const nameFilter = obtenerDatos(formelement, '_', {});
//                     console.log(nameFilter);

//                 });
//                 }
//             );
//         } catch (error) {
//             console.error('Error creating modal:', error);
//         }
//     }
function loadDataFromIndexedDB123() {
    // loadDataFromIndexedDB(databases.eventsDB, createElementWithButtons);
    // loadDataFromIndexedDB(databases.MyDatabaseActionevent, createElementWithButtons);
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
    document.getElementById('paste-button').addEventListener('click', handlePasteFromClipboard);
    window.speechSynthesis.onvoiceschanged = populateVoiceList;
}


async function handleFileListClick(event) {
    const target = event.target;
    if (target.classList.contains('play-button')) {
        await handlePlayButton(target);
    } else if (target.classList.contains('deleteButton')) {
        await deleteFile(target);
    }
}
async function loadFileList() {
    try {
        const files = await window.api.getFilesInFolder();
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = files.map(file => createFileItemHTML(file)).join('');
    } catch (error) {
        console.error('Error loading file list:', error);
    }
}
async function deleteFile(button) {
    const fileName = button.closest('.file-item').querySelector('input').value;
    try {
        await window.api.deleteFile(fileName);
        await loadFileList();
    } catch (error) {
        console.error('Error deleting file:', error);
    }
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

});

    // const optionsgift = () => {
    //     const result = window.globalSimplifiedStates;
    //     console.log('optionsgift', result);
    //     return result;
    // }
export { handleleermensaje, objectModal, eventmanager };