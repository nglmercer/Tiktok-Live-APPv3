export default function socketdata(socket) {
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
    // exportamos todos los eventos para que utilizen los datos sin utilizarlos aqui
    return {
        connection: connection,
        socket: socket
    };
}