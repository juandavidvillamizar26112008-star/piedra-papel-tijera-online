// ================================
// 📌 Piedra, Papel o Tijera - Servidor
// ================================

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir archivos estáticos (index.html, style.css, script.js)
app.use(express.static(path.join(__dirname, "public")));

// Lista de jugadores conectados
let players = {};

// ================================
// ⚡ Conexión de jugadores
// ================================
io.on("connection", (socket) => {
  console.log("🟢 Nuevo jugador conectado:", socket.id);

  // Guardar nombre del jugador
  socket.on("playerJoined", (name) => {
    players[socket.id] = name;
    console.log(`✅ ${name} se unió al juego`);

    // Avisar a todos los jugadores la lista actualizada
    io.emit("updatePlayers", Object.values(players));
  });

  // Recibir jugada de un jugador
  socket.on("playerMove", (data) => {
    console.log(`🎮 ${data.name} eligió: ${data.move}`);

    // Reenviar a los demás jugadores
    socket.broadcast.emit("opponentMove", data.move);

    // 👇 Aquí puedes meter lógica de cálculo de ganador si quieres
    // Por ahora solo reenviamos la jugada
  });

  // Jugador se desconecta
  socket.on("disconnect", () => {
    console.log("❌ Jugador desconectado:", socket.id);

    if (players[socket.id]) {
      delete players[socket.id];
      // Avisar a todos los jugadores que alguien salió
      io.emit("updatePlayers", Object.values(players));
    }
  });
});

// ================================
// 🚀 Iniciar servidor
// ================================
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
