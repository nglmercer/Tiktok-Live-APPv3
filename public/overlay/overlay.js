
var counters = {
    chat: 0,
    gift: 0,
    follow: 0,
    share: 0,
    streamEnd: 0,
    unknown: 0,
    welcome: 0
  };
document.addEventListener('DOMContentLoaded', (event) => {
    // Código para inicializar la conexión y esperar a que esté lista
    window.settings = Object.fromEntries(new URLSearchParams(location.search));
    class SocketClient {
        constructor(backendUrl) {
            this.backendUrl = backendUrl;
            this.socket = null;
            this.options = null;
            this.connectionCache = {};
            this.eventHandlers = {}; // Almacenar los manejadores de eventos
        }
    
        // Método para suscribirse a eventos
        on(eventName, eventHandler) {
            if (!this.eventHandlers[eventName]) {
                this.eventHandlers[eventName] = [];
            }
            this.eventHandlers[eventName].push(eventHandler);
        }
    
        // Método para manejar todos los eventos entrantes
        handleIncomingEvents() {
            for (const eventName in this.eventHandlers) {
                if (this.eventHandlers.hasOwnProperty(eventName)) {
                    this.socket.on(eventName, eventData => {
                        const handlers = this.eventHandlers[eventName];
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
    
    
    // Uso de la clase SocketClient
    const backendUrl = "http://localhost:8081/overlay"; // URL del servidor
    const connection = new SocketClient(backendUrl);
    connection.connectAndGetData();

    // Manejar eventos individuales para recibir los datos
connection.on('tiktokConnected', (state) => {
        console.log("TikTok Connected:", state);
    });
    
connection.on('tiktokDisconnected', (reason) => {
        console.log("TikTok Disconnected:", reason);
    });
    
connection.on('streamEnd', (data) => {
        console.log("Stream Ended:", data);
    });
    
connection.on('roomUser', (data) => {
        console.log("Room User:", data);
    });
connection.on('member', (data) => {
    });
 connection.on('liveIntro', (msg) => {
        console.log('User Details:', msg);
    });
connection.on('chat', (data) => {
        console.log(`${data.uniqueId} : ${data.comment}`);
        overlayTime('chat', data);
    });
connection.on('social', (data) => {
        if (data.displayType.includes('follow')) {
            if (!seguidores.has(data.nickname)) {
                overlayTime('follow', data);
                console.log(`${data.nickname} es un gato mas`);
                seguidores.add(data.nickname);
                // Establecer un temporizador para eliminar data.uniqueId de seguidores después de 5 minutos
                setTimeout(() => {
                    seguidores.delete(data.nickname);
                }, 60000); // 5 minutos
            }
        } else if (data.displayType.includes('share')) {
            overlayTime('share', data);
        } 
        });

 connection.on('emote', (data) => {
        console.log(`${data.uniqueId} emote!`);
        console.log('emote received', data);
    })
 connection.on('envelope', data => {
        console.log('Unique ID:', data.uniqueId);
        console.log('Coins:', data.coins);
    });
    
 connection.on('subscribe', (data) => {
        console.log(`${data.uniqueId} subscribe!`);
        overlayTime('subscribe', data);

    })
 connection.on('gift', (data) => {
        console.log(`${data.uniqueId} envio ${data.giftName} x${data.repeatCount}`);
        overlayTime('gift', data);

    });

    let seguidores = new Set();

  const draggableBar = document.createElement('div');
  draggableBar.id = 'draggable-bar';
  document.body.appendChild(draggableBar);
  const eventContainer = document.getElementById('overlayEventContainer');
  
  function sanitizeText(text) {
      return text ? text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
  }
  
  let lastCount = ''; // Cambiar el nombre de la variable de lastindex a lastCount

  window.addEventListener('pageAB', (event) => {
        const { eventType, indexData, uniqueId } = event.detail;
        const eventData = { eventType, indexData, uniqueId };
      switch (eventType) {
        case 'Newiframe':
          iframeUrl(eventType, indexData);
          break;
        default:
        //console.log("Datos recibidos:", " (Recuento enviado:", indexData, ")");
      }

        overlayTime(eventType, indexData);
        console.log(eventType, indexData,);
        
  });
  function iframeUrl(eventType, data) {
    //console.log(eventType, "iframeUrl", data);

    // Obtener la URL del evento
    const url = data.url;

    // Obtener el contenedor div en el que se colocará el <iframe>
    const containerDiv = document.getElementById('iframeContainer');

    // Verificar si ya hay un <iframe> en el contenedor
    const existingIframe = containerDiv.querySelector('iframe');

    if (existingIframe) {
        // Si ya existe un <iframe>, actualizar su atributo src con la nueva URL
        existingIframe.src = url;
    } else {
        // Si no hay un <iframe> existente, crear uno nuevo con la nueva URL
        const iframeElement = document.createElement('iframe');
        iframeElement.src = url;
        iframeElement.width = '100%';
        iframeElement.height = '100%';

        // Agregar el <iframe> al contenedor div
        containerDiv.appendChild(iframeElement);
    }
}


  // Initialize a Set to store seen unique IDs
  let lastComment = ''; // Variable para almacenar el comentario anterior

  function overlayTime(eventType, data) {
    let timeoutIndex = 0; // Inicializar el índice de tiempo en cero por defecto

    switch (eventType) {
        case 'welcome':
            counters.welcome++;
            timeoutIndex = 3000; // Asignar un tiempo de visualización para 'welcome'
            break;
        case 'chat':
          counters.chat++;
          timeoutIndex = 10000; // Asignar un tiempo de visualización para 'chat'
          userNickname = data.nickname;
          userUniqueName = data.uniqueId;
          userComment = data.comment;

          // Verificar si el comentario actual es igual al comentario anterior
          if (userComment === lastComment) {
              return; // Si son iguales, salir de la función
          }

          lastComment = userComment; // Actualizar el comentario anterior
          console.log(`${data.uniqueId} : ${data.comment}`);
          createOverlayElement(eventType, data, timeoutIndex);
          break;
        case 'gift':
            counters.gift++;
            timeoutIndex = 30000; // Asignar un tiempo de visualización para 'gift'
            userNickname = data.nickname;
            userUniqueName = data.uniqueId;
            userGigtname = data.giftName;
            if (data.giftType === 1 && !data.repeatEnd) {
                console.log(`${data.uniqueId} envio ${data.giftName} x${data.repeatCount}`);
                createOverlayElementUniqueId(eventType, data, timeoutIndex);
            } else if (data.repeatEnd) {
                console.log(`${data.uniqueId} envio ${data.giftName} x${data.repeatCount}`);
                createOverlayElementUniqueId(eventType, data, timeoutIndex);
            }
            break;
        case 'share':
            timeoutIndex = 20000; // Asignar un tiempo de visualización para 'social'
              counters.follow++;
              console.log(`${data.uniqueId} ha compartido`);
              createOverlayElement(eventType, data, timeoutIndex);
                eventType = 'share';
                counters.share++;
                console.log(`${data.uniqueId} ha compartido`);
                createOverlayElement(eventType, data, timeoutIndex);
            break;
          case 'follow':
            timeoutIndex = 20000; // Asignar un tiempo de visualización para 'social'
                eventType = 'share';
                counters.follow++;
                console.log(`${data.uniqueId} te sigue`);
                createOverlayElementUniqueId(eventType, data, timeoutIndex);
            break;
        case 'streamEnd':
            counters.streamEnd++;
            timeoutIndex = 50000; // Asignar un tiempo de visualización para 'streamEnd'
            break;
        default:
            counters.unknown++;
            console.log(`Evento desconocido: ${eventType}`);
    }
}

    let lastPositionX = null;
    let lastPositionY = null;
// Función para barajar un array utilizando el algoritmo de Fisher-Yates
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Crear una matriz de posiciones predefinida
let positions = [];
for (let x = 8; x <= 88; x += 4) {
  for (let y = 8; y <= 88; y += 4) {
      positions.push({ x, y });
  }
}

// Barajar el array de posiciones
positions = shuffleArray(positions);

// Índice de posición actual
let currentPositionIndex = 0;

// Función para obtener la siguiente posición de la matriz
function getNextPosition() {
  const position = positions[currentPositionIndex];
  currentPositionIndex = (currentPositionIndex + 1) % positions.length; // Avanzar al siguiente índice circularmente
  return position;
}
let lastmessage = '';
// Función para crear un elemento de superposición en la siguiente posición de la matriz
function createOverlayElement(eventType, data, timeoutIndex) {
  const eventDiv = document.createElement('div');
  eventDiv.className = 'overlay-event window'; // Agregar las clases overlay-event y window
  eventDiv.classList.add(eventType);
  userComment = data.comment;

  // Verificar si el comentario actual es igual al comentario anterior
  if (userComment === lastmessage) {
      return; // Si son iguales, salir de la función
  }

  lastmessage = userComment; // Actualizar el comentario anterior
  const { x, y } = getNextPosition(); // Obtener la siguiente posición de la matriz
  eventDiv.style.left = `${x}%`; // Cambiar a píxeles en lugar de porcentaje
  eventDiv.style.top = `${y}%`; // Cambiar a píxeles en lugar de porcentaje

  let _html = `
      <div class="title-bar">
          <div class="title-bar-text">${data.uniqueId}</div>
          <div class="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close" onclick="this.parentNode.parentNode.parentNode.remove()"></button> <!-- Agregar función para cerrar -->
          </div>
      </div>
      <div class="window-body">
          <p>${data.comment || data.uniqueId}</p> <!-- Usar el comentario si es un chat, de lo contrario, usar el ID -->
          <div class="miniprofilepicture-container">
          </div>
      </div>
  `;

  eventDiv.innerHTML = _html;
  document.getElementById('overlayEventContainer').appendChild(eventDiv);

  // Hacer la ventana draggable
  let isDragging = false;
  let initialX;
  let initialY;

  eventDiv.addEventListener('mousedown', (event) => {
      isDragging = true;
      initialX = event.clientX - eventDiv.getBoundingClientRect().left;
      initialY = event.clientY - eventDiv.getBoundingClientRect().top;
  });

  eventDiv.addEventListener('mouseup', () => {
      isDragging = false;
  });

  eventDiv.addEventListener('mousemove', (event) => {
      if (isDragging) {
          const newX = event.clientX - initialX;
          const newY = event.clientY - initialY;

          eventDiv.style.left = `${newX}px`;
          eventDiv.style.top = `${newY}px`;
      }
  });

  setTimeout(() => {
      eventDiv.remove();
  },  timeoutIndex); // 30 seconds
}


function createOverlayElementUniqueId(eventType, data, timeoutIndex) {
  // Crear un nuevo elemento div para el evento
  const eventDiv = document.createElement('div');
  eventDiv.className = 'overlay-event window'; // Agregar las clases overlay-event y window
  // Asignar una clase específica según el tipo de evento
  eventDiv.classList.add(eventType);

  // Establecer el fondo del elemento div (comentado por ahora)
  // if (eventType === 'gift') {
  //     //eventDiv.style.background = 'lightblue';
  // } else if (eventType === 'share') {
  //     //eventDiv.style.background = 'lightgreen';
  // } else if (eventType === 'follow') {
  //     //eventDiv.style.background = 'lightyellow';
  // } else {
  //     //eventDiv.style.background = 'white';
  // }

  // Establecer la posición absoluta del cuadrado dentro del contenedor
  const { x, y } = getNextPosition(); // Obtener la siguiente posición de la matriz
  eventDiv.style.left = `${x}%`; // Cambiar a píxeles en lugar de porcentaje
  console.log(y,x,eventType)
  eventDiv.style.top = `5%`;

  // Crear el contenido HTML para la animación de letras
  let htmlContent = '';
  for (let char of data.uniqueId) {
      // Generar una clase única para cada letra
      let uniqueClass = `animated-letter-${Math.random().toString(36).substring(7)}`;
      // Agregar el span con el caracter y la clase única
      htmlContent += `<span class="animated-letter wiggle ${uniqueClass}">${char}</span>`;
  }
  let _html = `
    <div class="title-bar">
        <div class="title-bar-text">${data.uniqueId}</div>
        <div class="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
        </div>
    </div>
    <div class="window-body">
        <p>${htmlContent || data.uniqueId}</p> <!-- Usar el comentario si es un chat, de lo contrario, usar el ID -->
        <div class="miniprofilepicture-container">
            <img class="miniprofilepicture" src="${data.profilePictureUrl}">
            <img class="miniprofilepicture" src="${data.giftPictureUrl}">
        </div>
    </div>
  `;

  // Asignar el contenido HTML al div
  eventDiv.innerHTML = _html ;
  
  // Agregar el cuadrado al contenedor
  document.getElementById('overlayEventContainer').appendChild(eventDiv);

  // Hacer la ventana draggable
  let isDragging = false;
  let initialX;
  let initialY;

  eventDiv.addEventListener('mousedown', (event) => {
      isDragging = true;
      initialX = event.clientX - eventDiv.getBoundingClientRect().left;
      initialY = event.clientY - eventDiv.getBoundingClientRect().top;
  });

  eventDiv.addEventListener('mouseup', () => {
      isDragging = false;
  });

  eventDiv.addEventListener('mousemove', (event) => {
      if (isDragging) {
          const newX = event.clientX - initialX;
          const newY = event.clientY - initialY;

          eventDiv.style.left = `${newX}px`;
          eventDiv.style.top = `${newY}px`;
      }
  });

  setTimeout(() => {
      eventDiv.remove();
  }, timeoutIndex); // 30 seconds
}

});
