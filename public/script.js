class SocketClient {
  constructor(backendUrl) {
      this.backendUrl = backendUrl;
      this.socket = null;
      this.options = null;
      this.connection1Cache = {};
      this.eventHandlers = {}; // Almacenar los manejadores de eventos
  }

  // Método para suscribirse a eventos
  on(event, eventHandler) {
      if (!this.eventHandlers[event]) {
          this.eventHandlers[event] = [];
      }
      this.eventHandlers[event].push(eventHandler);
  }
  emit(event, eventData) {
    this.socket.emit(event, eventData);
  }
  // Método para manejar todos los eventos entrantes
  handleIncomingEvents() {
    for (const event in this.eventHandlers) {
      if (this.eventHandlers.hasOwnProperty(event)) {
        this.socket.on(event, eventData => {
          const handlers = this.eventHandlers[event];
          handlers.forEach(handler => handler(eventData));
        });
      }
    }
  }

  connectAndGetData() {
    this.socket = io(this.backendUrl, this.options);

    this.socket.on('connect', () => {
      console.info("Socket connected!");
      this.handleIncomingEvents(); // Manejar los eventos una vez conectado
    });

      // Escucha otros eventos y procesa datos de manera similar
  }
}
const backendUrl1 = "http://localhost:8081/overlay"; // URL del servidor
const connection1 = new SocketClient(backendUrl1);
connection1.on('tiktokConnected', (state) => {
  console.log("TikTok Connected:", state);
            console.log(state);
          availableGiftsImage(state);
});

// Escuchar la respuesta del servidor con el estado actual
connection1.on('estadoActual', state => {
  console.log(state);
  availableGiftsImage(state);
    // Haz algo con el estado recibido, como mostrarlo en la interfaz de usuario
});
function handleSound(eventType, data) {
    switch (eventType) {
        case 'welcome':
          // Asignar un tiempo de visualización para 'welcome'
            break;
        case 'chat':
         
          userNickname = data.nickname;
          userUniqueName = data.uniqueId;
          userComment = data.comment;
          let lastComment;
          // Verificar si el comentario actual es igual al comentario anterior
          if (userComment === lastComment) {
              return; // Si son iguales, salir de la función
          }
          if (userComment) {
            const eventData = audioData.find(data1 => data1.event === userComment); // Buscar el objeto en audioData con el event especificado
            if (eventData) {
              const audioPath = eventData.audioPath; // Obtener el audioPath del objeto encontrado
              const audioElement = new Audio(audioPath); // Crear un nuevo elemento de audio
              audioElement.play(); // Reproducir el audio
            } 
      }
          lastComment = userComment; // Actualizar el comentario anterior
          console.log(`${data.uniqueId} : ${data.comment}`);
          
          break;
        case 'gift':
           // Asignar un tiempo de visualización para 'gift'
            userNickname = data.nickname;
            userUniqueName = data.uniqueId;
            userGiftname = data.giftName;
            userGiftUrl = data.giftPictureUrl;
            if (data.giftType === 1 && !data.repeatEnd) {
                console.log(`${data.uniqueId} envio ${data.giftPictureUrl} x${data.repeatCount}`);
                if (userGiftname) {
                  const eventData = audioData.find(data1 => data1.event === userGiftname); // Buscar el objeto en audioData con el event especificado
                  if (eventData) {
                    const audioPath = eventData.audioPath; // Obtener el audioPath del objeto encontrado
                    const audioElement = new Audio(audioPath); // Crear un nuevo elemento de audio
                    audioElement.play(); // Reproducir el audio
                  } 
            }
            } else if (data.repeatEnd) {
                console.log(`${data.uniqueId} envio ${data.giftPictureUrl} x${data.repeatCount}`);
                if (userGiftname) {
                  const eventData = audioData.find(data1 => data1.event === userGiftname); // Buscar el objeto en audioData con el event especificado
                  if (eventData) {
                    const audioPath = eventData.audioPath; // Obtener el audioPath del objeto encontrado
                    const audioElement = new Audio(audioPath); // Crear un nuevo elemento de audio
                    audioElement.play(); // Reproducir el audio
                  } 
            }
          }
            break;
        case 'share':
              console.log(`${data.uniqueId} ha compartido`);
              
                eventType = 'share';
                console.log(`${data.uniqueId} ha compartido`);
                
            break;
          case 'follow':
                eventType = 'follow';
                console.log(`${data.uniqueId} te sigue`);
                if (eventType) {
                  const eventData = audioData.find(data1 => data1.event === eventType); // Buscar el objeto en audioData con el event especificado
                  if (eventData) {
                    const audioPath = eventData.audioPath; // Obtener el audioPath del objeto encontrado
                    const audioElement = new Audio(audioPath); // Crear un nuevo elemento de audio
                    audioElement.play(); // Reproducir el audio
                  } 
            }
            break;
        case 'streamEnd':
            timeoutIndex = 50000; // Asignar un tiempo de visualización para 'streamEnd'
            break;
        default:
            console.log(`Evento desconocido: ${eventType}`);
    }
  }
