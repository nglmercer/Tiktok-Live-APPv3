let db;
const request = indexedDB.open("eventDatabase", 1);

document.getElementById("addgift-button").addEventListener("click", function() {
    addEvent("gifts");
});

request.onupgradeneeded = (event) => {
    db = event.target.result;

    const stores = ["gifts", "chat", "follows", "subscribes"];
    stores.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: "id", autoIncrement: true });
        }
    });
};

request.onsuccess = (event) => {
    db = event.target.result;
    displayEvents("gifts");
    // displayEvents("chat");
    // displayEvents("follows");
    // displayEvents("subscribes");
};

request.onerror = (event) => {
    console.error("Database error: ", event.target.errorCode);
};

const optionsgiftdb = () => {
    const result = window.globalSimplifiedStates;
    return result;
};

const indexdboptionsgift = optionsgiftdb();
console.log('indexdboptionsgift', indexdboptionsgift);
const indexedavailableGifts = indexdboptionsgift[0].availableGifts || []; // Asegúrate de que availableGifts esté definido y sea un array

const selectInputgifts = document.getElementById("gifts-title");
indexedavailableGifts.forEach(gift => {
    const optionElement = document.createElement('option');
    optionElement.textContent = gift.name;
    optionElement.value = gift.name;
    selectInputgifts.appendChild(optionElement);
});

function addEvent(storeName) {
    const selectInput = document.getElementById(`${storeName}-title`);
    const descriptionInput = document.getElementById(`${storeName}-description`);

    const eventTitle = selectInput.value;
    const eventDescription = descriptionInput.value;

    if (eventTitle === "" || eventDescription === "") {
        alert("Ingrese tanto un título como una descripción.");
        return;
    }

    const transaction = db.transaction([storeName], "readwrite");
    const objectStore = transaction.objectStore(storeName);

    const request = objectStore.add({ title: eventTitle, description: eventDescription });

    request.onsuccess = () => {
        selectInput.value = "";
        descriptionInput.value = "";
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

function displayEvents(storeName) {
    const transaction = db.transaction([storeName], "readonly");
    const objectStore = transaction.objectStore(storeName);

    const request = objectStore.getAll();

    request.onsuccess = (event) => {
        const eventList = document.getElementById(`${storeName}-list`);
        eventList.innerHTML = "";
        const tittleencontrartest = "Rose";
        event.target.result.forEach((eventItem) => {
            if (eventItem.title === tittleencontrartest) {
                console.log("ENCONTROOOOOOOOOOOOOOOOOOOOOOOOOOOOO",eventItem);
            }
        });
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

            const titleInput = document.createElement("select");
            titleInput.style.display = 'none';
            titleInput.style.width = '100%';

            // Rellenar el select con las opciones disponibles
            indexedavailableGifts.forEach(gift => {
                const optionElement = document.createElement('option');
                optionElement.textContent = gift.name;
                optionElement.value = gift.name;
                titleInput.appendChild(optionElement);
            });

            titleInput.value = eventItem.title; // Seleccionar el valor actual

            const descriptionInput = document.createElement("textarea");
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
document.getElementById("testHandleevent").addEventListener("click", function() {
    testHandleEvent123();
});
function testHandleEvent123() {
  var eventType = document.getElementById('eventType').value;

  if (eventType === 'gift') {
      var dataInput = document.getElementById('data').value;
      let data = { giftName: dataInput };
      minecraftlive(eventType, data);
  } else {
      var data = document.getElementById('data').value;
      handleEvent2(eventType, data);
  }
}
function minecraftlive(eventype, data) {
  if (eventype !== 'gift') {
      return;
  }
  let MinecraftLivetoggle = document.getElementById("MinecraftLive")

  //log.console(MinecraftLivetoggle.checked);
  if (!MinecraftLivetoggle.checked) {
      return;
  }
  const transaction = db.transaction(("gifts"), "readonly");
  const objectStore = transaction.objectStore("gifts");

  const request = objectStore.getAll();
  request.onsuccess = (event) => {
  // Obtener los datos de los eventos del localStorage
  const commandList =  event.target.result  
  const giftName = data.giftName; // Normaliza el nombre del regalo

  commandList.forEach((eventItem) => {
    if (eventItem.title === giftName) {
        console.log("ENCONTROOOOOOOOOOOOOOOOOOOOOOOOOOOOO",eventItem);
        const eventCommands = eventItem.description.split('\n');
        eventCommands.forEach(command => {
          const replacedCommand = replaceVariables123(command, data, likes);
          sendReplacedCommand(replacedCommand);
          log.console(replacedCommand);
      });
    } else if (eventItem.title === "default") {
          const eventCommands = eventItem.description.split('\n');
          eventCommands.forEach(command => {
            const replacedCommand = replaceVariables123(command, data, likes);
            sendReplacedCommand(replacedCommand);
            log.console(replacedCommand);
        });
      } else {      
        console.log("NO ENCONTRO",eventItem,"y no default");
    }
    

  });

}
request.onerror = (event) => {
  console.error("Display error: ", event.target.errorCode);
};
}


// Función para reemplazar variables en los comandos

const escapeMinecraftCommand123 = (command) => {
  // Escape only double quotes, not backslashes (unchanged)
  return command.replace(/"/g, '\\"');
};

// Función para reemplazar variables en los comandos
const replaceVariables123 = (command, data, likes) => {
  log.console(command);
  // Reemplazar variables en el comando (unchanged)
  let replacedCommand = command
    .replace(/uniqueId/g, data.uniqueId || '')
    .replace(/nickname/g, data.nickname || '')
    .replace(/comment/g, data.comment || '')
    .replace(/{milestoneLikes}/g, likes || '')
    .replace(/{likes}/g, likes || '')
    .replace(/message/g, data.comment || '')
    .replace(/giftName/g, data.giftName || '')
    .replace(/repeatCount/g, data.repeatCount || '')
    .replace(/playername/g, playerName || '');

  // Convertir el comando a minúsculas
  replacedCommand = replacedCommand.toLowerCase();

  // Remove all backslashes (proceed with caution!)
  replacedCommand = replacedCommand.replace(/\\/g, '');

  //log.console(replacedCommand);
  return replacedCommand;
};