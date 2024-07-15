import tab5Action from "./tab5-action/tab5-action.js";
import { databases, saveDataToIndexedDB, deleteDataFromIndexedDB, updateDataInIndexedDB, loadDataFromIndexedDB, getDataFromIndexedDB, observer } from './functions/indexedDB.js';
import { replaceVariables } from "./functions/replaceVariables.js";
import { TTS, leerMensajes, skipAudio } from './functions/tts.js';
import { createElementWithButtons } from "./utils/createtable.js";
let isReading = null;
let copyFiles = [];
let objectModal = null;
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
                    if (value.select === data.giftId) {
                        console.log("value.select === data.giftId valor del select es igual al nombre del gift recibido", value.select === data.giftId, "data.giftId", data.giftId, "value.select", value.select);
                    } else if (value.select !== data.giftId) {
                        return true;
                    }
                }
                if (eventType === 'likes') {
                    if (value.number === undefined || value.number === null) {
                        value.number = 2;
                    }
                    value.number = Number(value.number);
                    console.log("LIKES likes value.select", value.number, "data.likeCount", data.likeCount);

                    if (value.number === data.likeCount) {
                        console.log("value.number es menor a likeCount recibido", value.number <= data.likeCount, "data.likeCount", data.likeCount, "value.select", value.select);
                    } else if (value.number <= data.likeCount) {
                        console.log("value.number es menor a likeCount recibido", value.number <= data.likeCount, "data.likeCount", data.likeCount, "value.select", value.select);
                    } else if (value.number >= data.likeCount) {
                        console.log("value.number es mayor a likeCount recibido", value.number >= data.likeCount, "data.likeCount", data.likeCount, "value.select", value.select);
                        return true;
                    }
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
                if (eventname["type-profile"] && eventname["type-profile"].check && !processedTypes.has("profile")) {
                    processedTypes.add("profile");
                            window.api.createOverlayWindow();
                            eventname["type-profile"].texto = replaceVariables(eventname["type-profile"].texto, data);
                            console.log("text profile", eventname["type-profile"]);
                            window.api.sendOverlayData('play', { src: data.profilePictureUrl, fileType: "image/png", options: eventname["type-profile"] },true);
                            console.log("dataprofile encontrado", data.profilePictureUrl, "src");
                }
                // if (eventname["type-text"] && eventname["type-text"].check && !processedTypes.has("text")) {
                //     processedTypes.add("text");
                //     window.api.createOverlayWindow();
                //     window.api.sendOverlayData('play', { src: eventname["type-text"].select, fileType: "text/plain", options: eventname["type-text"] },true);
                //     console.log("text overlay", eventname["type-text"]);
                // }
            }
        });
    });
}
async function getFiles() {
    try {
        const files = await window.api.getFilesInFolder();
        console.log('Files in folder:', files);

        // Reemplazar el contenido de copyFiles con los nuevos archivos obtenidos
        copyFiles = [...files];
        console.log('Updated copyFiles:', copyFiles);

        return files;
    } catch (error) {
        console.error('Error fetching files:', error);
        return [];
    }
}

