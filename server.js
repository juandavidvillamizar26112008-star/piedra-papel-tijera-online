const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server);

const choices = ['piedra', 'papel', 'tijera'];

function getResult(p1Choice, p2Choice) {
  if (p1Choice === p2Choice) return 'empate';
  if (
    (p1Choice === 'piedra' && p2Choice === 'tijera') ||
    (p1Choice === 'papel' && p2Choice === 'piedra') ||
    (p1Choice === 'tijera' && p2Choice === 'papel')
  ) return 'gana';
  return 'pierde';
}

const rooms = {}; // { roomId: { players: [socketId1, socketId2], choices: { socketId: choice } } }

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = { players: [], choices: {} };
    }
    if (rooms[roomId].players.length < 2) {
      rooms[roomId].players.push(socket.id);
      socket.emit('joinedRoom', { roomId, playerNumber: rooms[roomId].players.length });
      io.to(roomId).emit('roomUpdate', { playersCount: rooms[roomId].players.length });
    } else {
      socket.emit('roomFull');
    }
  });

  socket.on('play', ({ roomId, choice }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].choices[socket.id] = choice;

    if (Object.keys(rooms[roomId].choices).length === 2) {
      const [p1, p2] = rooms[roomId].players;
      const p1Choice = rooms[roomId].choices[p1];
      const p2Choice = rooms[roomId].choices[p2];

      const p1Result = getResult(p1Choice, p2Choice);
      const p2Result = p1Result === 'gana' ? 'pierde' : p1Result === 'pierde' ? 'gana' : 'empate';

      io.to(p1).emit('roundResult', { yourChoice: p1Choice, opponentChoice: p2Choice, result: p1Result });
      io.to(p2).emit('roundResult', { yourChoice: p2Choice, opponentChoice: p1Choice, result: p2Result });

      rooms[roomId].choices = {};
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const index = room.players.indexOf(socket.id);
      if (index !== -1) {
        room.players.splice(index, 1);
        delete room.choices[socket.id];
        io.to(roomId).emit('playerLeft');
        if (room.players.length === 0) {
          delete rooms[roomId];
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
