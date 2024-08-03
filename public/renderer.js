import { loadData, createGiftSelect, getAvailableGifts } from './functions/giftmanager.js';
import { replaceVariables } from "./functions/replaceVariables.js";
import { TTS, leerMensajes } from './functions/tts.js';
// import { createElementWithButtons } from "./utils/createtable.js";
import { createFileItemHTML, setupDragAndDrop, handlePlayButton, getfileId, handlePasteFromClipboard} from "./utils/Fileshtml.js";
import {     validateForm,obtenerDatos,resetForm,getFiles123,filesform, } from './functions/dataHandler.js';
import { fillForm, setPendingSelectValues } from './utils/formfiller.js';
import {ModalModule} from './modal/modal.js';
import {observer ,databases, createDBManager } from './functions/indexedDB.js';
import { fetchTranslationData, getTranslationValue, changetextlanguage } from './getdata/translate.js';
import { EventManager } from './AccionEvents/accioneventTrigger.js';
import { TableManager } from './datatable/datatable.js';
// import { get } from '../routes.js';
// Variables globales
let isReading = null;
let copyFiles = [];
const actionEventDBManager = createDBManager(databases.MyDatabaseActionevent);
document.addEventListener('DOMContentLoaded', async () => {
    console.log("asdasdasd");
    setupInitialState();
    setupEventListeners();
    loadFileList();
    setupDragAndDrop();
    window.api.onShowMessage((event, message) => {
        console.log(message);
    });
    loadFileList();
    setTimeout(changetextlanguage(document.getElementById('changelanguage').value), 3000);
    document.getElementById('changelanguage').addEventListener('change', function() {
        const lang = this.value;
        console.log("lang", lang);
        changetextlanguage(lang);
        modalManager.translatemodal1(document.getElementById('changelanguage').value);

    });
    getFiles()
    try {
        const modal1 = new ModalModule(
            'openModal2',
            './modal/modalhtml.html',
            './modal/modal.css',
            (modal) => {
                console.log('Modal 1 opened', modal);

                // modal1.addCustomEventListener('.obtenerinfo', 'click', () => {
                //     const dataById = modal1.captureData({
                //         parseMethod: 'id',
                //         idPrefix: 'input_',
                //         separator: '_'
                //     });
                //     console.log('Datos por ID:', dataById);

                //     const dataByData = modal1.captureData({
                //         parseMethod: 'data',
                //         dataAttr: 'data-field'
                //     });
                //     console.log('Datos por data-attribute:', dataByData);

                //     const dataByClass = modal1.captureData({
                //         parseMethod: 'class',
                //         classPrefix: 'field-',
                //         separator: '-'
                //     });
                //     console.log('Datos por clase:', dataByClass);
                // });
            }
        );

        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('modal1', modal1);
    } catch (error) {
        console.error('Error creating modal:', error);
    }
});
const actions = {
    'type-functions': async (finddata, data, manager) => {
        if (finddata.select) {
            console.log("Function", finddata.select);
            const valuereplaced = replaceVariables(finddata.value, data);
            const functionItem = manager.functionslist[finddata.select];
            if (functionItem) {
                await functionItem(valuereplaced);
            } else {
                console.warn(`Function ${finddata.select} not found`);
            }
        }
    },
    'type-imagen': async (finddata, data, manager) => {
        const srcoverlay = await manager.getfileId(finddata.select);
        if (srcoverlay) {
            await manager.sendOverlayData(srcoverlay, finddata);
        }
    },
    'type-video': async (finddata, data, manager) => {
        const srcoverlay = await manager.getfileId(finddata.select);
        if (srcoverlay) {
            await manager.sendOverlayData(srcoverlay, finddata);
        }
    },
    'type-audio': async (finddata, data, manager) => {
        const srcoverlay = await manager.getfileId(finddata.select);
        if (srcoverlay) {
            await manager.sendOverlayData(srcoverlay, finddata);
        }
    },
    'type-profile': async (finddata, data, manager) => {
        finddata.texto = replaceVariables(finddata.texto, data);
        await manager.sendOverlayData({ path: data.profilePictureUrl, type: "image/png" }, finddata, true);
    }
};

