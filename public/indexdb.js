import { sendReplacedCommand } from './app.js';
import { replaceVariables } from './functions/replaceVariables.js';
import { loadData, createGiftSelect, getAvailableGifts } from './functions/giftmanager.js';
let db;
let dbReady = false;

let indexedavailableGifts = [];
const request = indexedDB.open("eventDatabase", 2); // Incrementa la versión de la base de datos

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("addgift-button").addEventListener("click", () => addEvent("gift"));
    document.getElementById("addchat-button").addEventListener("click", () => addEvent("chat"));
    document.getElementById("addlikes-button").addEventListener("click", () => addEvent("likes"));
    document.getElementById("testHandleevent").addEventListener("click", testHandleEvent123);
    setTimeout(loadOptionsGift1, 4000);
});

request.onupgradeneeded = (event) => {
    db = event.target.result;

    const stores = ["gift", "chat", "likes"];
    stores.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: "id", autoIncrement: true });
        }
    });
};

request.onsuccess = (event) => {
    db = event.target.result;
    displayEvents("gift");
    displayEvents("chat");
    displayEvents("likes");
};

request.onerror = (event) => {
    console.error("Database error: ", event.target.errorCode);
};

function optionsgiftdb() {
    const result = getAvailableGifts();
    console.log("optionsgiftdb", result);
    return result;
};

function loadOptionsGift1() {
    const indexdboptionsgift = optionsgiftdb();
    if (indexdboptionsgift) {
        indexedavailableGifts = indexdboptionsgift || [];
        const selectInputgifts = document.getElementById("gift-title");
        console.log('indexdboptionsgift', indexdboptionsgift, indexedavailableGifts, selectInputgifts);
        indexedavailableGifts.forEach(gift => {
            const optionElement = document.createElement('option');
            optionElement.textContent = gift.name;
            optionElement.value = gift.name;
            selectInputgifts.appendChild(optionElement);
        });
    }

}

function addEvent(storeName) {
    let eventTitle, eventDescription;

    if (storeName === "gift") {
        eventTitle = document.getElementById(`${storeName}-title`).value;
    } else {
        eventTitle = document.getElementById(`${storeName}-title`).value;
    }

    eventDescription = document.getElementById(`${storeName}-description`).value;

    if (eventTitle === "" || eventDescription === "") {
        alert("Ingrese tanto un título como una descripción.");
        return;
    }
    console.log(storeName);
    const transaction = db.transaction([storeName], "readwrite");
    const objectStore = transaction.objectStore(storeName);

    const request = objectStore.add({ title: eventTitle, description: eventDescription });

    request.onsuccess = () => {
        document.getElementById(`${storeName}-title`).value = "";
        document.getElementById(`${storeName}-description`).value = "";
        displayEvents(storeName);
    };

    request.onerror = (event) => {
        console.error(`Agregar ${storeName}, error: `, event.target.errorCode);
    };
}

function deleteEvent(storeName, id) {
    const transaction = db.transaction([storeName], "readwrite");
    const objectStore = transaction.objectStore(storeName);

    const request = objectStore.delete(id);

    request.onsuccess = () => {
        displayEvents(storeName);
    };

    request.onerror = (event) => {
        console.error(`Borrar ${storeName}, error: `, event.target.errorCode);
    };
}

