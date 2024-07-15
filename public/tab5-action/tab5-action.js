import {
    databases,
    saveDataToIndexedDB,
    updateDataInIndexedDB,
} from '../functions/indexedDB.js';
import createErrorComponent from '../htmlcomponents/errorComponent.js';
async function createModalElement() {
    let modal = document.createElement('div');
    modal.className = 'modalElement';
    modal.id = `ModalElement${Math.floor(Math.random() * 1000)}`;
    modal.innerHTML = await (await fetch('./tab5-action/tab5-action.html')).text();
    return modal;
}

export default async function tab5Action({
    elementContainer,
    filesdata = [],
    optionsgift = [],
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


    let copyFiles123 = [];

    async function getFiles123() {
        try {
            const files = await window.api.getFilesInFolder();
            copyFiles123 = [...files];
            return files;
        } catch (error) {
            console.error('Error fetching files:', error);
            return [];
        }
    }

    function validateForm() {
        const nombre = form.elements.namedItem('accionevento_nombre');
        if (!nombre || !nombre.value.trim()) {
            const errorMessage = createErrorComponent('El nombre es obligatorio.');
            errorMessage.style.display = 'block'; // Mostrar el mensaje de error
            errorMessage.style.position = 'fixed'; // Posición fija del mensaje de error
            errorMessage.style.top = '1%'; // Ajusta según la distancia deseada desde la parte superior
            errorMessage.style.right = '1%'; // Ajusta según la distancia deseada desde la parte derecha
            ModalElement.appendChild(errorMessage);

            return false;   
        }
        return true;
    }

    function obtenerDatos() {
        const datosFormulario = {};
        const nameFilter = {};

        for (const elemento of form.elements) {
            if (elemento.name) {
                if (elemento.type === 'checkbox') {
                    const numberElement = form.elements.namedItem(`${elemento.name}_number`);
                    datosFormulario[elemento.name] = {
                        checked: elemento.checked,
                        number: numberElement ? numberElement.value || 0 : 0
                    };
                } else if (elemento.type === 'select-one') {
                    datosFormulario[elemento.name] = cacheAssign[elemento.value] || elemento.value;
                } else {
                    datosFormulario[elemento.name] = elemento.value;
                }

                const [prefix] = elemento.name.split(separator);
                if (!nameFilter[prefix]) {
                    nameFilter[prefix] = {};
                }

                const [, suffix] = elemento.name.split(separator);
                if (suffix) {
                    nameFilter[prefix][suffix] = elemento.type === 'checkbox' ? elemento.checked : elemento.value;
                }
            }
        }

        const idValue = form.elements.namedItem('id').value;
        nameFilter.id = !isNaN(idValue) ? idValue : null;

        return nameFilter;
    }

    function fillForm(datos = {}) {
        for (const elemento of form.elements) {
            const { name, type } = elemento;
            let value = null;
            if (name) {
                const [prefix, suffix] = name.split(separator);
                
                if (suffix) {
                    value = datos[prefix] && datos[prefix][suffix] ? datos[prefix][suffix].check : null;

                    if (type === 'checkbox') {
                        const checkElement = form.elements.namedItem(`${name}`);
                        if (checkElement) {
                            Object.entries(datos).forEach(([clave, valor]) => {
                                const checkvalue = `${clave}_check`;
                                if (checkvalue === name) {
                                    elemento.checked = valor.check;
                                }
                            });
                        }
                        const numberElement = form.elements.namedItem(`${name}_number`);
                        if (numberElement) {
                            numberElement.value = datos[prefix] && datos[prefix][suffix] ? datos[prefix][suffix].number || '' : '';
                        }
                    } else {
                        elemento.value = datos[prefix] && datos[prefix][suffix] ? datos[prefix][suffix] || '' : '';
                    }
                } else {
                    value = datos[name] ? datos[name].check : null;
                    if (type === 'checkbox') {
                        elemento.checked = datos[name] ? datos[name].checked || false : false;
                        const numberElement = form.elements.namedItem(`${name}_number`);
                        if (numberElement) {
                            numberElement.value = datos[name] ? datos[name].number || '' : '';
                        }
                    } else if (type === 'select-one') {
                        elemento.value = datos[name] || '';
                        elemento.selectedIndex = datos[name] ? datos[name].index || 0 : 0;
                    } else if (type === 'range') {
                        elemento.value = datos[name] || elemento.defaultValue;
                    } else {
                        elemento.value = datos[name] || '';
                    }
                }
            }
        }
    }

    function resetForm() {
        for (const elemento of form.elements) {
            if (elemento.name) {
                if (elemento.type === 'checkbox') {
                    elemento.checked = false;
                    const numberElement = form.querySelector(`#${elemento.name}_number`);
                    if (numberElement) {
                        numberElement.value = 5;
                    }
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

    function setupFormActions() {
        elementModal.querySelector('.modalActionAdd').addEventListener('click', async () => {
            if (!validateForm()) return;
            const nameFilter = obtenerDatos();
            if (nameFilter.id) {
                await updateDataInIndexedDB(databases.MyDatabaseActionevent, nameFilter);
            } else {
                await saveDataToIndexedDB(databases.MyDatabaseActionevent, nameFilter);
            }
            elementModal.style.display = 'none';
        });

        elementModal.querySelector('.modalActionClose').addEventListener('click', () => {
            elementModal.style.display = 'none';
            onCancel();
        });

        elementModal.querySelector('.modalActionSave').addEventListener('click', async () => {
            if (!validateForm()) return;
            const nameFilter = obtenerDatos();
            elementModal.style.display = 'none';
            if (nameFilter.id) {
                await updateDataInIndexedDB(databases.MyDatabaseActionevent, nameFilter);
            } else {
                await saveDataToIndexedDB(databases.MyDatabaseActionevent, nameFilter);
            }
        });
    }

    async function filesform() {
        let files = await getFiles123();

        const selectVideo = form.elements.namedItem('type-video_select');
        const selectImage = form.elements.namedItem('type-imagen_select');
        const selectAudio = form.elements.namedItem('type-audio_select');

        if (selectVideo) selectVideo.innerHTML = '';
        if (selectImage) selectImage.innerHTML = '';
        if (selectAudio) selectAudio.innerHTML = '';

        let hasVideo = false;
        let hasImage = false;
        let hasAudio = false;

        files.forEach(file => {
            const optionElement = document.createElement('option');
            optionElement.textContent = file.name;
            optionElement.value = file.index;

            let selectElement = null;
            if (file.type.startsWith('video')) {
                selectElement = selectVideo;
                hasVideo = true;
            } else if (file.type.startsWith('image')) {
                selectElement = selectImage;
                hasImage = true;
            } else if (file.type.startsWith('audio')) {
                selectElement = selectAudio;
                hasAudio = true;
            }

            if (selectElement) {
                selectElement.appendChild(optionElement);
            }

            cacheAssign[file.path] = file;
        });

        addNoElementsOption(selectVideo, hasVideo);
        addNoElementsOption(selectImage, hasImage);
        addNoElementsOption(selectAudio, hasAudio);
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
        const availableGifts = optionsgift[0].availableGifts || [];
        availableGifts.forEach(gift => {
            const optionElement = document.createElement('option');
            optionElement.textContent = gift.name;
            optionElement.value = gift.giftId;
            giftselect.appendChild(optionElement);
        });
    }

    const exportFormData = () => {
        const formData = obtenerDatos();
        return JSON.stringify(formData, null, 2);
    };

    const importFormData = (importedData) => {
        try {
            const formData = JSON.parse(importedData);
            fillForm(formData);
            alert('Datos importados correctamente.');
        } catch (error) {
            alert('Error al importar los datos. Asegúrate de que el formato sea correcto.');
        }
    };

    setupFormActions();
    filesform();
    populateGiftSelect(optionsgift);

    return {
        element: ModalElement,
        form: form,
        close: () => {
            filesform();
            elementModal.style.display = 'none';
            ModalElement = null;
        },
        open: (newFiles = null) => {
            resetForm();
            filesform();
            elementModal.style.display = 'flex';
            elementModal.querySelector('.modalActionAdd').style.display = 'inline-block';
            elementModal.querySelector('.modalActionSave').style.display = 'none';
        },
        onUpdate: (datos) => {
            filesform();
            fillForm(datos);
            elementModal.style.display = 'flex';
            elementModal.querySelector('.modalActionAdd').style.display = 'none';
            elementModal.querySelector('.modalActionSave').style.display = 'inline-block';
        },
    };
}
