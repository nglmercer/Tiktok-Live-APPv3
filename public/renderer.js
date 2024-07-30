import { loadData, createGiftSelect, getAvailableGifts } from './functions/giftmanager.js';
// import { replaceVariables } from "./functions/replaceVariables.js";
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
const actionEventDBManager = createDBManager(databases.MyDatabaseActionevent);

let objectModal = null;
let modalPromise = null;
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
    // setTimeout(modalopenModal2, 500);
    // setTimeout(modalManager.initializeModal, 1000);
    // setTimeout(modalManager.openModal, 2000, {showGiftSelector: true});

});
function modalopenModal2() {
    modalPromise = new ModalModule(
            'openModal1',
            './tab5-action/AccionEvents.html',
            './tab5-action/tabstyle.css',    
            async (modal) => {
                const cacheAssign = {};
                const formmodal = modal.modal.querySelector('form');
                objectModal = modal;
                console.log("formmodal", formmodal);    
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
                // Añadir event listener para la acción de añadir
                modal.addCustomEventListener('.modalActionAdd', 'click', async () => {
                    const formelement = modal.modal.querySelector('.AccionEvents');
                    const nameFilter = obtenerDatos(formelement, '_', {});
                    console.log(nameFilter);
                    if (nameFilter.id) {
                        console.log('Guardando datos de la base de datos EXISTE ID', nameFilter.id);
                    } else {
                        console.log('Guardando datos de la base de datos NO EXISTE ID', nameFilter.id);
                    }
                    // await actionEventDBManager.saveData(nameFilter);
                });
                
            },
            null,
            async (modal) => {
                const cacheAssign = {};
                const formmodal = modal.modal.querySelector('form');
                console.log('Modal abierta, ejecutando acciones personalizadas');
                // resetForm(formmodal);
                filesform(formmodal, cacheAssign);
            }
        ).waitForInitialization();;
}
class ModalManager {
    constructor() {
        this.modal = null;
        this.modalPromise = null;
    }

    initializeModal = async () => {
        this.modalPromise = new ModalModule(
            'openModal1',
            './tab5-action/AccionEvents.html',
            './tab5-action/tabstyle.css',
            this.setupModal,
            null,
            this.onModalOpen
        ).waitForInitialization();

        this.modal = await this.modalPromise;
    }

    setupModal = async (modal) => {
        const formmodal = modal.modal.querySelector('form');
        console.log("formmodal", formmodal);

        this.setupGiftSelector(modal);
        this.setupEventListeners(modal);
    }

    setupGiftSelector = (modal) => {
        const giftSelector = modal.createCustomSelector({
            id: 'giftSelector',
            title: 'Seleccionar regalo',
            getItemsFunction: getAvailableGifts,
            renderOptionFunction: (gift) => `
                <div class="gift-option">
                    <img src="${gift.image.url_list[0]}" alt="${gift.name}">
                    <span>${gift.name}</span>
                </div>`,
            onSelectFunction: (input, selectedGift) => {
                input.value = selectedGift.id;
                input.dataset.name = selectedGift.name;
            },
            inputSelector: '#event-gift_select'
        });

        giftSelector.initialize();
    }

    setupEventListeners = (modal) => {
        modal.addCustomEventListener('.modalActionAdd', 'click', async () => {
            const formelement = modal.modal.querySelector('.AccionEvents');
            const nameFilter = obtenerDatos(formelement, '_', {});
            console.log(nameFilter);
            if (nameFilter.id) {
                console.log('Guardando datos de la base de datos EXISTE ID', nameFilter.id);
            } else {
                console.log('Guardando datos de la base de datos NO EXISTE ID', nameFilter.id);
            }
            // Aquí puedes agregar la lógica para guardar los datos
        });
    }

    onModalOpen = async (modal) => {
        console.log('Modal abierta, ejecutando acciones personalizadas');
        const formmodal = modal.modal.querySelector('form');
        const cacheAssign = {};
        // resetForm(formmodal);
        filesform(formmodal, cacheAssign);
    }

    openModal = async (config = {}) => {
        await this.modal.open();
        
        // Configurar la visibilidad de los elementos según el config
        if (config.showGiftSelector) {
            this.modal.modal.querySelector('#giftSelector').style.display = 'block';
        } else {
            this.modal.modal.querySelector('#giftSelector').style.display = 'none';
        }

        // Puedes agregar más configuraciones aquí
    }

    openForReassign = async (data) => {
        await this.modal.openWithCustomAction(async (modal) => {
            console.log('Modal abierta para reasignar:', data);
            
            const form = modal.modal.querySelector('form');
            if (form) {
                await fillForm(form, data, '_');
            }

            modal.modal.querySelector('.Eventoscheck').style.display = 'block';
            modal.modal.querySelector('.Actionscheck').style.display = 'none';
            modal.modal.querySelector('.modalActionAdd').style.display = 'none';

            modal.addCustomEventListener('.modalActionSave', 'click', async () => {
                const nameFilter = obtenerDatos(form, '_', {});
                console.log(nameFilter);
                if (nameFilter.id) {
                    await actionEventDBManager.updateData(nameFilter);
                    console.log('Guardando datos de la base de datos EXISTE ID', nameFilter.id);
                }
                // Aquí podrías añadir lógica adicional después de guardar
                this.modal.close();
            });
        });
    }

    openForEdit = async (data) => {
        await this.modal.openWithCustomAction(async (modal) => {
            console.log('Modal abierta para editar:', data);
            
            const form = modal.modal.querySelector('form');
            if (form) {
                await fillForm(form, data, '_');
            }

            modal.modal.querySelector('.Eventoscheck').style.display = 'none';
            modal.modal.querySelector('.Actionscheck').style.display = 'block';
            modal.modal.querySelector('.modalActionAdd').style.display = 'none';

            modal.addCustomEventListener('.modalActionSave', 'click', async () => {
                const nameFilter = obtenerDatos(form, '_', {});
                console.log(nameFilter);
                if (nameFilter.id) {
                    await actionEventDBManager.updateData(nameFilter);
                    console.log('Guardando datos de la base de datos EXISTE ID', nameFilter.id);
                } else {
                    console.log('Guardando datos de la base de datos NO EXISTE ID', nameFilter.id);
                }
                // Aquí podrías añadir lógica adicional después de guardar
                this.modal.close();
            });
        });
    }
}

const modalManager = new ModalManager();
modalManager.initializeModal().then(() => {
    console.log('Modal manager initialized');
}).catch(error => {
    console.error('Error initializing modal manager:', error);
});
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
    loadFileList();
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
    loadFileList();

});

    // const optionsgift = () => {
    //     const result = window.globalSimplifiedStates;
    //     console.log('optionsgift', result);
    //     return result;
    // }
export { handleleermensaje, objectModal, modalPromise, modalManager };