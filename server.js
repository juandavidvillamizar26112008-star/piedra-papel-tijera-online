// ================================
// 📌 Piedra, Papel o Tijera Online - Soporte para múltiples salas
// ================================
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, "public")));

// ================================
// 🎮 Gestión de salas
// ================================
let rooms = {}; // { roomId: { players: [ {id, name, move} ] } }
let roomCounter = 1;

// Encontrar o crear sala
function findRoom() {
  for (const roomId in rooms) {
    if (rooms[roomId].players.length < 2) {
      return roomId;
    }
  }
  // Crear nueva si todas están llenas
  const newRoom = `room${roomCounter++}`;
  rooms[newRoom] = { players: [] };
  return newRoom;
}

// ================================
// ⚡ Conexión Socket.IO
// ================================
io.on("connection", (socket) => {
  console.log("🔌 Nuevo jugador conectado");

  socket.on("playerJoined", (playerName) => {
    const roomId = findRoom();
    socket.join(roomId);

    const player = { id: socket.id, name: playerName, move: null };
    rooms[roomId].players.push(player);

    console.log(`👤 ${playerName} entró a ${roomId}`);

    // Avisar al jugador sus datos
    socket.emit("roomAssigned", { roomId });

    // Avisar a todos en la sala
    io.to(roomId).emit(
      "updatePlayers",
      rooms[roomId].players.map((p) => p.name)
    );

    // Si ya hay 2 jugadores, avisar que la partida empieza
    if (rooms[roomId].players.length === 2) {
      io.to(roomId).emit("gameStart", {
        players: rooms[roomId].players.map((p) => p.name),
      });
    }
  });

  // Recibir jugada
  socket.on("playerMove", ({ name, move }) => {
    let roomId;
    for (const r in rooms) {
      if (rooms[r].players.find((p) => p.id === socket.id)) {
        roomId = r;
        break;
      }
    }
    if (!roomId) return;

    const room = rooms[roomId];
    const player = room.players.find((p) => p.id === socket.id);
    player.move = move;

    // Avisar al oponente de la jugada
    socket.to(roomId).emit("opponentMove", move);

    // Revisar si ambos ya jugaron
    if (room.players.length === 2 && room.players.every((p) => p.move)) {
      const [p1, p2] = room.players;
      let winner = "draw";

      if (
        (p1.move === "piedra" && p2.move === "tijera") ||
        (p1.move === "papel" && p2.move === "piedra") ||
        (p1.move === "tijera" && p2.move === "papel")
      ) {
        winner = p1.name;
      } else if (
        (p2.move === "piedra" && p1.move === "tijera") ||
        (p2.move === "papel" && p1.move === "piedra") ||
        (p2.move === "tijera" && p1.move === "papel")
      ) {
        winner = p2.name;
      }

      io.to(roomId).emit("roundResult", { winner });

      // Reiniciar movimientos
      room.players.forEach((p) => (p.move = null));
    }
  });

  // Cuando un jugador se desconecta
  socket.on("disconnect", () => {
    let roomId;
    for (const r in rooms) {
      if (rooms[r].players.find((p) => p.id === socket.id)) {
        roomId = r;
        break;
      }
    }
    if (!roomId) return;

    const room = rooms[roomId];
    room.players = room.players.filter((p) => p.id !== socket.id);

    io.to(roomId).emit(
      "updatePlayers",
      room.players.map((p) => p.name)
    );

    console.log("❌ Jugador desconectado");

    // Si la sala queda vacía, eliminarla
    if (room.players.length === 0) {
      delete rooms[roomId];
      console.log(`🗑️ Sala ${roomId} eliminada`);
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

