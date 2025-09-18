// ================================
// 📦 Dependencias
// ================================
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// ================================
// 🚀 Configuración del servidor
// ================================
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Servir archivos estáticos (tu index.html, style.css, script.js, música, etc.)
app.use(express.static(path.join(__dirname, "public")));

// ================================
// 👥 Gestión de jugadores
// ================================
let waitingPlayer = null;
let games = {}; // pares de jugadores {roomId: {players: [], moves: {}}}

// ================================
// ⚡ Conexión de sockets
// ================================
io.on("connection", (socket) => {
  console.log("🔌 Un jugador se conectó:", socket.id);

  // Cuando un jugador entra con su nombre
  socket.on("playerJoined", (name) => {
    socket.data.name = name;

    if (waitingPlayer) {
      // Crear sala nueva
      const roomId = `${waitingPlayer.id}-${socket.id}`;
      games[roomId] = {
        players: [waitingPlayer, socket],
        moves: {},
      };

      waitingPlayer.join(roomId);
      socket.join(roomId);

      console.log(`🎮 Nueva sala creada: ${roomId}`);

      // Avisar a ambos jugadores que tienen oponente
      io.to(roomId).emit("roundResult", {
        winner: "draw",
        message: "¡El juego ha comenzado!",
      });

      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
      console.log(`🕒 ${name} está esperando un oponente...`);
    }
  });

  // Jugada de un jugador
  socket.on("playerMove", ({ name, move }) => {
    const roomId = [...socket.rooms].find((r) => r !== socket.id);
    if (!roomId || !games[roomId]) return;

    games[roomId].moves[name] = move;

    // Avisar al oponente que este jugador ya jugó
    socket.to(roomId).emit("opponentMove", move);

    // Si los dos ya jugaron
    if (Object.keys(games[roomId].moves).length === 2) {
      const players = games[roomId].players.map((p) => p.data.name);
      const [p1, p2] = players;
      const m1 = games[roomId].moves[p1];
      const m2 = games[roomId].moves[p2];

      let winner = "draw";
      if (
        (m1 === "rock" && m2 === "scissors") ||
        (m1 === "paper" && m2 === "rock") ||
        (m1 === "scissors" && m2 === "paper")
      ) {
        winner = p1;
      } else if (m1 !== m2) {
        winner = p2;
      }

      // Avisar resultado a la sala
      io.to(roomId).emit("roundResult", { winner });

      // Reiniciar jugadas
      games[roomId].moves = {};
    }
  });

  // Desconexión
  socket.on("disconnect", () => {
    console.log("❌ Jugador desconectado:", socket.id);

    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }

    // Buscar si estaba en un juego
    for (let roomId in games) {
      if (games[roomId].players.some((p) => p.id === socket.id)) {
        io.to(roomId).emit("roundResult", {
          winner: "draw",
          message: "El oponente se desconectó 😢",
        });
        delete games[roomId];
      }
    }
  });
});

// ================================
// 🚀 Iniciar servidor
// ================================
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