let globalSimplifiedStates1 = window.globalSimplifiedStates;

var EventsDefault = {
  share: 'Share',
  follow: 'Follow',
  like: 'Like',
  dislike: 'Dislike',
  comment: 'Comment',
  Rose: 'Rose',
  TikTok: 'TikTok',
  Comment: 'Comment',
  hola: 'hola',
  test: 'test'
};
function formatGiftOption(gift) {
  if (!gift.id) {
      return gift.text;
  }

  return $('<span><img src="' + gift.imageUrl + '" class="thumbnail-img" /> ' + gift.text + '</span>');
}
const tableBody = document.getElementById("audioTableBody");

let indexCheckbox = 0; // Variable para llevar la cuenta del índice de los checkboxes
// Función para agregar una fila a la tabla
function addRow(audioPath, audioName, event, volume, enable) {
  const newRow = tableBody.insertRow(); // Insertar una nueva fila
  const playCell = newRow.insertCell(); // Celda para el botón de reproducción
  const volumeCell = newRow.insertCell(); // Celda para el control de volumen
  const enableCell = newRow.insertCell(); // Celda para el interruptor de habilitación
  const eventCell = newRow.insertCell(); // Celda para el selector de eventos
  const pathCell = newRow.insertCell(); // Celda para la ruta del audio
  const deleteCell = newRow.insertCell(); // Celda para el botón de eliminación

  // Crear el botón de reproducción
  const playButton = document.createElement("button");
  playButton.textContent = "Play";
  playButton.classList.add("play-button");
  playButton.dataset.path = audioPath; // Almacenar la ruta del audio en un atributo de datos
  playCell.appendChild(playButton);

  // Crear el elemento de audio para la reproducción
  let audioElement = new Audio(audioPath);
  if (!isNaN(volume) && volume >= 0 && volume <= 1) {
    audioElement.volume = volume;
  } else {
    console.error("Invalid volume value:", volume);
  }

  // Crear el control de volumen
  let volumeSlider = document.createElement("input");
  volumeSlider.type = "range";
  volumeSlider.min = "0";
  volumeSlider.max = "1";
  volumeSlider.step = "0.1";
  volumeSlider.value = volume;
  volumeSlider.addEventListener("input", () => {
    audioElement.volume = volumeSlider.value;
    volume = volumeSlider.value;
    updateVolume(audioPath, audioName, event, volume, true);
  });
  volumeCell.appendChild(volumeSlider);

  // Crear el interruptor de habilitación
  let enableToggle = document.createElement("input");
  enableToggle.type = "checkbox";
  enableToggle.checked = enable;
  const enableId = `checkbox-${indexCheckbox}`; // Generar un ID único para el checkbox
  enableToggle.id = enableId; 
  enableToggle.addEventListener("change", () => {
    if (enableToggle.checked) {

    } else {

    }
  });
  enableCell.appendChild(enableToggle);
  indexCheckbox++;
  let selectInput1 = document.createElement("select"); // Crear el elemento select
  selectInput1.classList.add('select2');
  eventCell.appendChild(selectInput1);
  const Myimg = "https://avatars.githubusercontent.com/u/128845117?s=400&u=56b015208d065d3128a2783016c97b11df5a1e53&v=4";
  let dataImg;
  // Utilizar Myimg si gift.imageUrl no está definido
  $(selectInput1).select2({
    data: [
      { id: event, text: event ,imageUrl: dataImg ?? Myimg}, // Primer elemento como opción predeterminada
      ...globalSimplifiedStates1.flatMap(state => state.availableGifts.map(gift => ({
          id: gift.name,
          text: gift.name,
          imageUrl: gift.imageUrl 
      })))
    ],
    templateResult: formatGiftOption,
    escapeMarkup: markup => markup
  });
    $(selectInput1).on('select2:select', function (e) {
      const selectedId = e.params.data.id;
      const selectedText = e.params.data.text;
      updateevent(audioPath, audioName, selectedId, volume, null);

      console.log(selectedId)
    });
  console.log('selectInput1', selectInput1);
  // Listener de eventos para reproducir audio cuando se hace clic en el botón
  playButton.addEventListener("click", () => {
    console.log("Playing audio from:", audioPath);
    audioElement.play();
  });

  // Mostrar la ruta del audio en la celda correspondiente
  pathCell.textContent = audioName;

  // Crear el botón de eliminación
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => {
    tableBody.removeChild(newRow);
    deleteAudioData(audioPath);
  });
  deleteCell.appendChild(deleteButton);

  // Guardar los datos si no son duplicados
  if (!isDuplicateAudio(audioPath, audioName, event)) {
    saveAudioData(audioPath, audioName, event, volume, enable);
  }
}


// Función para cargar los datos al cargar la página
function loadRows() {
  const audioData = loadData();
  
  audioData.forEach((data) => {
    addRow(data.audioPath, data.audioName, data.event, data.volume, data.enable);
  });
  console.log('audioData', audioData);
}

// Data Structure for Audio Data (Global)
const audioData = [];

