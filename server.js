// ================================
// 📌 server.js - Piedra, Papel o Tijera Online
// ================================
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 8080;

// Servir archivos estáticos (public/)
app.use(express.static(path.join(__dirname, "public")));

// ================================
// 👥 Gestión de jugadores
// ================================
let players = {};
let moves = {};

// Cuando un jugador se conecta
io.on("connection", (socket) => {
  console.log("🔌 Un jugador se conectó:", socket.id);

  // Cuando entra al juego con su nombre
  socket.on("playerJoined", (name) => {
    players[socket.id] = name;
    console.log(`✅ ${name} se unió al juego`);

    // Avisar a los demás que hay un nuevo jugador
    socket.broadcast.emit("message", `${name} se ha conectado`);
  });

  // Cuando un jugador hace su jugada
  socket.on("playerMove", (data) => {
    moves[socket.id] = { name: data.name, move: data.move };
    console.log(`🎮 ${data.name} eligió: ${data.move}`);

    // Avisar a los demás de la jugada
    socket.broadcast.emit("opponentMove", data.move);

    // Ver si ya ambos jugadores hicieron jugada
    if (Object.keys(moves).length === 2) {
      evaluarGanador();
      moves = {}; // Reset para la siguiente ronda
    }
  });

  // Cuando un jugador se desconecta
  socket.on("disconnect", () => {
    console.log("❌ Jugador desconectado:", socket.id);
    if (players[socket.id]) {
      socket.broadcast.emit("message", `${players[socket.id]} salió del juego`);
      delete players[socket.id];
    }
  });
});

// ================================
// 🏆 Función para evaluar ganador
// ================================
function evaluarGanador() {
  const ids = Object.keys(moves);
  const player1 = moves[ids[0]];
  const player2 = moves[ids[1]];

  let winner = "draw";

  if (player1.move === player2.move) {
    winner = "draw";
  } else if (
    (player1.move === "piedra" && player2.move === "tijera") ||
    (player1.move === "papel" && player2.move === "piedra") ||
    (player1.move === "tijera" && player2.move === "papel")
  ) {
    winner = player1.name;
  } else {
    winner = player2.name;
  }

  // Mandar resultado a ambos jugadores
  io.emit("roundResult", { winner });
}

// ================================
// 🚀 Iniciar servidor
// ================================
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

