import tab5Action from "./tab5-action/tab5-action.js";
import { databases, saveDataToIndexedDB, deleteDataFromIndexedDB, updateDataInIndexedDB, loadDataFromIndexedDB, getDataFromIndexedDB } from './indexedDB.js';
import modal from './modal/modal.js';
let copyFiles = [];
async function getFiles() {
    window.api.getFilesInFolder().then(files => {
        console.log('Files in folder:', files);
        copyFiles.push(...files);
        return files;

    }).catch(error => {
        console.error('Error fetching files:', error);
        return [];
    });
}
async function getFileById(fileId) {
    return window.api.getFileById(fileId);
}
const testgetFileById = async () => {
    const fileId = '1';
    const file = await getFileById(fileId);
    console.log('file', file);
    return file;
}
console.log('testgetFileById', testgetFileById());
getFiles()
const main = async function() {
    await modal.LoadModal();
    const modalInstance = modal.Modales[0];
    const contenedor = modalInstance.contenedor;

    modalInstance.properties.fillForm({
        nombre: 'juan',
        event1: false,
        event2: true,
        event3: false,
        event4: false,
        selection: { options: copyFiles, selected: 0 },
        aceptar: () => {
            console.log('aceptar');
            const datosFormulario = modalInstance.properties.obtenerDatos();
            saveDataToIndexedDB(databases.MyDatabaseActionevent, datosFormulario);

            console.log('Datos del formulario:', datosFormulario);
        },
        cancelar: () => {
            console.log("cancelar botón");
        },
        borrar: () => {
            console.log('borrar');
            const datosFormulario = modalInstance.properties.obtenerDatos();
            deleteDataFromIndexedDB(databases.MyDatabaseActionevent, datosFormulario);
        },
    });

    return modal.Modales;
}

