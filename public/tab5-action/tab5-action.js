import {
    databases,
    saveDataToIndexedDB,
    updateDataInIndexedDB,
} from '../functions/indexedDB.js';
import createErrorComponent from '../htmlcomponents/errorComponent.js';
import { fillForm, setPendingSelectValues } from '../utils/formfiller.js';
async function createModalElement() {
    const modal = document.createElement('div');
    modal.className = 'modalElement';
    modal.id = `ModalElement${Math.floor(Math.random() * 1000)}`;
    modal.innerHTML = await (await fetch('./tab5-action/tab5-action.html')).text();
    return modal;
}

function validateForm(form, modal) {
    const nombre = form.elements.namedItem('accionevento_nombre');
    if (!nombre || !nombre.value.trim()) {
        const errorMessage = createErrorComponent('El nombre es obligatorio.');
        errorMessage.style.display = 'block';
        errorMessage.style.position = 'fixed';
        errorMessage.style.top = '1%';
        errorMessage.style.right = '1%';
        modal.appendChild(errorMessage);
        return false;
    }
    return true;
}
function obtenerDatos(form, separator = '_') {
    const nameFilter = {};

    for (const elemento of form.elements) {
        if (elemento.name) {
            const [prefix, suffix] = elemento.name.split(separator);

            if (!nameFilter[prefix]) {
                nameFilter[prefix] = {};
            }

            if (elemento.type === 'checkbox') {
                nameFilter[prefix][suffix || 'check'] = elemento.checked;
            } else if (elemento.type === 'radio') {
                if (prefix === 'event') {
                    const eventType = `event-${elemento.value}`;
                    if (!nameFilter[eventType]) {
                        nameFilter[eventType] = {};
                    }
                    nameFilter[eventType].check = elemento.checked;
                    
                    if (elemento.checked) {
                        nameFilter.event_type = elemento.value;
                    }
                }
            } else if (elemento.type === 'select-one') {
                nameFilter[prefix][suffix || 'select'] = elemento.value;
            } else if (elemento.type === 'number') {
                nameFilter[prefix][suffix || 'number'] = elemento.value;
            } else {
                nameFilter[prefix][suffix || 'value'] = elemento.value;
            }
        }
    }
    const idValue = form.elements.namedItem('id').value;
    nameFilter.id = !isNaN(idValue) ? idValue : null;

    return nameFilter;
}
function resetForm(form) {
    for (const elemento of form.elements) {
        if (elemento.name) {
            if (elemento.type === 'checkbox') {
                elemento.checked = false;
                const numberElement = form.querySelector(`#${elemento.name}_number`);
                if (numberElement) {
                    numberElement.value = 5;
                }
            } else if (elemento.type === 'radio') {
                elemento.checked = false;
            } else if (elemento.type === 'select-one') {
                elemento.selectedIndex = 0;
            } else if (elemento.type === 'range') {
                elemento.value = elemento.defaultValue;
            } else if (elemento.type === 'number') {
                elemento.value = 5;
            } else {
                elemento.value = '';
            }
        }
    }
}

async function getFiles123() {
    try {
        const files = await window.api.getFilesInFolder();
        return [...files];
    } catch (error) {
        console.error('Error fetching files:', error);
        return [];
    }
}

async function filesform(form, cacheAssign) {
    const files = await getFiles123();
    console.log('Files retrieved:', files);

    const selects = form.querySelectorAll('select[data-file-type]');

    selects.forEach(select => {
        const fileType = select.dataset.fileType;
        console.log(`Populating select for ${fileType}`);

        // Clear existing options
        select.innerHTML = '';

        // Filter files by type
        const relevantFiles = files.filter(file => file.type.startsWith(fileType));
        console.log(`Relevant files for ${fileType}:`, relevantFiles);

        if (relevantFiles.length > 0) {
            relevantFiles.forEach(file => {
                const option = document.createElement('option');
                option.value = file.index;
                option.textContent = file.name;
                select.appendChild(option);
                cacheAssign[file.path] = file;
            });
        } else {
            const option = document.createElement('option');
            option.value = 'false';
            option.textContent = 'Sin elementos';
            select.appendChild(option);
        }

        console.log(`Select for ${fileType} populated with ${select.options.length} options`);
    });

    setPendingSelectValues(form);
}

function addNoElementsOption(selectElement, hasElements) {
    if (!hasElements && selectElement) {
        const optionElement = document.createElement('option');
        optionElement.textContent = 'Sin elementos';
        optionElement.value = 'false';
        selectElement.appendChild(optionElement);
    }
}

