import tab5Action from "./tab5-action/tab5-action.js";
import { databases, saveDataToIndexedDB, deleteDataFromIndexedDB, updateDataInIndexedDB, loadDataFromIndexedDB, getDataFromIndexedDB } from './indexedDB.js';
import socketdata from './socket/socketdata.js';
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
// const testgetFileById = async () => {
//     const fileId = '1';
//     const file = await getFileById(fileId);
//     // console.log('file', file);
//     return file;
// }
// console.log('testgetFileById', testgetFileById());
getFiles()

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
    const optionsgift = () => {
        const result = window.globalSimplifiedStates;
        console.log('optionsgift', result);
        return result;
    }
    let overlayPage = null; // Variable para almacenar la referencia a la ventana emergente

    fileList.addEventListener('click', async (event) => {
        const target = event.target;
        if (target.tagName === 'BUTTON' && target.classList.contains('play-button')) {
            const fileItem = target.closest('.file-item');
            const fileIndex = Array.from(fileItem.parentNode.children).indexOf(fileItem);
            const file = existingFiles[fileIndex];
            // console.log('file', file);
            // Additional data to be sent with the event
            const options = { check: true, select: '11', rango: '50', duracion: '15' };
            try {
                await window.api.createOverlayWindow();
                await window.api.sendOverlayData('play', { src: file.path, fileType: file.type, options });
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
            container.className = 'flex data-container';
            container.dataset.id = data.id;
            document.getElementById('loadrowactionsevents').appendChild(container);
        } else {
            // Limpiar el contenedor existente
            container.innerHTML = '';
        }
    
        // Crear el elemento de texto y agregarlo al contenedor
        const textElement = document.createElement('div');
        textElement.className = 'flex justify-center';
        console.log('data-------------createbutton', data);
        if (data.accionevento) {
            textElement.textContent = `Evento: ${data.accionevento?.nombre || 'N/A'}, Audio: ${getDataText(data["type-audio"])}, Video: ${getDataText(data["type-video"])}, Imagen: ${getDataText(data["type-imagen"])}`;
        } else {
                textElement.textContent = `Evento: ${data.accionevento?.nombre || 'N/A'}, Acción: faltando`;
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

            deleteDataFromIndexedDB(databases.MyDatabaseActionevent, data.id);
            setTimeout(() => {
                loadDataFromIndexedDB(databases.eventsDB, createElementWithButtons);
                loadDataFromIndexedDB(databases.MyDatabaseActionevent, createElementWithButtons);
                }, 1000);
            console.log('deleteDataFromIndexedDB', data);
        });
        container.appendChild(deleteButton);
    
        // Crear y agregar el botón de probar
        const testButton = document.createElement('button');
        testButton.textContent = 'Probar';
        testButton.addEventListener('click', () => {
            console.log('testButton', data);
        });
        container.appendChild(testButton);
    }
    
    function getDataText(data) {
        return data && data.select ? data.select : 'N/A';
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
        // console.log('eventmanager', eventType, "eventype data -------------------", data);
    
        let eventsfind = await getDataFromIndexedDB(databases.MyDatabaseActionevent);
    
        // Conjunto para almacenar los tipos de archivo que ya se han procesado
        let processedTypes = new Set();
    
        // Iteramos sobre cada evento encontrado
        eventsfind.forEach(eventname => {
            Object.entries(eventname).forEach(([key, value]) => {
                let splitkey = key.split('-');
    
                // Verificamos si el tipo de evento coincide y si el evento no tiene check
                if (splitkey[1] === eventType && !value.check) {
                    console.log(splitkey[1] === eventType && !value.check);
                    // console.log(splitkey, "eventsfind---------------------", eventsfind, "eventname---------------------", eventname, "eventType------------------", eventType, "value------------------", value, "key data -------------------", key);
                    return true;
                }
                // Verificamos si el tipo de evento coincide
                if (splitkey[1] === eventType) {
                    // console.log('eventname', eventname["type-imagen"], "value", value, "key data -------------------", key);
                    // console.log('eventname', eventname["type-video"], "value", value, "key data -------------------", key);
                    // console.log('eventname', eventname["type-audio"], "value", value, "key data -------------------", key);
                    // console.log("eventname---------------------", eventname, "eventType------------------", eventType, "value------------------", value, "key data -------------------", key);
                    if (eventType === 'gift') {
                        value.select = Number(value.select);
                        if (value.select !== data.giftId) {
                            return true;
                        }
                    }
                    if (value.select === data.giftId) {
                        console.log("value.select === data.giftId valor del select es igual al nombre del gift recibido", value.select === data.giftId, "data.giftId", data.giftId, "value.select", value.select);
                    }
                    // if (data.giftId) {
                    //     console.log("data.giftId", data.giftId,"value", value);
                    // }
                    // Procesamos el tipo de imagen si no ha sido procesado aún
                    if (eventname["type-imagen"] && eventname["type-imagen"].check && !processedTypes.has("image")) {
                        processedTypes.add("image");
                        getfileId(eventname["type-imagen"].select).then(srcoverlay => {
                            if (srcoverlay !== null) {
                                window.api.createOverlayWindow();
                                window.api.sendOverlayData('play', { src: srcoverlay.path, fileType: srcoverlay.type, options: eventname["type-imagen"] });
                                console.log("srcoverlay encontrado", "index", eventname["type-imagen"].select, "src", srcoverlay.path, "fileType", srcoverlay.type);
                            }
                        });
                    }
    
                    // Procesamos el tipo de video si no ha sido procesado aún
                    if (eventname["type-video"] && eventname["type-video"].check && !processedTypes.has("video")) {
                        processedTypes.add("video");
                        getfileId(eventname["type-video"].select).then(srcoverlay => {
                            if (srcoverlay !== null) {
                                window.api.createOverlayWindow();
                                window.api.sendOverlayData('play', { src: srcoverlay.path, fileType: srcoverlay.type, options: eventname["type-video"] });
                                console.log("srcoverlay encontrado", srcoverlay, "index", eventname["type-video"].select, "src", srcoverlay.path, "fileType", srcoverlay.type);
                            }
                        });
                    }
    
                    // Procesamos el tipo de audio si no ha sido procesado aún
                    if (eventname["type-audio"] && eventname["type-audio"].check && !processedTypes.has("audio")) {
                        processedTypes.add("audio");
                        getfileId(eventname["type-audio"].select).then(srcoverlay => {
                            if (srcoverlay !== null) {
                                window.api.createOverlayWindow();
                                window.api.sendOverlayData('play', { src: srcoverlay.path, fileType: srcoverlay.type, options: eventname["type-audio"] });
                                console.log("srcoverlay encontrado", srcoverlay, "index", eventname["type-audio"].select, "src");
                            }
                        });
                    }
                }
            });
        });
    }
    function giftevent(eventType, data) {
        console.log('giftevent gestion default si no existe', eventType);

    }
    const actionnameinput = document.getElementById('action-name');
    const testactionevent = document.getElementById('testactionevent');
    testactionevent.addEventListener('click', () => {
        eventmanager(actionnameinput.value, actionnameinput.value);
        // console.log('testactionevent', actionnameinput.value);
    });
    async function getfileId(id) {
        if (id === undefined || id === null) {
            return null;
        } 
        if (id === false) {
            return null;
        }
        let converidtonumber = Number(id);
        let findelement = window.api.getFileById(converidtonumber);
        // console.log('findelement', findelement,"else----------------", id, "id data -------------------", copyFiles);
        if (findelement) {
            return findelement;
        } else {
            return null;
        }
    }
    async function overlaywindow(file) {
        // try {
            await window.api.createOverlayWindow();
        //     await window.api.sendOverlayData('play', { src: file.path, fileType: file.type, additionalData });
        //     console.log('Overlay event sent');
        // } catch (error) {
        //     console.error('Error sending overlay event:', error);
        // }
        console.log('overlaywindow', file);
    }
    window.señal = (valor,data1) => {
        console.log('señal recibido', valor,"data----------------", data1);
        const {eventType, data} = valor;
        eventmanager(eventType, data);
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
        optionsgift: optionsgift(),
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


