const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir carpeta "public" con index.html, script.js y styles.css
app.use(express.static("public"));

// Lista de jugadores conectados
let players = {};

// ================================
// 👤 Conexión de jugadores
// ================================
io.on("connection", (socket) => {
  console.log("🔌 Nuevo jugador conectado:", socket.id);

  // Un jugador se une al juego
  socket.on("playerJoined", (name) => {
    players[socket.id] = { name: name, move: null };
    console.log(`✅ Jugador ${name} se ha unido`);

    // Avisar a todos los demás que llegó un rival
    socket.broadcast.emit("opponentJoined", name);
  });

  // Jugador hace una jugada
  socket.on("playerMove", (data) => {
    if (!players[socket.id]) return;

    players[socket.id].move = data.move;
    console.log(`🎮 ${data.name} eligió ${data.move}`);

    // Avisar a los demás la jugada
    socket.broadcast.emit("opponentMove", data.move);

    // Buscar al otro jugador
    const opponentId = Object.keys(players).find((id) => id !== socket.id);
    if (opponentId && players[opponentId].move) {
      const result = getWinner(players[socket.id], players[opponentId]);

      // Enviar resultado a ambos jugadores
      io.to(socket.id).emit("roundResult", result);
      io.to(opponentId).emit("roundResult", result);

      // Reset de jugadas para la siguiente ronda
      players[socket.id].move = null;
      players[opponentId].move = null;
    }
  });

  // Jugador se desconecta
  socket.on("disconnect", () => {
    console.log("❌ Jugador desconectado:", socket.id);
    delete players[socket.id];
  });
});

// ================================
// 🏆 Función para decidir ganador
// ================================
function getWinner(p1, p2) {
  const { name: name1, move: move1 } = p1;
  const { name: name2, move: move2 } = p2;

  if (move1 === move2) {
    return { winner: "draw" };
  }

  if (
    (move1 === "piedra" && move2 === "tijera") ||
    (move1 === "papel" && move2 === "piedra") ||
    (move1 === "tijera" && move2 === "papel")
  ) {
    return { winner: name1 };
  } else {
    return { winner: name2 };
  }
}

// ================================
// 🚀 Iniciar servidor
// ================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});


