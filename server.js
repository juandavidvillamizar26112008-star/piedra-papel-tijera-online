// ================================
// 📌 Configuración del servidor
// ================================
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
// 👥 Gestión de jugadores
// ================================
let players = []; // lista de nombres conectados
let moves = {};   // jugadas de cada jugador

io.on("connection", (socket) => {
  console.log("🔌 Un jugador se conectó");

  // Cuando un jugador entra
  socket.on("playerJoined", (name) => {
    console.log(`👤 Jugador conectado: ${name}`);
    socket.playerName = name;
    players.push(name);

    // Actualizar lista de jugadores en todos
    io.emit("updatePlayers", players);
  });

  // Cuando un jugador envía una jugada
  socket.on("playerMove", (data) => {
    moves[data.name] = data.move;

    // Avisar al oponente de la jugada
    socket.broadcast.emit("opponentMove", data.move);

    // Si ambos ya jugaron, decidir ganador
    if (Object.keys(moves).length === 2) {
      const [p1, p2] = Object.keys(moves);
      const move1 = moves[p1];
      const move2 = moves[p2];

      let winner = "draw";
      if (
        (move1 === "rock" && move2 === "scissors") ||
        (move1 === "paper" && move2 === "rock") ||
        (move1 === "scissors" && move2 === "paper")
      ) {
        winner = p1;
      } else if (
        (move2 === "rock" && move1 === "scissors") ||
        (move2 === "paper" && move1 === "rock") ||
        (move2 === "scissors" && move1 === "paper")
      ) {
        winner = p2;
      }

      io.emit("roundResult", { winner, moves });

      // Reiniciar jugadas para la próxima ronda
      moves = {};
    }
  });

  // Cuando un jugador se desconecta
  socket.on("disconnect", () => {
    console.log(`❌ Jugador salió: ${socket.playerName}`);
    players = players.filter((p) => p !== socket.playerName);

    // Actualizar lista de jugadores
    io.emit("updatePlayers", players);
  });
});

// ================================
// 🚀 Iniciar servidor
// ================================
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
