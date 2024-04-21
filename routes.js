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
let botStatus = false;
let disconnect = false;
const COMMAND_LIMIT = 1; // Límite de comandos por minuto
const DELAY_PER_COMMAND = 10; // Retraso en milisegundos por cada comando adicional
let commandCount = 0;
function sendChatMessage(text) {
    client.send('/chatbox/input', text, true);
  }
router.post('/receive', (req, res) => {
    const { replacedCommand } = req.body;
  
    // Calcular el retraso base en base al número de comandos
    const additionalDelay = Math.floor(commandCount / COMMAND_LIMIT) * DELAY_PER_COMMAND;

    // Inicializar el retraso
    let delay = 0;

    // Verificar si replacedCommand es un número
    if (!isNaN(replacedCommand)) {
        delay = parseInt(replacedCommand) + 20;
    } else {
        delay = additionalDelay;
    }
  
    // Aplicar el retraso
    setTimeout(() => {
      if (botStatus) {
        bot.chat(replacedCommand);
      }
      //console.log('comando minecraft', replacedCommand);
      
    }, delay);
    res.json({ message: 'Datos recibidos' });
    // Incrementar el contador de comandos después de haber asignado el retraso
    commandCount++;
    
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
  router.get('/send1', (req, res) => {
    const { eventType, data } = req.body;
  
    switch (eventType) {
      case 'chat':

        break;
      case 'gift':

        break;
      case 'social':

        break;
      case 'streamEnd':
        break;
      default:
        console.log(`Evento desconocido: ${eventType}`);
    }
  
    res.json();
  });
  router.post('/create', (req, res) => {
    const { eventType, data } = req.body;
  
    if (eventType === 'createBot') {
      const { keyBot, keyServer, Initcommand } = data;
      if (keyBot && keyServer) {
        if (!bot) {
          const serverParts = keyServer.split(':');
          const serverAddress = serverParts[0];
          const serverPort = serverParts[1] ? parseInt(serverParts[1]) : null;
          setTimeout(() => {
              createBot(keyBot, serverAddress, serverPort);
          }, 3000);
          bot.once('login', () => {
            bot.chat(Initcommand);
            ///fill 166 122 -26 180 134 -12 minecraft:diamond_block
          });
          const startPos = { x: 166, y: 122, z: -26 };
          const endPos = { x: 180, y: 134, z: -12 };
          res.json({ message: 'Bot creado' });
        } else {
          res.json({ message: 'Bot ya está conectado', botStatus });
        }
      } else if (!disconnect) {
        setTimeout(() => {
            createBot(keyBot, serverAddress, serverPort);
        }, 3000);
        bot.once('login', () => {
          res.json({ message: 'Bot creado sin puerto', botStatus });
          bot.chat(Initcommand);
        });
      }
    } else if (eventType === 'disconnectBot') {
      botStatus = false;
      disconnect = true;
      removeBot();
      res.json({ message: 'Bot desconectado', botStatus });
    } else {
      res.json({ message: 'Datos recibidos', botStatus });
    }
  });
  function createBot(keyBot, keyServer, keyServerPort, maxAttempts = 5) {
    console.log("createBot now...");
  
    let attemptCount = 1; // Track the number of connection attempts
  
    if (!botStatus) {
      const botOptions = {
        host: keyServer,
        username: keyBot,
      };
  
      if (keyServerPort) {
        botOptions.port = keyServerPort;
      }
  
      const createBotInternal = () => { // Function for recursive creation
        bot = mineflayer.createBot(botOptions);
  
        bot.on('login', () => {
          botStatus = true;
          console.log('Bot is Online');
          bot.chat('say Bot is Online');
        });
  
        bot.on('error', (err) => {
          console.error('Error:', err);
          botStatus = false;
          if (!disconnect) {
            if (attemptCount < maxAttempts) { // Check if attempts are exceeded
              console.log(`Connection ended, reconnecting in 3 seconds (attempt ${attemptCount}/${maxAttempts})`);
              attemptCount++;
              setTimeout(() => createBotInternal(), 3000); // Recursive call
            } else {
              console.error('Error: Maximum connection attempts reached.');
              // Handle error (return error and botStatus here)
              return { error: 'Connection failed after maximum attempts', botStatus: false };
            }
          }
        });
        bot.on('kicked', (reason) => {
          console.log(`Bot expulsado del servidor: ${reason}`);
        
          // Implementar lógica de reintento
          setTimeout(() => {
            bot.quit(); // Desconectarse del servidor actual
            createBot(keyBot, keyServer, keyServerPort); // Intentar conectarse de nuevo
          }, 5000); // Esperar 5 segundos antes de intentar reconectarse
        
        });
        bot.on('end', () => {
          botStatus = false;
          if (!disconnect) {
            if (attemptCount < maxAttempts) { // Check if attempts are exceeded
              console.log(`Connection ended, reconnecting in 3 seconds (attempt ${attemptCount}/${maxAttempts})`);
              attemptCount++;
              setTimeout(() => createBotInternal(), 3000); // Recursive call
            } else {
              console.error('Error: Maximum connection attempts reached.');
              // Handle error (return error and botStatus here)
              return { error: 'Connection failed after maximum attempts', botStatus: false };
            }
          }
        });
      };

      createBotInternal(); // Initial creation attempt
    } else {
      console.log("No se creó el bot, estado:", botStatus);
    }
  }
  function removeBot() {
    if (bot) {
      bot.quit(); // Desconectar el bot del servidor
      bot = null; // Limpiar la referencia al bot
      botStatus = false; // Actualizar el estado del bot a desconectado
      console.log("Bot desconectado y eliminado correctamente.");
    } else {
      console.log("No hay ningún bot para desconectar.");
    }
  }
  router.post('/api/disconnect', (req, res) => {
    const { eventType } = req.body;
    if (eventType === 'disconnectBot') {
      removeBot();
      disconnect = true;
      res.json({ message: 'Bot desconectado' });
    } else {
      res.json({ message: 'Datos recibidos' });
    }
  });
module.exports = router;