// Función para guardar los datos en el almacenamiento local
function saveAudioData(audioPath, audioName, event, volume, enable) {
  audioData.push({ audioPath, audioName, event, volume, enable });
  saveData();
}

// Función para eliminar datos del almacenamiento local
function deleteAudioData(audioPath) {
  const indexToRemove = audioData.findIndex(data => data.audioPath === audioPath);
  if (indexToRemove > -1) {
    audioData.splice(indexToRemove, 1);
    saveData();
  }
}

// Función para actualizar el nombre del evento en los datos
function updateevent(audioPath, audioName, event, volume, enable) {
  let dataToUpdate = findAudioData(audioPath, audioName, event, volume, enable);
  if (dataToUpdate) {
    dataToUpdate.audioPath = audioPath;
    dataToUpdate.audioName = audioName;
    dataToUpdate.event = event;
    saveData();
  }
}
function findAudioData(audioPath, audioName, event, volume, enable)  {
  if (event && !enable) {
    console.log("No enable");
    return audioData.find(data => data.audioPath === audioPath && data.audioName === audioName && data.event !== event && data.volume === volume);
  } else if (enable && volume) {
    console.log("No event");
    return audioData.find(data => data.audioPath === audioPath && data.audioName === audioName && data.event === event && data.volume !== volume);
  }
}

// Función para actualizar el volumen en los datos
function updateVolume(audioPath, audioName, event, volume, enable) {
  const dataToUpdate = findAudioData(audioPath, audioName, event, volume, enable);
  if (dataToUpdate) {
    dataToUpdate.volume = volume;
    saveData();
  }
}


// Función para guardar los datos en el almacenamiento local
function saveData() {
  localStorage.setItem("audioData", JSON.stringify(audioData));
}

// Función para cargar los datos desde el almacenamiento local
function loadData() {
  const storedData = localStorage.getItem("audioData");
  return storedData ? JSON.parse(storedData) : [];
}

// Función para verificar si los datos de audio son duplicados
function isDuplicateAudio(audioPath, audioName, event, volume) {
  return audioData.some(data => data.audioPath === audioPath && 
    data.audioName === audioName && 
    data.event === event && 
    data.volume === volume);
}

// Función para cargar los datos al cargar la página
function loadRowsOnPageLoad(tableBody) {
  loadRows(tableBody);
}

// Llamada para cargar los datos al cargar la página
setTimeout(() => {
  loadRowsOnPageLoad(tableBody);
}, 100);
function searchMyInstants(query) {
  $.ajax({
    url: "https://api.cleanvoice.ru/myinstants/?type=many&search=" + encodeURIComponent(query) + "&offset=0&limit=10",
    method: "GET",
    success: function(data) {      
      // Parse the response data
      var jsonData = JSON.parse(data);
      console.log("Parsed JSON data response:", jsonData); // Log parsed data
      
      // Create HTML for audio list items
      var audioListHtml = "";
      jsonData.items.forEach(function(item) {
        console.log("Item data:", item); // Log each item
        const audioPath = `https://api.cleanvoice.ru/myinstants/?type=file&id=${item.id}`;
        console.log("Audio path:", audioPath); // Log the audio path
        audioListHtml += `
          <div>
            ${item.title}
            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-1 rounded play-button" data-path="${item.id}">✅</button>
          </div>
        `;
      });
      
      // Display audio list in the modal
      $("#audioList").html(audioListHtml);
    },
    error: function(xhr, status, error) {
      console.error("Error fetching data from MyInstants API:", error);
    }
  });
}

$("#audioList").on("click", "a", function(event) {
  event.preventDefault(); // Prevent default link behavior

  // Get audio data from clicked item
  const audioId = $(this).data("id"); // Assuming you added data-id attribute in the HTML
  const audioTitle = $(this).parent().text().trim(); // Get the audio title
  // imprimimos info del selector
  const consolelogselect = $(this)
  console.log('consolelogselect', consolelogselect);
  // Construct audio path using the ID (assuming MyInstants structure)
  const audioPath = `https://api.cleanvoice.ru/myinstants/?type=file&id=${audioId}`; 
  
  // Add audio to the table
  addRow(audioPath, audioTitle, audioTitle , 1, true); // Default volume: 0.5, Default enable: true
  $('#audioModal').modal('hide');
});

$("#audioList").on("click", ".play-button", function() {
  const audioId = $(this).data("path");
  const audioTitle = $(this).parent().text().trim(); // Get the audio title
  const consolelogthiselement = $(this).data
  console.log('consolelogthiselement', consolelogthiselement);
  // Construct the audio path using the ID
  const audioPath = `https://api.cleanvoice.ru/myinstants/?type=file&id=${audioId}`;
  console.log("Audio Path:", audioPath);

  // Add a new row to the table
  addRow(audioPath, audioTitle, "selecciona" , 0.5, true); // Default volume: 0.5, Default enable: true

  $('#audioModal').modal('hide');
});

// Event listener for searching audio
$("#searchButton").click(function() {
  const query = $("#searchBox").val();
  searchMyInstants(query);
});


// # ENDJAVASCRIPT Modify addButton event listener