function populateVoiceList() {
    if (typeof speechSynthesis === "undefined") {
      return;
    }
    const voices = speechSynthesis.getVoices();
    for (let i = 0; i < voices.length; i++) {
      const option = document.createElement("option");
      option.textContent = `${voices[i].name} (${voices[i].lang})`;
  
      option.setAttribute("data-lang", voices[i].lang);
      option.setAttribute("data-name", voices[i].name);
      document.getElementById("voiceSelect").appendChild(option);
    }
  }
  
  
  window.speechSynthesis.onvoiceschanged = function() {
    populateVoiceList();
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
    if (document.getElementById('overlayOff').checked === true) {
        console.log('overlayoff', document.getElementById('overlayOff').checked);
        window.api.createOverlayWindow();
    } else {
        console.log('overlayoff', document.getElementById('overlayOff').checked);
    }
    window.api.onShowMessage((event, message) => {
        console.log(message);
    });
    document.getElementById("testvoicebtn").addEventListener("click", function() {
        const messages = document.getElementById("testvoice").value;
        handleleermensaje(messages);
        console.log('testvoicebtn', messages);
    });
    window.signal = (data) => {
        console.log('signal recived', data);
        handleleermensaje(data);
    }
    async function handleleermensaje(text) {
        const selectedVoice = document.querySelector('input[name="selectvoice"]:checked');
        const selectedCommentType = document.querySelector('input[name="comment-type"]:checked').value;
        
        
            let shouldRead = false;
            
            if (selectedCommentType === 'any-comment') {
                shouldRead = true;
            } else if (selectedCommentType === 'dot-comment' && text.startsWith('.')) {
                shouldRead = true;
            } else if (selectedCommentType === 'slash-comment' && text.startsWith('/')) {
                shouldRead = true;
            } else if (selectedCommentType === 'command-comment') {
                const commandPrefix = document.getElementById('command').value;
                if (text.startsWith(commandPrefix)) {
                    shouldRead = true;
                    text = text.replace(commandPrefix, '');
                }
            }

            if (shouldRead && text && !isReading) {
                console.log('text', text);
             if (selectedVoice.id === 'selectvoice2') {
                new TTS(text);
            } else if (selectedVoice.id === 'selectvoice1') {
                leerMensajes(text);
            }
        }

        return true;
    }

    const dropArea = document.getElementById('drop-area');
    const fileList = document.getElementById('file-list');
    
    dropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropArea.classList.add('highlight');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('highlight');
    });

    dropArea.addEventListener('drop', async (event) => {
        event.preventDefault();
        dropArea.classList.remove('highlight');
        try {
        const files = event.dataTransfer.files;
        for (const file of files) {
            console.log('info:', file); // Aquí se imprime el path o la URL del archivo

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
    const  loadFileList = async () => {
        const files = await window.api.getFilesInFolder();
        console.log('loadFileList', files);
        fileList.innerHTML = files.map(file => `
            <div class="file-item">
                <input type="text" value="${file.name}" class="input input-ghost" disabled>
                <button onclick="deleteFile('${file.name}')" class="deleteButton">Delete</button>
                <button class="play-button" id="playbutton-${file.index}">Play</button>
                ${getMediaElement(file.path, file.type)}
            </div>
        `).join('');
    };

    const getMediaElement = (filePath, fileType) => {
        if (fileType) {
            if (fileType.startsWith('image/')) {
                return `<img src="file:///${filePath}" class="file-thumbnail" />`;
            } else if (fileType.startsWith('video/')) {
                return `<video controls class="file-thumbnail">
                            <source src="file:///${filePath}" type="${fileType}">
                            Your browser does not support the video tag.
                        </video>`;
            } else if (fileType.startsWith('audio/')) {
                return `<audio controls class="file-thumbnail">
                            <source src="file:///${filePath}" type="${fileType}">
                            Your browser does not support the audio tag.
                        </audio>`;
            } else {
                return `<span>Unsupported file type</span>`;
            }
        } else {
            return `<img src="file:///${filePath}" class="file-thumbnail" />`;
        }
    };

    window.deleteFile = async (fileName) => {
        await window.api.deleteFile(fileName);
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
            // Additional data to be sent with the event
            const options = { check: true, select: '11', rango: '50', duracion: '15' };
            const fileindex = event.target.id.split('-')[1];
            const file = await getfileId(fileindex);
            console.log('file', file);

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



    

    if (localStorage.getItem('lastLike')) {
        eventmanager('likes', JSON.parse(localStorage.getItem('lastLike')));

    }
    if (localStorage.getItem('lastChatItem')) {
        eventmanager('chat', JSON.parse(localStorage.getItem('lastChatItem')));
        console.log('lastChatItem', JSON.parse(localStorage.getItem('lastChatItem')));
    }

    // function giftevent(eventType, data) {
    //     console.log('giftevent gestion default si no existe', eventType);

    // }
    const actionnameinput = document.getElementById('action-name');
    const testactionevent = document.getElementById('testactionevent');
    testactionevent.addEventListener('click', () => {
        // eventmanager(actionnameinput.value, actionnameinput.value);
        let eventtype = actionnameinput.value.split('-')[0];
        let datagiftname = actionnameinput.value.split('-')[1];
        let playername = "test";
        let data = {
            giftName: datagiftname,
            repeatCount: 1,
            giftId: 5655, /// rose id 5655
            repeatEnd: false,
            diamondCount: 0,
            nickname: playername,
            uniqueId: playername
        }
        eventmanager(eventtype, data);
        console.log('testactionevent',eventtype, data);
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
    window.señal = (valor) => {
        console.log('señal recibido', valor,"data----------------");
        const {eventType, data} = valor;
        // eventmanager(eventType, data);
    }
    function loadDataFromIndexedDB123() {
        loadDataFromIndexedDB(databases.eventsDB, createElementWithButtons);
        loadDataFromIndexedDB(databases.MyDatabaseActionevent, createElementWithButtons);
        console.log('recargado');
    }
    loadDataFromIndexedDB123();
    observer.subscribe(loadDataFromIndexedDB123);
    loadFileList();
    tab5Action({
        elementContainer: document.getElementById('tab5-action'),
        files: getFiles(), // Los archivos que se van a mostrar en la ventana emergente
        optionsgift: optionsgift(),
        onSave: (datos) => {console.log('onSave', datos)
            loadDataFromIndexedDB123();
            saveDataToIndexedDB(databases.eventsDB, datos)},
        onCancel: (datos) => {
            console.log('onCancel', datos);
            getFiles();
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
            objectModal.open()
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

    const skipButton = document.getElementById('skip-button');
    skipButton.addEventListener('click', skipAudio);
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
// async function createElementWithButtons(dbConfig, data) {
//     if (!data || !data.id) {
//         console.error('Data is missing or invalid:', data);
//         return;
//     }

//     const table = getOrCreateTableContainer();
//     const row = getOrCreateRow(data);

//     const nombreCell = createTextCell(data.accionevento?.nombre || 'N/A');
//     const imagenCell = createTextCell(await getDataText(data["type-imagen"]));
//     const videoCell = createTextCell(await getDataText(data["type-video"]));
//     const sonidoCell = createTextCell(await getDataText(data["type-audio"]));
    
//     row.appendChild(nombreCell);
//     row.appendChild(imagenCell);
//     row.appendChild(videoCell);
//     row.appendChild(sonidoCell);

//     // Crear celdas de eventos
//     const eventosCell = document.createElement('td');
//     Object.entries(data).forEach(([key, value]) => {
//         if (key.startsWith('event-')) {
//             const eventname = key.split('-')[1];
//             const eventText = value && value.check ? eventname : 'false';
//             if (eventText === 'false') {
//                 return;
//             }
//             const eventTextNode = document.createTextNode(eventText + ' ');
//             eventosCell.appendChild(eventTextNode);
//             console.log(eventname, key, value);
//         }
//     });
//     row.appendChild(eventosCell);

//     const buttonCell = createButtonCell(data, row);
//     row.appendChild(buttonCell);

//     table.appendChild(row);
// }
// async function getDataText(data) {
//     if (data.check === false) {
//         return false;
//     }
//     let datatextname = await getfileId(data.select);
//     if (datatextname) {
//         return datatextname.name;
//     }
//     return data && data.select ? data.select : 'N/A';
// }
// function getOrCreateTableContainer() {
//     let table = document.querySelector('.data-table');
//     if (!table) {
//         table = document.createElement('table');
//         table.className = 'data-table';
//         document.getElementById('loadrowactionsevents').appendChild(table);

//         // Crear y agregar el encabezado de la tabla
//         const headerRow = document.createElement('tr');
//         const headers = ['Nombre', 'Imagen', 'Video', 'Sonido', 'Eventos', 'Botones'];
//         headers.forEach(headerText => {
//             const headerCell = document.createElement('td');
//             headerCell.textContent = headerText;
//             headerRow.appendChild(headerCell);
//         });
//         table.appendChild(headerRow);
//     }
//     return table;
// }
// function getOrCreateRow(data) {
//     let row = document.querySelector(`.data-row[data-id="${data.id}"]`);
//     if (!row) {
//         row = document.createElement('tr');
//         row.className = 'data-row';
//         row.dataset.id = data.id;
//     } else {
//         // Limpiar la fila existente
//         row.innerHTML = '';
//     }
//     return row;
// }
// function createTextCell(text) {
//     const textCell = document.createElement('td');
//     textCell.textContent = text;
//     return textCell;
// }
// function createButtonCell(data, row) {
//     const buttonCell = document.createElement('td');
//     buttonCell.className = 'button-cell';

//     const editButton = document.createElement('button');
//     editButton.textContent = 'Editar';
//     editButton.className = "custombutton";
//     editButton.addEventListener('click', async () => {
//         objectModal.onUpdate(data);
//     });

//     const deleteButton = document.createElement('button');
//     deleteButton.textContent = 'Borrar';
//     deleteButton.className = "deleteButton";
//     deleteButton.addEventListener('click', () => {
//         row.remove();
//         deleteDataFromIndexedDB(databases.MyDatabaseActionevent, data.id);
//         setTimeout(() => {
//             loadDataFromIndexedDB(databases.eventsDB, createElementWithButtons);
//             loadDataFromIndexedDB(databases.MyDatabaseActionevent, createElementWithButtons);
//         }, 1000);
//         console.log('deleteDataFromIndexedDB', data);
//     });

//     const testButton = document.createElement('button');
//     testButton.textContent = 'Probar';
//     testButton.className = "custombutton";
//     testButton.addEventListener('click', () => {
//         console.log('testButton', data);
//     });

//     buttonCell.appendChild(editButton);
//     buttonCell.appendChild(deleteButton);
//     buttonCell.appendChild(testButton);

//     return buttonCell;
// }
export { getfileId, objectModal, eventmanager };