// server.js - Servidor Principal
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos
app.use(express.static(__dirname));

// Lista para emparejar jugadores en línea
let waitingPlayers = [];

// Función para emparejar jugadores
function pairPlayers(socket) {
  if (waitingPlayers.length > 0) {
    const opponentSocket = waitingPlayers.shift();
    socket.opponent = opponentSocket;
    opponentSocket.opponent = socket;

    socket.emit("gameResult", { message: `Rival encontrado: ${opponentSocket.playerName}. ¡Comienza el juego!` });
    opponentSocket.emit("gameResult", { message: `Rival encontrado: ${socket.playerName}. ¡Comienza el juego!` });
    console.log(`Emparejados: ${socket.playerName} vs ${opponentSocket.playerName}`);
  } else {
    waitingPlayers.push(socket);
    socket.emit("gameResult", { message: "Esperando un rival..." });
    console.log(`${socket.playerName} está esperando un rival.`);
  }
}

// Manejo de conexiones
io.on("connection", socket => {
  console.log("Nuevo socket conectado:", socket.id);

  socket.on("playerJoined", data => {
    socket.playerName = data.name || "Anónimo";
    console.log(`Jugador unido: ${socket.playerName}`);
    
    if (data && data.mode && data.mode === "online") {
      pairPlayers(socket);
    }
  });

  socket.on("playerMove", data => {
    socket.choice = data.choice;
    console.log(`Movimiento de ${socket.playerName}: ${socket.choice}`);

    if (socket.opponent && socket.opponent.choice) {
      const player1 = socket;
      const player2 = socket.opponent;
      const choice1 = player1.choice;
      const choice2 = player2.choice;
      let result1, result2;
      if (choice1 === choice2) {
        result1 = "Empate";
        result2 = "Empate";
      } else if (
        (choice1 === "piedra" && choice2 === "tijera") ||
        (choice1 === "papel" && choice2 === "piedra") ||
        (choice1 === "tijera" && choice2 === "papel")
      ) {
        result1 = "Ganaste";
        result2 = "Perdiste";
      } else {
        result1 = "Perdiste";
        result2 = "Ganaste";
      }

      player1.emit("gameResult", {
        message: result1,
        result: (result1 === "Ganaste" ? "win" : (result1 === "Perdiste" ? "loss" : "draw")),
        playerChoice: choice1,
        opponentChoice: choice2,
        opponentName: player2.playerName
      });
      player2.emit("gameResult", {
        message: result2,
        result: (result2 === "Ganaste" ? "win" : (result2 === "Perdiste" ? "loss" : "draw")),
        playerChoice: choice2,
        opponentChoice: choice1,
        opponentName: player1.playerName
      });

      console.log(`Ronda: ${player1.playerName} ${choice1} vs ${player2.playerName} ${choice2}`);
      player1.choice = null;
      player2.choice = null;
    }
  });

  socket.on("chatMessage", data => {
    console.log(`Chat de ${data.name}: ${data.message}`);
    if (socket.opponent) {
      socket.opponent.emit("chatMessage", data);
    }
    socket.emit("chatMessage", data);
  });

  socket.on("disconnect", () => {
    console.log(`Desconectado: ${socket.playerName || socket.id}`);
    const index = waitingPlayers.indexOf(socket);
    if (index !== -1) waitingPlayers.splice(index, 1);
    if (socket.opponent) {
      socket.opponent.emit("gameResult", { message: "Tu rival se ha desconectado." });
      socket.opponent.opponent = null;
      console.log(`Notificado a ${socket.opponent.playerName} de desconexión del rival.`);
    }
  });

  socket.on("error", err => {
    console.error(`Error en socket ${socket.id}:`, err);
    socket.emit("errorMessage", { error: "Ocurrió un error en el servidor." });
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

http.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

