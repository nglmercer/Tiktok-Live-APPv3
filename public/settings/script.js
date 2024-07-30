// class SocketClient {
//   constructor(backendUrl) {
//       this.backendUrl = backendUrl;
//       this.socket = null;
//       this.options = null;
//       this.connection1Cache = {};
//       this.eventHandlers = {}; // Almacenar los manejadores de eventos
//   }

//   // Método para suscribirse a eventos
//   on(event, eventHandler) {
//       if (!this.eventHandlers[event]) {
//           this.eventHandlers[event] = [];
//       }
//       this.eventHandlers[event].push(eventHandler);
//   }
//   emit(event, eventData) {
//     this.socket.emit(event, eventData);
//   }
//   // Método para manejar todos los eventos entrantes
//   handleIncomingEvents() {
//     for (const event in this.eventHandlers) {
//       if (this.eventHandlers.hasOwnProperty(event)) {
//         this.socket.on(event, eventData => {
//           const handlers = this.eventHandlers[event];
//           handlers.forEach(handler => handler(eventData));
//         });
//       }
//     }
//   }

//   connectAndGetData() {
//     this.socket = io(this.backendUrl, this.options);

//     this.socket.on('connect', () => {
//       console.info("Socket connected!");
//       this.handleIncomingEvents(); // Manejar los eventos una vez conectado
//     });

//       // Escucha otros eventos y procesa datos de manera similar
//   }
// }
// const backendUrl1 = "http://localhost:8081/overlay"; // URL del servidor
// const connection1 = new SocketClient(backendUrl1);
// connection1.on('tiktokConnected', (state) => {
//   console.log("TikTok Connected:", state);
//             console.log(state);
//           availableGiftsImage(state);
// });

// // Escuchar la respuesta del servidor con el estado actual
// connection1.on('estadoActual', state => {
//   console.log(state);
//   availableGiftsImage(state);
//     // Haz algo con el estado recibido, como mostrarlo en la interfaz de usuario
// });
// let globalSimplifiedStates1 = window.globalSimplifiedStates;
