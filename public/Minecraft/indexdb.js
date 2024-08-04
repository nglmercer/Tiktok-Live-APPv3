import { replaceVariables } from '../functions/replaceVariables.js';
import { getAvailableGifts } from '../functions/giftmanager.js';
import { ModalModule } from '../modal/modal.js';
import { createDBManager, observer, databases } from '../functions/indexedDB.js';
import { TableManager } from '../datatable/datatable.js';
import {     validateForm,
    obtenerDatos,
    resetForm,
    getFiles123,
    filesform, } from '../functions/dataHandler.js';
import { fillForm, setPendingSelectValues } from '../utils/formfiller.js';
import { EventManager } from '../AccionEvents/accioneventTrigger.js';
import { SendataTestManager} from '../testdata/testdata.js';
import { svglist } from '../svg/svgconst.js';
import { sendReplacedCommand } from '../app.js';
const minecraftDBManager = createDBManager(databases.MinecraftDatabase);

class ModalminecraftManager {
    constructor() {
        this.modal = null;
        this.modalPromise = null;
    }
    initializeModal = async () => {
        this.modalPromise = new ModalModule(
            'openMinecraftmodal',
            './Minecraft/minecraftmodal.html',
            './Minecraft/minecraftmodal.css',
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
            inputSelector: '#event-gift_select',
            buttonClass: 'btn btn-primary'
        });

        giftSelector.initialize();
    }
    setupEventListeners = (modal) => {
        modal.addCustomEventListener('.modalActionAdd', 'click', async () => {
            const formelement = modal.modal.querySelector('.minecraftmodal');
            const nameFilter = obtenerDatos(formelement, '_', {});
            console.log(nameFilter);
            minecraftDBManager.saveData(nameFilter);
            this.modal.close();
        });
        modal.addCustomEventListener('.modalActionSave', 'click', async () => {
            const form = modal.modal.querySelector('form');
            const nameFilter = obtenerDatos(form, '_', {});
            if (nameFilter.id) {
                await minecraftDBManager.updateData(nameFilter);
                console.log('Guardando datos de la base de datos EXISTE ID', nameFilter.id);
            } else {
                await minecraftDBManager.saveData(nameFilter);
                console.log('Guardando datos de la base de datos NO EXISTE ID', nameFilter.id);
            }
            // Aquí podrías añadir lógica adicional después de guardar
            this.modal.close();
        });
    }
    onModalOpen = async (modal) => {
        console.log('Modal abierta, ejecutando acciones personalizadas');
        await this.modal.changeModalLanguage(document.getElementById('changelanguage').value);
        modal.modal.querySelector('.modalActionSave').style.display = 'none';
        modal.modal.querySelector('.modalActionAdd').style.display = 'block';
        const formmodal = modal.modal.querySelector('form');
        resetForm(formmodal, ['checkbox']);;
    }
    openModal = async (config = {}) => {

        await this.modal.open();
        if (config.showGiftSelector) {
            this.modal.modal.querySelector('#giftSelector').style.display = 'block';
        } else {
            this.modal.modal.querySelector('#giftSelector').style.display = 'none';
        }
        
    }
    openForEdit = async (data) => {
        await this.modal.openWithCustomAction(async (modal) => {
            console.log('Modal abierta para editar:', data);
            modal.modal.querySelector('.modalActionSave').style.display = 'block';
            modal.modal.querySelector('.modalActionAdd').style.display = 'none';
            const form = modal.modal.querySelector('form');
            if (form) {
                await fillForm(form, data, '_');
            }
        });
    }
}
const modalminecraftManager = new ModalminecraftManager();
modalminecraftManager.initializeModal().then(() => {
    console.log('Modal minecraft manager initialized');
}).catch(error => {
    console.error('Error initializing modal minecraft manager:', error);
});

const minecraftdatatable = new TableManager('minecraft-tablemodal',
 'MinecraftDatabase', 
 [
{ header: 'comandos de minecraft', key: 'type-functions_value' },
// { header: 'ID', key: 'id' },
{ 
    header: 'Evento activo',
    eventKeys: ['event-chat', 'event-follow', 'event-gift', 'event-likes', 'event-share', 'event-subscribe'],
    showEventType: true
},
{ 
    header: 'Valor del Evento',
    eventKeys: ['event-chat', 'event-follow', 'event-gift', 'event-likes', 'event-share', 'event-subscribe']
},
], {
    onDelete: (id) => {
        console.log('Custom delete callback', id);
        if (confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
            minecraftdatatable.dbManager.deleteData(id);
        }
    },
    onEditar: (item) => {
        console.log('Custom edit callback', item);
        modalminecraftManager.openForEdit(item);
    }
},
{
    default: 'custombutton', // Clase por defecto para todos los botones
    onDelete: 'deleteButton', // Clase específica para el botón de eliminar
}, 
[],
{
    onDelete: svglist.deleteSvgIcon,
    onEditar: svglist.editSvgIcon,
},
{
    onDelete: 'Eliminar este elemento',
    onEditar: 'Editar este elemento',
 }
);

minecraftdatatable.loadAndDisplayAllData();
const actions = {
    'type-functions': async (finddata, data, manager) => {
        const functionName = finddata.select || manager.defaultFunction;
        console.log("type Function", finddata);
        if (functionName) {
            console.log("type Function functionName", functionName,"finddata", finddata);
            const valuereplaced = replaceVariables(finddata.value, data);
            const functionItem = manager.functionslist[functionName];
            if (functionItem) {
                await functionItem(valuereplaced);
            } else {
                console.warn(`Function ${functionName} not found`);
            }
        }
    },
};
const config = {
    functionslist: {
        minecraftparsecommands: minecraftparsecommands
    },
    EVENT_TYPES: {
        GIFT: 'gift',
        LIKES: 'likes',
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
    actionEventDBManager: minecraftDBManager,
    defaultFunction: 'minecraftparsecommands' // Add default function name here
};
function minecraftparsecommands(test) {
    if (typeof test !== 'string') {
        // console.log("minecraftparsecommands no string", test);
        return;
    }
    const splitcommand = test.split('\n');
    console.log("minecraftparsecommands", splitcommand);
    if (splitcommand.length > 1) {
        splitcommand.forEach(async (command) => {
            if (command.length > 0) {
                // console.log("minecraftparsecommands command", command);
                sendReplacedCommand(command);
            }
        });
    }
}

const Minecraftmanager = new EventManager(config);

const testmanagerminecraft = new SendataTestManager('testminecraftbutton', 'testminecraftinput', 'testminecraftstatus', Minecraftmanager.eventmanager);

function minecraftlive(eventType, data) {
    Minecraftmanager.eventmanager(eventType, data);
}
function minecraftlivetest(comando) {
    console.log("minecraftlivetest", comando);
}
export { minecraftlive  };