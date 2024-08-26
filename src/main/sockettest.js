import { Server } from 'socket.io';
export default function socket(server, cors) {
    const io = new Server(server, {
      cors,
      transports: ['polling'],
      allowUpgrades: false,
      pingTimeout: 1000,
      pingInterval: 1000,
    });
    io.on('connection', (socket) => {
        console.log('\n\n\n\n\n\nnuevo cliente');
        socket.on("join", async (room, username='') => {
          try {
            console.log('Uniendo a la sala ', room);
            const SocketRoom = Array.from(socket.rooms).pop();
            if (SocketRoom == room) {return;}
            await socket.join(room);
            socket.username = username;
            socket.emit("joined", String(socket.id), String(username));
            socket.broadcast.to(room).emit("join", String(socket.id), String(username));
          } catch (error) {
            console.log('Error al unirse a la sala ', room, error.message); //<-------- Aquí se puede cambiar el mensaje
          }
        });

        socket.on('sendEvent', async (clienteId, mensaje, event) => {
          const sockets = await io.fetchSockets();
          const rooms = Array.from(socket.rooms).pop();
          let socketEncontrado = sockets.find(h_socket => h_socket.id === clienteId);
          socketEncontrado = socketEncontrado || sockets.broadcast.to(rooms)
          socketEncontrado.emit(event, mensaje, socket.id, socket.username);
        });

        socket.on('disconnect', async () => {
          console.log('Cliente desconectado');
          const rooms = Array.from(socket.rooms);
          rooms.forEach(async (room) => {await socket.leave(room);});
          io.emit('leave', socket.id, socket.username);
        });

    });
}
