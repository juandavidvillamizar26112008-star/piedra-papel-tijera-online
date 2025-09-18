const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const TICK_RATE = 100; // ms

// Estado de las salas: { roomId: { players: { socketId: playerData }, food: {x,y} } }
const rooms = {};

function randomPosition() {
  return {
    x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
    y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE))
  };
}

function createPlayer() {
  return {
    snake: [{ x: 5, y: 5 }],
    direction: { x: 1, y: 0 },
    pendingDirection: null,
    alive: true,
    score: 0
  };
}

function oppositeDirection(dir1, dir2) {
  return dir1.x === -dir2.x && dir1.y === -dir2.y;
}

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = { players: {}, food: randomPosition() };
    }
    const room = rooms[roomId];

    if (Object.keys(room.players).length >= 2) {
      socket.emit('roomFull');
      return;
    }

    room.players[socket.id] = createPlayer();

    // Posicionar serpientes iniciales diferentes
    const playerIndex = Object.keys(room.players).indexOf(socket.id);
    if (playerIndex === 1) {
      room.players[socket.id].snake = [{ x: 15, y: 15 }];
      room.players[socket.id].direction = { x: -1, y: 0 };
    }

    socket.emit('joinedRoom', { roomId, playerNumber: playerIndex + 1 });
    io.to(roomId).emit('playersUpdate', Object.keys(room.players).length);

    if (Object.keys(room.players).length === 2) {
      io.to(roomId).emit('gameStart');
      startGameLoop(roomId);
    }
  });

  socket.on('changeDirection', ({ roomId, direction }) => {
    const room = rooms[roomId];
    if (!room) return;
    const player = room.players[socket.id];
    if (!player || !player.alive) return;

    // Validar que no se pueda ir en dirección opuesta
    if (!oppositeDirection(direction, player.direction)) {
      player.pendingDirection = direction;
    }
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        io.to(roomId).emit('playerLeft');
        if (Object.keys(room.players).length === 0) {
          delete rooms[roomId];
        }
        break;
      }
    }
  });
});

function startGameLoop(roomId) {
  const interval = setInterval(() => {
    const room = rooms[roomId];
    if (!room) {
      clearInterval(interval);
      return;
    }

    const players = room.players;
    if (Object.keys(players).length < 2) {
      io.to(roomId).emit('gameOver', 'Un jugador se desconectó.');
      clearInterval(interval);
      return;
    }

    // Actualizar cada jugador
    for (const id in players) {
      const player = players[id];
      if (!player.alive) continue;

      // Cambiar dirección si hay pendiente
      if (player.pendingDirection) {
        player.direction = player.pendingDirection;
        player.pendingDirection = null;
      }

      const head = player.snake[0];
      const newHead = {
        x: head.x + player.direction.x,
        y: head.y + player.direction.y
      };

      // Colisiones con paredes
      if (
        newHead.x < 0 || newHead.x >= CANVAS_SIZE / GRID_SIZE ||
        newHead.y < 0 || newHead.y >= CANVAS_SIZE / GRID_SIZE
      ) {
        player.alive = false;
        continue;
      }

      // Colisiones con sí mismo
      if (player.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        player.alive = false;
        continue;
      }

      // Colisiones con la otra serpiente
      for (const otherId in players) {
        if (otherId === id) continue;
        const other = players[otherId];
        if (other.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
          player.alive = false;
          break;
        }
      }
      if (!player.alive) continue;

      player.snake.unshift(newHead);

      // Comer comida
      if (newHead.x === room.food.x && newHead.y === room.food.y) {
        player.score++;
        room.food = randomPosition();
      } else {
        player.snake.pop();
      }
    }

    // Verificar si hay ganador
    const alivePlayers = Object.values(players).filter(p => p.alive);
    if (alivePlayers.length <= 1) {
      io.to(roomId).emit('gameOver', alivePlayers.length === 1 ? '¡Jugador ganador!' : 'Empate');
      clearInterval(interval);
      return;
    }

    // Enviar estado a clientes
    io.to(roomId).emit('gameState', {
      players: Object.entries(players).map(([id, p]) => ({
        id,
        snake: p.snake,
        score: p.score,
        alive: p.alive
      })),
      food: room.food
    });
  }, TICK_RATE);
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
