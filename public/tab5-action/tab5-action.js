import {
    databases,
    saveDataToIndexedDB,
    updateDataInIndexedDB,
} from '../indexedDB.js';

export default async function tab5Action({
    elementContainer,
    files = [],
    optionsgift = [],
    onCancel = () => {},
    separator = "_"
}) {
    let ModalElement = document.createElement('div');
    const idModal = `ModalElement${Math.floor(Math.random() * 1000)}`;
    const cacheAssign = {};

    ModalElement.className = 'modalElement';
    ModalElement.id = idModal;
    ModalElement.innerHTML = await (await fetch('./tab5-action/tab5-action.html')).text();
    elementContainer.parentNode.insertBefore(ModalElement, elementContainer.nextSibling);
    elementContainer.remove();

    const elementModal = document.getElementById(idModal);
    elementModal.style.display = 'none';

    const form = elementModal.querySelector('.tab5-action');
    form.addEventListener('submit', event => event.preventDefault());

    let errorMessage = createErrorMessage();
    ModalElement.appendChild(errorMessage);

    setTimeout(() => errorMessage.style.display = 'none', 5000);

    function createErrorMessage() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.color = 'red';
        errorDiv.style.display = 'none';
        errorDiv.style.zIndex = '100';
        errorDiv.textContent = 'El nombre es obligatorio.';
        return errorDiv;
    }

    function validateForm() {
        const nombre = form.elements.namedItem('accionevento_nombre');
        if (!nombre || !nombre.value.trim()) {
            errorMessage.style.display = 'block';
            errorMessage.style.position = 'absolute';
            errorMessage.style.top = '26%';
            errorMessage.style.left = '40%';
            return false;
        }
        errorMessage.style.display = 'none';
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
    
    

    const fillForm = (datos = {}) => {
        const booleanElements = {};
        for (const elemento of form.elements) {
            const { name, type } = elemento;
            let value = null;
            if (name) {
                const [prefix, suffix] = name.split(separator);
                
                if (suffix) {
                    value = datos[prefix] && datos[prefix][suffix] ? datos[prefix][suffix].check : null;

                    if (type === 'checkbox') {
                        // console.log('elemento.name', elemento.name, elemento.checked, elemento.value,"---------------------elemento",elemento);
                        // elemento.checked = elemento.value === 'false' ? false : true;
                        const checkElement = form.elements.namedItem(`${name}`);
                        const checkdataproperity = datos.hasOwnProperty(name)

                        if (checkElement){ 
                        Object.entries(datos).forEach(([clave, valor]) => {
                            const checkvalue = `${clave}_check`;
                            if (checkvalue === name) {
                                console.log('${clave}_check', checkvalue,"clave---------nombre",name,"valor--------",valor,"----------------------");
                                elemento.checked = valor.check;
                                return true;
                            } else if (checkvalue === `eventos_check`) {
                                console.log('eventos_check', checkvalue,"clave---------nombre",name,"valor--------",valor,valor[name]);
                            }
                            
                        });
                            // console.log('checkElement', checkElement,"datos",datos[name],"datacheck",datos[name]);
                            // elemento.checked = value === 'false' ? false : true;
                            }
                        // console.log('checkElement', checkElement,`${name}_check`);
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
            if (value !== null && typeof value === 'boolean') {
                booleanElements[name] = value;
            }
        }
        console.log('Boolean elements found:', booleanElements);
    };
    

    const resetForm = () => {
        for (const elemento of form.elements) {
            if (elemento.name) {
                if (elemento.type === 'checkbox') {
                    elemento.checked = false;
                    const numberElement = form.querySelector(`#${elemento.name}_number`);
                    if (numberElement) {
                        numberElement.value = ''; // Asegúrate de manejar el valor del campo de número correctamente
                    }
                } else if (elemento.type === 'select-one') {
                    elemento.selectedIndex = 0;
                } else if (elemento.type === 'range') {
                    elemento.value = elemento.defaultValue;
                } else {
                    elemento.value = '';
                }
            }
        }
    };
    
    
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
// Limpiar los elementos select correspondientes
const selectVideo = form.elements.namedItem('type-video_select');
const selectImage = form.elements.namedItem('type-imagen_select');
const selectAudio = form.elements.namedItem('type-audio_select');

if (selectVideo) selectVideo.innerHTML = '';
if (selectImage) selectImage.innerHTML = '';
if (selectAudio) selectAudio.innerHTML = '';

// Banderas para comprobar si se añadieron elementos
let hasVideo = false;
let hasImage = false;
let hasAudio = false;

// Iterar sobre los archivos y agregar opciones a los selects correspondientes
files.forEach(file => {
    // Creamos el elemento option
    const optionElement = document.createElement('option');
    optionElement.textContent = file.name;
    optionElement.value = file.index;

    // Seleccionamos el select correspondiente según el tipo de archivo
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
    } else {
        console.log('No se ha encontrado el tipo de archivo');
    }

    // Si encontramos el select correspondiente, hacemos el append
    if (selectElement) {
        selectElement.appendChild(optionElement);
    }

    console.log('selectname', selectElement, file);
    cacheAssign[file.path] = file;
});

// Añadir una opción "Sin elementos" si no se añadió ninguna opción
if (!hasVideo && selectVideo) {
    const optionElement = document.createElement('option');
    optionElement.textContent = 'Sin elementos';
    optionElement.value = 'false';
    selectVideo.appendChild(optionElement);
}

if (!hasImage && selectImage) {
    const optionElement = document.createElement('option');
    optionElement.textContent = 'Sin elementos';
    optionElement.value = 'false';
    selectImage.appendChild(optionElement);
}

if (!hasAudio && selectAudio) {
    const optionElement = document.createElement('option');
    optionElement.textContent = 'Sin elementos';
    optionElement.value = 'false';
    selectAudio.appendChild(optionElement);
}
const giftselect = document.getElementById('event-gift_select');
const availableGifts = optionsgift[0].availableGifts || []; // Asegúrate de que availableGifts esté definido y sea un array
console.log('optionsgift', optionsgift[0].availableGifts);
availableGifts.forEach(gift => {
    const optionElement = document.createElement('option');
    optionElement.textContent = gift.name;
    optionElement.value = gift.giftId;
    // console.log('optionElement', optionElement);
    // console.log('gift', gift);gift.name + '_' +
    giftselect.appendChild(optionElement);
});

    

    const exportFormData = () => {
        const formData = obtenerDatos();
        const jsonData = JSON.stringify(formData, null, 2);
        return jsonData;
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

    return {
        element: ModalElement,
        form: form,
        close: () => {
            elementModal.style.display = 'none';
            ModalElement = null;
        },
        open: (newFiles = null) => {
            resetForm();
            elementModal.style.display = 'flex';
            elementModal.querySelector('.modalActionAdd').style.display = 'inline-block';
            elementModal.querySelector('.modalActionSave').style.display = 'none';
        },
        onUpdate: (datos) => {
            fillForm(datos);
            elementModal.style.display = 'flex';
            elementModal.querySelector('.modalActionAdd').style.display = 'none';
            elementModal.querySelector('.modalActionSave').style.display = 'inline-block';
        },
    };
}
