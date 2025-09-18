const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8080;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// ================================
// 🎮 Gestión de jugadores y salas
// ================================
let waitingPlayer = null; // jugador esperando rival
let games = {}; // { roomId: { players: [name1, name2], moves: {} } }

io.on("connection", (socket) => {
  console.log("✅ Nuevo jugador conectado:", socket.id);

  // Cuando un jugador se une
  socket.on("joinGame", (playerName) => {
    socket.playerName = playerName;

    if (waitingPlayer) {
      // Crear sala con 2 jugadores
      const roomId = `${waitingPlayer.id}#${socket.id}`;
      socket.join(roomId);
      waitingPlayer.join(roomId);

      games[roomId] = {
        players: [waitingPlayer.playerName, socket.playerName],
        moves: {},
      };

      // Avisar a ambos
      io.to(roomId).emit("opponentFound", (name) =>
        name === socket.playerName ? waitingPlayer.playerName : socket.playerName
      );

      // Para cada jugador, mandamos el nombre del rival
      io.to(waitingPlayer.id).emit("opponentFound", socket.playerName);
      io.to(socket.id).emit("opponentFound", waitingPlayer.playerName);

      console.log(
        `🎮 Sala creada: ${waitingPlayer.playerName} vs ${socket.playerName}`
      );

      waitingPlayer = null; // reset
    } else {
      // Esperando un rival
      waitingPlayer = socket;
      console.log(`${playerName} esperando un rival...`);
    }
  });

  // Jugada de un jugador
  socket.on("playerMove", ({ name, move }) => {
    const roomId = [...socket.rooms].find((r) => r !== socket.id);
    if (!roomId || !games[roomId]) return;

    games[roomId].moves[name] = move;

    // Si ambos jugadores ya hicieron su jugada
    if (
      games[roomId].moves[games[roomId].players[0]] &&
      games[roomId].moves[games[roomId].players[1]]
    ) {
      const p1 = games[roomId].players[0];
      const p2 = games[roomId].players[1];
      const move1 = games[roomId].moves[p1];
      const move2 = games[roomId].moves[p2];

      let winner = "empate";
      if (
        (move1 === "piedra" && move2 === "tijera") ||
        (move1 === "papel" && move2 === "piedra") ||
        (move1 === "tijera" && move2 === "papel")
      ) {
        winner = p1;
      } else if (move1 !== move2) {
        winner = p2;
      }

      io.to(roomId).emit("roundResult", {
        playerMove: move1,
        opponentMove: move2,
        winner,
      });

      // Reset jugadas
      games[roomId].moves = {};
    }
  });

  // Desconexión
  socket.on("disconnect", () => {
    console.log("❌ Jugador desconectado:", socket.playerName || socket.id);

    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }

    // Eliminar al jugador de su sala
    for (const roomId in games) {
      if (games[roomId].players.includes(socket.playerName)) {
        io.to(roomId).emit("opponentFound", "Desconectado");
        delete games[roomId];
      }
    }
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