main();
document.addEventListener('DOMContentLoaded', () => {
    window.api.onShowMessage((event, message) => {
        console.log(message);
    });
    const dropArea = document.getElementById('drop-area');
    const fileList = document.getElementById('file-list');

    dropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropArea.classList.add('highlight');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('highlight');
    });

    let existingFiles = JSON.parse(localStorage.getItem('existingFiles')) || [];
    dropArea.addEventListener('drop', async (event) => {
        event.preventDefault();
        dropArea.classList.remove('highlight');
        try {
        const files = event.dataTransfer.files;
        for (const file of files) {
            console.log('info:', file); // Aquí se imprime el path o la URL del archivo
            console.log('file.existingFiles', existingFiles);
            let fileExists = existingFiles.some(existingFile => 
                existingFile.name === file.name && existingFile.size === file.size
            );

            if (fileExists) {
                console.log(`El archivo "${file.name}" ya existe y tiene el mismo tamaño.`);
                alert(`El archivo "${file.name}" ya existe y tiene el mismo tamaño.`);
                continue;
            }

            if (file.path) {
                // Si el archivo tiene un path, no es necesario leerlo como Data URL
                const fileParams = { fileName: file.name, filePath: file.path };
                const confirmation = confirm(`¿Desea agregar el archivo "${file.name}"?`);
                if (confirmation) {
                    const result = await window.api.addFilePath(fileParams);
                    if (result.success) {
                        addFileToLocalStorage(fileParams);
                        loadFileList();
                    } else {
                        alert(`Error al agregar el archivo: ${result.error}`);
                    }
                }
            } else {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const fileParams = { fileToAdd: e.target.result, fileName: file.name };
                    const confirmation = confirm(`¿Desea agregar el archivo "${file.name}"?`);
                    if (confirmation) {
                        const result = await window.api.addFilePath(fileParams);
                        if (result.success) {
                            loadFileList();
                            addFileToLocalStorage(fileParams);

                        } else {
                            alert(`Error al agregar el archivo: ${result.error}`);
                        }
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    } catch (error) {
        console.error('Error processing files:', error);
    }

    });
    const addFileToLocalStorage = (fileParams) => {
        existingFiles.push(fileParams);
        localStorage.setItem('existingFiles', JSON.stringify(existingFiles));
    };
    const  loadFileList = async () => {
        const files = await window.api.getFilesInFolder();
        existingFiles = files;
        console.log('loadFileList', files);
        localStorage.setItem('existingFiles', JSON.stringify(existingFiles));
        console.log('loadFileList', files);
        fileList.innerHTML = files.map(file => `
            <div class="file-item">
                <span>${file.name}</span>
                <button onclick="deleteFile('${file.name}')">Delete</button>
                <button class="play-button">Play</button>
                ${getMediaElement(file.path, file.type)}
            </div>
        `).join('');
    };

    const getMediaElement = (filePath, fileType) => {
        if (fileType) {
            if (fileType.startsWith('image/')) {
                return `<img src="${filePath}" class="file-thumbnail" />`;
            } else if (fileType.startsWith('video/')) {
                return `<video controls class="file-thumbnail">
                            <source src="${filePath}" type="${fileType}">
                            Your browser does not support the video tag.
                        </video>`;
            } else if (fileType.startsWith('audio/')) {
                return `<audio controls class="file-thumbnail">
                            <source src="${filePath}" type="${fileType}">
                            Your browser does not support the audio tag.
                        </audio>`;
            } else {
                return `<span>Unsupported file type</span>`;
            }
        } else {
            return `<img src="${filePath}" class="file-thumbnail" />`;
        }
    };

    window.deleteFile = async (fileName) => {
        await window.api.deleteFile(fileName);
        existingFiles = existingFiles.filter(file => file.fileName !== fileName);
        localStorage.setItem('existingFiles', JSON.stringify(existingFiles));
        loadFileList();
    };

    let overlayPage = null; // Variable para almacenar la referencia a la ventana emergente

    fileList.addEventListener('click', async (event) => {
        const target = event.target;
        if (target.tagName === 'BUTTON' && target.classList.contains('play-button')) {
            const fileItem = target.closest('.file-item');
            const fileIndex = Array.from(fileItem.parentNode.children).indexOf(fileItem);
            const file = existingFiles[fileIndex];
            console.log('file', file);
            // Additional data to be sent with the event
            const additionalData = { example: 'additional data' };
            try {
                await window.api.createOverlayWindow();
                await window.api.sendOverlayData('play', { src: file.path, fileType: file.type, additionalData });
                console.log('Overlay event sent');
            } catch (error) {
                console.error('Error sending overlay event:', error);
            }
        } else if (target.tagName === 'BUTTON' && target.textContent === 'Delete') {
            const fileItem = target.closest('.file-item');
            const fileName = fileItem.querySelector('span').textContent;
            deleteFile(fileName);
        }
    });
    
    async function createElementWithButtons(dbConfig, data) {
        if (!data || !data.id) {
            console.error('Data is missing or invalid:', data);
            return;
        }
    
        // Seleccionar o crear el contenedor
        let container = document.querySelector(`.data-container[data-id="${data.id}"]`);
        if (!container) {
            container = document.createElement('div');
            container.className = 'data-container';
            container.dataset.id = data.id;
            document.getElementById('loadrowactionsevents').appendChild(container);
        } else {
            // Limpiar el contenedor existente
            container.innerHTML = '';
        }
    
        // Crear el elemento de texto y agregarlo al contenedor
        const textElement = document.createElement('p');
        if (!data.Action) {
            textElement.textContent = `Evento: ${data.evento?.nombre || 'N/A'}, Audio: ${getDataText(data["type-audio"])}, Video: ${getDataText(data["type-video"])}, Imagen: ${getDataText(data["type-imagen"])}`;
        } else {
            if (!data.Evento.select) {
                textElement.textContent = `Evento: ${data.Evento?.nombre || 'N/A'}, Acción: faltando`;
            } else {
                textElement.textContent = `Evento: ${data.Evento.nombre}, Acción: ${data.Action.select?.evento || 'N/A'}`;
            }
        }
        container.appendChild(textElement);
    
        // Crear y agregar el botón de editar
        const editButton = document.createElement('button');
        editButton.textContent = 'Editar';
        editButton.addEventListener('click', async () => {
            objectModal.onUpdate(data);
        });
        container.appendChild(editButton);
    
        // Crear y agregar el botón de borrar
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Borrar';
        deleteButton.addEventListener('click', () => {
            container.remove();
            loadDataFromIndexedDB(databases.eventsDB, createElementWithButtons);
            loadDataFromIndexedDB(databases.MyDatabaseActionevent, createElementWithButtons);
            if (!data.Action) {
                deleteDataFromIndexedDB(databases.MyDatabaseActionevent, data.id);
            } else {
                deleteDataFromIndexedDB(databases.eventsDB, data.id);
            }
            console.log('deleteDataFromIndexedDB', data);
        });
        container.appendChild(deleteButton);
    
        // Crear y agregar el botón de probar
        const testButton = document.createElement('button');
        testButton.textContent = 'Probar';
        testButton.addEventListener('click', () => {
            eventmanager("test", data);
            eventmanager("Chat", "hola");
            console.log('testButton', data);
        });
        container.appendChild(testButton);
    }
    
    function getDataText(data) {
        return data && data.select ? data.select.name : 'N/A';
    }
    
    //   const idelement = formulario.elements.namedItem('id');  
    // function addOverlayEvent(eventType, data) {
    //     if (!overlayPage || overlayPage.closed) {
    //         overlayPage = window.open('overlay.html', 'transparent', 'width=auto,height=auto,frame=false,transparent=true,alwaysOnTop=true,nodeIntegration=no');

    //     }
    //     setTimeout(() => {
    //         try {
    //             overlayPage.postMessage({ eventType, indexData: data }, '*');
    //         } catch (err) {
    //             console.error('Error sending message to overlayPage:', err);
    //         }
    //     }, 500);
    // }
    async function eventmanager(eventType, data) {
        console.log('eventmanager', eventType,"eventype data -------------------", data);
        /// if event is gift chat or other check data
        let srcoverlay;
        if (data["type-imagen"] && data["type-imagen"].check) {
            srcoverlay = await getfileId(data["type-imagen"].select);
            console.log('srcoverlay', srcoverlay.name);
                overlaywindow(srcoverlay);
                // await window.api.createOverlayWindow();
                // await window.api.sendOverlayData('play', { src: srcoverlay.path, fileType: srcoverlay.type });
            
        }  
        if (data["type-video"] && data["type-video"].check) {
            srcoverlay = await getfileId(data["type-video"].select);
            console.log('srcoverlay', srcoverlay.name);
            overlaywindow(srcoverlay);
            // await window.api.createOverlayWindow();
            // await window.api.sendOverlayData('play', { src: srcoverlay.path, fileType: srcoverlay.type });

        }  
        if (data["type-audio"] && data["type-audio"].check) {
            srcoverlay = await getfileId(data["type-audio"].select);
            console.log('srcoverlay', srcoverlay);
        }
    }
    async function getfileId(id) {
        let filedata;
        window.api.getFileById(id).then(file => {
            console.log('file', file);
            filedata = file;
        });
        return filedata;
    }
    async function overlaywindow(file) {
        // try {
        //     await window.api.createOverlayWindow();
        //     await window.api.sendOverlayData('play', { src: file.path, fileType: file.type, additionalData });
        //     console.log('Overlay event sent');
        // } catch (error) {
        //     console.error('Error sending overlay event:', error);
        // }
        console.log('overlaywindow', file);
    }
    window.señal = (valor) => {
        console.log('señal recibido', valor);
        loadDataFromIndexedDB123();
    }
    function loadDataFromIndexedDB123() {
        loadDataFromIndexedDB(databases.eventsDB, createElementWithButtons);
        loadDataFromIndexedDB(databases.MyDatabaseActionevent, createElementWithButtons);
        console.log('recargado');
    }
    loadDataFromIndexedDB123();
    loadFileList();
    let objectModal;

    tab5Action({
        elementContainer: document.getElementById('tab5-action'),
        files: existingFiles, // Los archivos que se van a mostrar en la ventana emergente
        onSave: (datos) => {console.log('onSave', datos)
            saveDataToIndexedDB(databases.eventsDB, datos)},
        onCancel: (datos) => {
            console.log('onCancel', datos);
            // Lógica para el evento onCancel
        },
    }).then((modal) => {
        objectModal = modal;
        document.getElementById('openaction').addEventListener('click', objectModal.open);
        document.getElementById('closeaction').addEventListener('click', objectModal.close);
    });
    const openActionBtn = document.getElementById('openaction');
    const closeActionBtn = document.getElementById('closeaction');
    if (openActionBtn && closeActionBtn) {
        openActionBtn.addEventListener('click', () => {
            objectModal.open(existingFiles)
        });
        closeActionBtn.addEventListener('click', () => objectModal.close());
        }
    
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
        // ipExample = "localhost:25565";
        const keyBOT = document.getElementById('keyBOT').value.trim();
        const keySERVER = document.getElementById('keySERVER').value.trim();
        serverip = keySERVER.split(':')[0];
        serverport = keySERVER.split(':')[1] || 25565;
        const keyLOGIN = document.getElementById('keyLOGIN').value.trim();
        const resultMessage = document.getElementById('resultMessage');

        const options = {
            host: serverip,
            port: serverport,
            username: keyBOT,
        };
        console.log('options', options);
        const result = await window.api.createBot(options);
        if (result.success) {
            console.log('Bot created successfully');

            window.api.onBotEvent((event, type, data) => {
                if (type === 'login') {
                    console.log('Bot logged in');
                    window.api.sendChatMessage(`${keyBOT} ${keyLOGIN}`);
                } else if (type === 'chat') {
                    console.log(`${data.username}: ${data.message}`);
                    if (data.message === 'hello') {
                        window.api.sendChatMessage('Hello there!');
                    }
                }
                console.log(result);
                resultMessage.textContent = result.message;
                console.log('%cEl bot está conectado', 'color: green');
                resultMessage.style.color = 'green';

            });
        } else {
            console.error('Failed to create bot');
            console.log('%cEl bot está desconectado', 'color: red');
            resultMessage.style.color = 'red';
        }
    });

});