function updateEvent(storeName, id, newTitle, newDescription) {
    const transaction = db.transaction([storeName], "readwrite");
    const objectStore = transaction.objectStore(storeName);

    const request = objectStore.get(id);

    request.onsuccess = (event) => {
        dbReady = true;
        const eventItem = event.target.result;
        eventItem.title = newTitle;
        eventItem.description = newDescription;

        const updateRequest = objectStore.put(eventItem);

        updateRequest.onsuccess = () => {
            displayEvents(storeName);
        };
        updateRequest.onerror = (event) => {
            console.error(`Editar ${storeName} error: `, event.target.errorCode);
        };
    };

    request.onerror = (event) => {
        console.error(`Retrieve ${storeName} error: `, event.target.errorCode);
    };
}
function eventTypeExists(eventType) {
    return dbReady && db.objectStoreNames.contains(eventType);
}
function displayEvents(storeName) {
    const transaction = db.transaction([storeName], "readonly");
    const objectStore = transaction.objectStore(storeName);

    const request = objectStore.getAll();

    request.onsuccess = (event) => {
        const eventList = document.getElementById(`${storeName}-list`);
        eventList.innerHTML = "";
        console.log(event.target.result);
        event.target.result.forEach((eventItem) => {
            const listItem = document.createElement("li");

            const titleDiv = document.createElement("div");
            titleDiv.textContent = eventItem.title;

            const descriptionDiv = document.createElement("div");
            descriptionDiv.textContent = eventItem.description;

            const editButton = document.createElement("button");
            editButton.textContent = "Editar";
            editButton.className = "edit-button";
            editButton.onclick = () => {
                titleDiv.style.display = 'none';
                descriptionDiv.style.display = 'none';
                editButton.style.display = 'none';
                titleInput.style.display = 'inline-block';
                titleInput.style.width = '100%';
                descriptionInput.style.display = 'inline-block';
                descriptionInput.style.marginTop = '10px';
                descriptionInput.style.width = '100%';
                saveButton.style.display = 'inline-block';
            };

            let titleInput;
            if (storeName === "gift") {
                titleInput = document.createElement("select");
                indexedavailableGifts.forEach(gift => {
                    const optionElement = document.createElement('option');
                    optionElement.textContent = gift.name;
                    optionElement.value = gift.name;
                    titleInput.appendChild(optionElement);
                });
            } else {
                titleInput = document.createElement("input");
                titleInput.type = storeName === "likes" ? "number" : "text";
            }
            titleInput.style.display = 'none';
            titleInput.value = eventItem.title;

            const descriptionInput = document.createElement("textarea");
            descriptionInput.className = "textarea textarea-primary";
            descriptionInput.value = eventItem.description;
            descriptionInput.style.display = 'none';

            const saveButton = document.createElement("button");
            saveButton.textContent = "Guardar";
            saveButton.className = "save-button";
            saveButton.style.display = 'none';
            saveButton.onclick = () => {
                updateEvent(storeName, eventItem.id, titleInput.value, descriptionInput.value);
            };

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Borrar";
            deleteButton.className = "deleteButton";
            deleteButton.onclick = () => deleteEvent(storeName, eventItem.id);

            listItem.appendChild(titleDiv);
            listItem.appendChild(descriptionDiv);
            listItem.appendChild(titleInput);
            listItem.appendChild(descriptionInput);
            listItem.appendChild(editButton);
            listItem.appendChild(saveButton);
            listItem.appendChild(deleteButton);

            eventList.appendChild(listItem);
        });
    };

    request.onerror = (event) => {
        console.error(`Display ${storeName} error: `, event.target.errorCode);
    };
}

function testHandleEvent123() {
    const eventType = document.getElementById('eventType').value;
    const data = getTestData(eventType);
    minecraftlive(eventType, data);
}

function getTestData(eventType) {
    const dataInput = document.getElementById('data').value;
    switch (eventType) {
        case 'gift':
            return { giftName: dataInput };
        case 'chat':
            return { comment: dataInput };
        case 'likes':
            return { likeCount: dataInput };
        default:
            return null;
    }
}

function getMinecraftcheckbox() {
    const MinecraftLivetoggle = document.getElementById("MinecraftLive");
    return MinecraftLivetoggle.checked;
}
export function Minecraftlivedefault(eventType, data) {
    if (!getMinecraftcheckbox()) return;
    
    const commandjsonlist = localStorage.getItem('commandjsonlist');
    const commandjson = JSON.parse(commandjsonlist);

    if (commandjson && commandjson[eventType] && commandjson[eventType].default) {
        const defaultCommand = commandjson[eventType].default;
        console.log(defaultCommand);
        // defaultCommand.forEach(command => {
        //     const replacedCommand = replaceVariables(command, data);
        //     sendReplacedCommand(replacedCommand)
        //     console.log(replacedCommand);
        // });
        ProcessMinecraftCommands(defaultCommand, data, 200); // Agregar delay a los comandos predeterminados
    } else {
        console.error(`No se encontraron comandos predeterminados para el evento "${eventType}"`);
    }
}

