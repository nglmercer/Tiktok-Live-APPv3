const express = require('express');
const router = express.Router();
const mineflayer = require('mineflayer');
const { Client, Server: ServerOsc } = require('node-osc');
const client = new Client('127.0.0.1', 9000);
const server2 = new ServerOsc(9001, '127.0.0.1');
server2.on('listening', () => {
  console.log('OSC Server is listening.');
});

let bot; 
let botStatus;
let disconnect;
const COMMAND_LIMIT = 1; // Límite de comandos por minuto
const DELAY_PER_COMMAND = 10; // Retraso en milisegundos por cada comando adicional
let commandCount = 0;
function sendChatMessage(text) {
    client.send('/chatbox/input', text, true);
  }
router.post('/receive', (req, res) => {
    //console.log(`Comando recibido. Retraso adicional: ${additionalDelay}ms`);
  });

  router.post('/guardarEstado', (req, res) => {
    const state = req.body.state; // Obtiene el estado del cuerpo de la petición
    store.set('state', state);

    console.log('Estado guardado:', state);
    res.sendStatus(200); // Envía una respuesta de éxito al cliente
  });


  router.post('/receive1', (req, res) => {
    const { eventType, data } = req.body;
  
    switch (eventType) {
      case 'chat':
        setTimeout(() => {
        console.log(`${data.uniqueId} : ${data.comment}`);
        sendChatMessage(`${data.uniqueId} : ${data.comment}`);
        }, 500); // antes de enviar el comando
        break;
      case 'gift':
        if (data.giftType === 1 && !data.repeatEnd) {
          console.log(`${data.uniqueId} envio ${data.giftName} x${data.repeatCount}`);
          setTimeout(() => {
            sendChatMessage(`${data.uniqueId} envio ${data.giftName} x${data.repeatCount}`);
          }, 500);
          } else if (data.repeatEnd) {
            console.log(`${data.uniqueId} envio ${data.giftName} x${data.repeatCount}`);
              // Streak ended or non-streakable gift => process the gift with final repeat_count
              sendChatMessage(`${data.uniqueId} envio ${data.giftName} x${data.repeatCount}`);
            }
        break;
      case 'social':
        if (data.displayType.includes('follow')) {
          console.log(`${data.uniqueId} te sigue`);
          sendChatMessage(`${data.uniqueId} te sigue`);
        }
        if (data.displayType.includes('share')) {
          console.log(`${data.uniqueId} ha compartido`);
          sendChatMessage(`${data.uniqueId} ha compartido`);
        }
        break;
      case 'streamEnd':
        sendChatMessage('Fin de la transmisión en vivo');
        break;
      default:
        console.log(`Evento desconocido: ${eventType}`);
    }
  
    res.json({ message: 'Datos recibidos receive1' });
  });
  router.post('/api/disconnect', (req, res) => {
    const { eventType } = req.body;
    console.log(eventType);
  });
module.exports = router;