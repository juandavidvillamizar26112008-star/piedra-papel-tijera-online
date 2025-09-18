// server.js - Servidor principal para Piedra, Papel o Tijera Extendido

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;

// Sirviendo archivos estáticos (HTML, CSS, JS, imágenes, etc.)
app.use(express.static(__dirname));

// Estructura para manejar partidas online
let waitingPlayers = []; // Lista de jugadores en espera

// Función para emparejar jugadores
function pairPlayers(socket) {
  if (waitingPlayers.length > 0) {
    const opponentSocket = waitingPlayers.shift();
    // Empareja los jugadores y establece referencia mutua
    socket.opponent = opponentSocket;
    opponentSocket.opponent = socket;

    // Notifica a ambos jugadores que han sido emparejados
    socket.emit("gameResult", { message: `Rival encontrado: ${opponentSocket.playerName}. ¡Comienza el juego!` });
    opponentSocket.emit("gameResult", { message: `Rival encontrado: ${socket.playerName}. ¡Comienza el juego!` });
    console.log(`Emparejados: ${socket.playerName} vs ${opponentSocket.playerName}`);
  } else {
    waitingPlayers.push(socket);
    socket.emit("gameResult", { message: "Esperando un rival..." });
    console.log(`${socket.playerName} está esperando un rival.`);
  }
}

// Manejo de conexiones Socket.io
io.on("connection", socket => {
  console.log("Nuevo socket conectado:", socket.id);

  // Al unirse un jugador, asignar nombre y emparejarlo si es necesario
  socket.on("playerJoined", data => {
    socket.playerName = data.name || "Anónimo";
    console.log(`Jugador unido: ${socket.playerName}`);
    
    if (data && data.mode && data.mode === "online") {
      pairPlayers(socket);
    }
  });

  // Recibir movimiento del jugador
  socket.on("playerMove", data => {
    socket.choice = data.choice;
    console.log(`Movimiento recibido de ${socket.playerName}: ${socket.choice}`);

    // Si el jugador tiene un oponente y éste ya ha jugado
    if (socket.opponent && socket.opponent.choice) {
      const player1 = socket;
      const player2 = socket.opponent;
      const choice1 = player1.choice;
      const choice2 = player2.choice;

      // Determinar resultados para ambos jugadores
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

      // Emitir resultados a ambos jugadores con información de la jugada
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

      console.log(`Ronda completada: ${player1.playerName} eligió ${choice1} vs ${player2.playerName} eligió ${choice2}`);

      // Reiniciar las elecciones para la siguiente ronda
      player1.choice = null;
      player2.choice = null;
    }
  });

  // Manejo del chat entre jugadores online
  socket.on("chatMessage", data => {
    console.log(`Mensaje de ${data.name}: ${data.message}`);
    // Reenviar mensaje al oponente, si existe; si no, emitir de regreso
    if (socket.opponent) {
      socket.opponent.emit("chatMessage", data);
    }
    // También emitir el mensaje al emisor para confirmar envío
    socket.emit("chatMessage", data);
  });

  // Manejar errores y desconexión
  socket.on("disconnect", () => {
    console.log(`Desconectado: ${socket.playerName || socket.id}`);

    // Si el socket está en la lista de espera, quitarlo
    const index = waitingPlayers.indexOf(socket);
    if (index !== -1) {
      waitingPlayers.splice(index, 1);
    }

    // Informar al oponente si se desconecta
    if (socket.opponent) {
      socket.opponent.emit("gameResult", { message: "Tu rival se ha desconectado." });
      socket.opponent.opponent = null;
      console.log(`Notificado a ${socket.opponent.playerName} que su rival se desconectó.`);
    }
  });

  // Manejar otros posibles eventos personalizados
  socket.on("error", err => {
    console.error(`Error en el socket ${socket.id}:`, err);
    socket.emit("errorMessage", { error: "Ocurrió un error en el servidor." });
  });
});

// Ruta raíz para renderizar index.html (si fuera necesario)
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Iniciar el servidor HTTP
http.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