// Configuración
const config = {
    functionslist: {
        testfunction: testfunction,
        minecraftparsecommands: minecraftparsecommands,
        testvariables: testvariables
    },
    EVENT_TYPES: {
        GIFT: 'gift',
        LIKES: 'likes',
        IMAGE: 'image',
        VIDEO: 'video',
        AUDIO: 'audio',
        PROFILE: 'PROFILE',
        FUNCTION: 'function'
    },
    mediaTypes: [
        { type: 'IMAGE', key: "type-imagen" },
        { type: 'VIDEO', key: "type-video" },
        { type: 'AUDIO', key: "type-audio" },
        { type: 'PROFILE', key: "type-profile" }
    ],
    customProcessors: {
        gift: (value, data) => Number(value.select) === data.giftId,
        likes: (value, data) => (Number(value.number) || 2) <= data.likeCount,
    },
    actions: actions,
    actionEventDBManager: actionEventDBManager
};
function minecraftparsecommands(test) {
    const splitcommand = test.split('\n');
    console.log(splitcommand);
}
function testfunction() {
    console.log('testfunction');
}
const functionslist = [
    {
        name: 'testfunction',
        description: 'testfunction',
        function: testfunction
    },
    {
        name: 'minecraftparsecommands',
        description: 'minecraftparsecommands',
        function: minecraftparsecommands
    },
    {
        name: 'testvariables',
        description: 'testvariables',
        function: testvariables
    },
    
];
function testvariables(eventType, data) {
    console.log("testvariables", eventType, data);
}
const eventManager = new EventManager(config);
const eventmanager = eventManager.eventmanager;
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
        this.setupFunctionSelector(modal);
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
            inputSelector: '#event-gift_select',
            buttonClass: 'btn btn-primary'
        });

        giftSelector.initialize();
    }
    setupFunctionSelector = (modal) => {
        const functionSelector = modal.createCustomSelector({
            id: 'functionSelector',
            title: 'Seleccionar función',
            getItemsFunction: async () => functionslist,
            renderOptionFunction: (functionItem) => `
                <div class="function-option">
                    <span>${functionItem.name}</span>
                </div>`,
            onSelectFunction: (input, selectedFunction) => {
                input.value = selectedFunction.name;
                input.dataset.name = selectedFunction.name;
            },
            inputSelector: '#type-functions_select',
            buttonClass: 'btn btn-primary'
        });
        functionSelector.initialize();
    }
    setupEventListeners = (modal) => {
        modal.addCustomEventListener('.modalActionAdd', 'click', async () => {
            const formelement = modal.modal.querySelector('.AccionEvents');
            const nameFilter = obtenerDatos(formelement, '_', {});
            if (nameFilter.id) {
                console.log('Guardando datos de la base de datos EXISTE ID', nameFilter.id);
            } else {
                await actionEventDBManager.saveData(nameFilter);
                this.modal.close();
                console.log('Guardando datos de la base de datos NO EXISTE ID', nameFilter.id);
            }
            // Aquí puedes agregar la lógica para guardar los datos
        });
    }

    onModalOpen = async (modal) => {
        console.log('Modal abierta, ejecutando acciones personalizadas');
        const formmodal = modal.modal.querySelector('form');
        const cacheAssign = {};
        this.modal.modal.querySelector('.Eventoscheck').style.display = 'block';
        this.modal.modal.querySelector('.Actionscheck').style.display = 'block';
        this.modal.modal.querySelector('.modalActionAdd').style.display = 'block';
        resetForm(formmodal);
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
                if (nameFilter.id) {
                    await actionEventDBManager.updateData(nameFilter);
                    console.log('Guardando datos de la base de datos EXISTE ID', nameFilter.id);
                } else {
                    await actionEventDBManager.saveData(nameFilter);
                    console.log('Guardando datos de la base de datos NO EXISTE ID', nameFilter.id);
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
    translatemodal1 = async (lang) => {
        if (!this.modal) {
            console.error('Modal not initialized');
            return;
        }
        this.modal.translateModal(lang);

        
    }
}

const modalManager = new ModalManager();
modalManager.initializeModal().then(() => {
    console.log('Modal manager initialized');
}).catch(error => {
    console.error('Error initializing modal manager:', error);
});

const ActionEventmanagertable = new TableManager(
    'ActionEvent-tablemodal', 
    'MyDatabaseActionevent', 
    [
        { header: 'Acción Evento', key: 'accionevento_nombre' },
        // { header: 'ID', key: 'id' },
        { header: 'audio', key: 'type-audio_select', transform: async (value) => getDataText({select: value}) },
        { header: 'video', key: 'type-video_select', transform: async (value) => getDataText({select: value}) },
        { header: 'imagen', key: 'type-imagen_select', transform: async (value) => getDataText({select: value}) },
    ],
    {
        onEdit: (item) => {
            console.log('Custom edit callback', item);
            modalManager.openForEdit(item);
        },
        onDelete: (id) => {
            console.log('Custom delete callback', id);
            if (confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
                ActionEventmanagertable.dbManager.deleteData(id);
            }
        },
        // onReassign: (item) => {
        //     console.log('Custom openForReassign callback', item);
        //     modalManager.openForReassign(item);
        // }
    },
    {
        default: 'custombutton',
        onEdit: 'editar custombutton',
        onDelete: 'DeleteButton deleteButton',
        onReassign: 'Reassign custombutton'
    }
);
const eventtable = new TableManager(
    'eventtable-tablemodal',
    'MyDatabaseActionevent',
    [
        { header: 'Acción Evento', key: 'accionevento_nombre' },
        // { header: 'ID', key: 'id' },
        { 
            header: 'Tipo de Evento Activo', 
            eventKeys: ['event-chat', 'event-follow', 'event-gift', 'event-likes', 'event-share', 'event-subscribe'],
            showEventType: true
        },
        { 
            header: 'Valor del Evento Activo', 
            eventKeys: ['event-chat', 'event-follow', 'event-gift', 'event-likes', 'event-share', 'event-subscribe']
        },
    ],
    {
        onEdit: (item) => {
            console.log('Custom edit callback for event', item);
            modalManager.openForEdit(item);
        },
        onDelete: (id) => {
            console.log('Custom delete callback for event', id);
            if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
                eventtable.dbManager.deleteData(id);
            }
        },
        onReassign: (item) => {
            console.log('Custom openForReassign callback', item);
            modalManager.openForReassign(item);
        },
        onPlay: (item) => {
            console.log('Custom openForPlay callback', item);
            console.log("item eventype", item.event_type);
            // eventmanager(item.event_type, getlastdatatest(item.event_type));
        }
    },
    {
        default: 'custombutton',
        onEdit: 'editar custombutton',
        onDelete: 'DeleteButton deleteButton',
        onReassign: 'Reassign custombutton'
    },
    ['onDelete','onEdit']  // Este parámetro oculta los botones de eliminar y editar
);
eventtable.loadAndDisplayAllData();
ActionEventmanagertable.loadAndDisplayAllData();
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
// funciones de inicio y elementos de archivos
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
  
window.speechSynthesis.onvoiceschanged = function() {
populateVoiceList();
}
async function getDataText(data) {
    if (!data) {
        return 'N/A';
    }
    // console.log("getDataText", data);
    let datatextname = await getfileId(data.select);
    // console.log("getDataText", datatextname);
    if (datatextname) {
        return datatextname.name;
    }
    return data.select ? data.select : 'N/A';
}
async function getFileById(fileId) {
    return window.api.getFileById(fileId);
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

export { handleleermensaje, modalManager, eventmanager };