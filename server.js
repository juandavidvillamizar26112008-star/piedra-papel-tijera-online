const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

let waitingPlayer = null; // socket esperando para emparejar
const rooms = {}; // { roomId: { players: [socket, socket], choices: {} } }

io.on('connection', (socket) => {
  console.log(`Jugador conectado: ${socket.id}`);

  socket.on('login', (playerName) => {
    socket.playerName = playerName;

    if (waitingPlayer === null) {
      waitingPlayer = socket;
      socket.emit('waiting', 'Esperando otro jugador...');
    } else {
      // Crear room nuevo
      const roomId = `room-${socket.id}-${waitingPlayer.id}`;
      rooms[roomId] = {
        players: [waitingPlayer, socket],
        choices: {}
      };

      // Unir sockets a la room
      waitingPlayer.join(roomId);
      socket.join(roomId);

      // Informar a ambos que la partida empieza
      rooms[roomId].players.forEach(s => {
        s.emit('startGame', {
          roomId,
          opponent: s === socket ? waitingPlayer.playerName : socket.playerName
        });
      });

      waitingPlayer = null;
    }
  });

  socket.on('play', ({ roomId, choice }) => {
    if (!rooms[roomId]) return;

    rooms[roomId].choices[socket.id] = choice;

    if (Object.keys(rooms[roomId].choices).length === 2) {
      // Ambos jugadores jugaron, decidir ganador
      const [p1, p2] = rooms[roomId].players;
      const c1 = rooms[roomId].choices[p1.id];
      const c2 = rooms[roomId].choices[p2.id];

      const winner = decideWinner(c1, c2);

      io.to(roomId).emit('roundResult', {
        choices: { [p1.id]: c1, [p2.id]: c2 },
        winner // 'draw', p1.id o p2.id
      });

      // Reset elecciones para siguiente ronda
      rooms[roomId].choices = {};
    }
  });

  socket.on('disconnect', () => {
    console.log(`Jugador desconectado: ${socket.id}`);

    // Limpiar si estaba esperando
    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }

    // Buscar y limpiar room si estaba en alguna
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.players.includes(socket)) {
        // Informar al otro jugador
        room.players.forEach(s => {
          if (s !== socket) s.emit('opponentLeft');
        });
        delete rooms[roomId];
        break;
      }
    }
  });
});

function decideWinner(c1, c2) {
  if (c1 === c2) return 'draw';

  if (
    (c1 === 'piedra' && c2 === 'tijera') ||
    (c1 === 'papel' && c2 === 'piedra') ||
    (c1 === 'tijera' && c2 === 'papel')
  ) {
    return 'p1';
  } else {
    return 'p2';
  }
}

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
