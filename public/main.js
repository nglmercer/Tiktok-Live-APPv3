const WebSocket = require('ws');

const serverAddress = 'ws://127.0.0.1:4567';
const apiKey = 'hola';

// Función para enviar comandos al servidor
function enviarComando(comando) {
  const ws = new WebSocket(serverAddress);

  ws.on('open', () => {
    // Autenticación con la clave de API
    ws.send(JSON.stringify({ type: 'auth', key: apiKey }));

    // Envío del comando al servidor
    ws.send(JSON.stringify({ type: 'command', command: comando }));
  });

  ws.on('message', (data) => {
    // Manejo de la respuesta del servidor
    const mensaje = JSON.parse(data);
    console.log('Respuesta del servidor:', mensaje);
    ws.close();
  });

  ws.on('error', (error) => {
    console.error('Error de conexión:', error);
  });
}

// Ejemplo de uso: enviar el comando "/give nglmercer enchanted_golden_apple 1" al servidor
enviarComando('execute at nglmercer run give nglmercer enchanted_golden_apple 1');