export function minecraftlive(eventType, data) {
    const MinecraftLivetoggle = getMinecraftcheckbox();

    if (!MinecraftLivetoggle) {
        return;
    }
    if (!eventTypeExists(eventType)) {
        console.log(`El tipo de evento "${eventType}" no existe en la base de datos. Ejecutando comandos predeterminados.`);
        Minecraftlivedefault(eventType, data);
        return;
    }
    const transaction = db.transaction([eventType], "readonly");
    const objectStore = transaction.objectStore(eventType);
    const request = objectStore.getAll();

    request.onsuccess = (event) => {
        const results = event.target.result;
        console.log(results);

        let foundMatch = false;

        results.forEach(result => {
            if (eventType === 'gift' && result.title === data.giftName) {
                const eventCommands = result.description.split('\n');
                ProcessMinecraftCommands(eventCommands, data);
                foundMatch = true;
            } else if (eventType === 'chat' && result.title === data.comment) {
                const eventCommands = result.description.split('\n');
                ProcessMinecraftCommands(eventCommands, data);
                foundMatch = true;
            } else if (eventType === 'likes' && result.title >= data.likeCount) {
                const eventCommands = result.description.split('\n');
                ProcessMinecraftCommands(eventCommands, data);
                foundMatch = true;
            }
        });

        if (!foundMatch) {
            console.log("Minecraftlivedefault");
            Minecraftlivedefault(eventType, data);
        }
    };

    request.onerror = (event) => {
        console.error("Display error: ", event.target.errorCode, request);
        Minecraftlivedefault(eventType, data);
    };
}
                            
function ProcessMinecraftCommands(eventCommands, data, delay = 100) {
    let index = 0;

    function sendNextCommand() {
        if (index < eventCommands.length) {
            const command = eventCommands[index];
            if (command) {
                const replacedCommand = replaceVariables(command, data);
                sendReplacedCommand(replacedCommand);
                console.log(replacedCommand);
            }
            index++;
            setTimeout(sendNextCommand, delay); // Llama a la función recursivamente con un retraso
        }
    }

    sendNextCommand(); // Inicia el envío de comandos
}
document.getElementById("add-event-button").addEventListener("click", () => addEventFromTextarea());
function parseGiftEvent(data) {
    const lines = data.split('\n');
    const storeName = document.getElementById("event-store-name").value;
    const events = [];

    let currentEvent = null;

    lines.forEach(line => {
        line = line.trim();
        if (line.includes(':') && !line.startsWith('/')) {
            if (currentEvent) {
                events.push(currentEvent);
            }
            const [title, ...commands] = line.split(':');
            currentEvent = {
                title: title.trim(),
                commands: commands.join(':').trim().split('\n')
                    .map(command => command.trim())
                    .filter(command => command !== '')
            };
        } else if (line.startsWith('/')) {
            if (currentEvent) {
                currentEvent.commands.push(line.trim());
            }
        }
    });

    if (currentEvent) {
        events.push(currentEvent);
    }

    return { storeName, events };
}

function addEventFromTextarea() {
    const eventData = document.getElementById("event-data").value;

    if (!eventData) {
        alert("Ingrese datos de eventos.");
        return;
    }

    const { storeName, events } = parseGiftEvent(eventData);

    events.forEach(event => {
        const transaction = db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);

        const request = objectStore.add({ title: event.title, description: event.commands.join('\n') });

        request.onsuccess = () => {
            displayEvents(storeName);
        };

        request.onerror = (event) => {
            console.error(`Agregar ${storeName}, error: `, event.target.errorCode);
        };
    });

    document.getElementById("event-data").value = "";
}