function populateGiftSelect(optionsgift) {
    const giftselect = document.getElementById('event-gift_select');
    if (optionsgift) {
        const availableGifts = optionsgift || [];
        console.log("availableGifts", availableGifts);
        
        availableGifts.forEach(gift => {
            console.log(gift);
            const optionElement = document.createElement('option');
            optionElement.textContent = gift.name;
            optionElement.value = gift.id;
            giftselect.appendChild(optionElement);
        });
    }
}

function setupFormActions(elementModal, form, databases, onCancel) {
    const saveData = async (nameFilter) => {
        try {
            if (nameFilter.id) {
                await updateDataInIndexedDB(databases.MyDatabaseActionevent, nameFilter);
            } else {
                await saveDataToIndexedDB(databases.MyDatabaseActionevent, nameFilter);
            }
        } catch (error) {
            console.error('Error saving data to IndexedDB:', error);
            // Aquí puedes añadir algún manejo de error adicional si lo deseas
        }
    };
    elementModal.querySelector('.modalActionAdd').addEventListener('click', async () => {
        if (!validateForm(form, elementModal)) return;
        const nameFilter = obtenerDatos(form, '_', {});
        await saveData(nameFilter);
        elementModal.style.display = 'none';
    });

    elementModal.querySelector('.modalActionClose').addEventListener('click', () => {
        elementModal.style.display = 'none';
        onCancel();
    });

    elementModal.querySelector('.modalActionSave').addEventListener('click', async () => {
        if (!validateForm(form, elementModal)) return;
        const nameFilter = obtenerDatos(form, '_', {});
        await saveData(nameFilter);
        elementModal.style.display = 'none';
    });
}

export default async function tab5Action({
    elementContainer,
    files = [],
    optionsgift = [],
    onSave = () => {},
    onCancel = () => {},
    separator = "_"
}) {
    let ModalElement = await createModalElement();
    const idModal = ModalElement.id;
    const cacheAssign = {};

    elementContainer.parentNode.insertBefore(ModalElement, elementContainer.nextSibling);
    elementContainer.remove();

    const elementModal = document.getElementById(idModal);
    elementModal.style.display = 'none';

    const form = elementModal.querySelector('.tab5-action');
    form.addEventListener('submit', event => event.preventDefault());

    setupFormActions(elementModal, form, databases, onSave, onCancel);
    filesform(form, cacheAssign);
    populateGiftSelect(optionsgift);
    fillForm(form, files[0], separator);

    const openModal = () => {
        resetForm(form);
        filesform(form, cacheAssign);
        elementModal.style.display = 'flex';
        elementModal.querySelector('.Actionscheck').style.display = 'block';
        elementModal.querySelector('.Eventoscheck').style.display = 'none';
        elementModal.querySelector('.modalActionAdd').style.display = 'inline-block';
        elementModal.querySelector('.modalActionSave').style.display = 'none';
    };

    const closeModal = () => {
        elementModal.style.display = 'none';
        ModalElement = null;
    };

    const updateModal = (datos) => {
        // filesform(form, cacheAssign);
        fillForm(form, datos, separator);
        setPendingSelectValues(form);
        elementModal.style.display = 'flex';
        elementModal.querySelector('.Actionscheck').style.display = 'block';
        elementModal.querySelector('.Eventoscheck').style.display = 'none';
        elementModal.querySelector('.modalActionAdd').style.display = 'none';
        elementModal.querySelector('.modalActionSave').style.display = 'inline-block';
    };

    const handleEvent = (datos) => {
        // filesform(form, cacheAssign);
        fillForm(form, datos, separator);
        setPendingSelectValues(form);
        elementModal.style.display = 'flex';
        elementModal.querySelector('.Actionscheck').style.display = 'none';
        elementModal.querySelector('.Eventoscheck').style.display = 'block';
        elementModal.querySelector('.modalActionAdd').style.display = 'none';
        elementModal.querySelector('.modalActionSave').style.display = 'inline-block';
    };

    const botonAbrirModal = document.getElementById('openModalAdd');
    if (botonAbrirModal) {
        botonAbrirModal.addEventListener('click', openModal);
    }

    const elementosEditables = document.querySelectorAll('.botonAbrirModalEdit');
    elementosEditables.forEach(elemento => {
        elemento.addEventListener('click', async (event) => {
            const datos = JSON.parse(event.currentTarget.getAttribute('data-json'));
            updateModal(datos);
        });
    });

    return {
        element: ModalElement,
        form: form,
        close: closeModal,
        open: openModal,
        onUpdate: updateModal,
        onEvent: handleEvent,
    };
}
