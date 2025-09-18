// ================================
// 🎵 Música de fondo
// ================================
const music = new Audio("music.mp3"); // cambia por tu archivo de música
music.loop = true;
let musicPlaying = false;

document.getElementById("musicBtn").addEventListener("click", () => {
  if (musicPlaying) {
    music.pause();
    document.getElementById("musicBtn").innerText = "🎵 Activar Música";
  } else {
    music.play();
    document.getElementById("musicBtn").innerText = "🔇 Pausar Música";
  }
  musicPlaying = !musicPlaying;
});

// ================================
// ⚡ Conexión con Socket.IO
// ================================
const socket = io();

let playerName = "";
let playerChoice = "";
let opponentChoice = "";
let playerScore = 0;
let opponentScore = 0;

// ================================
// 🚀 Inicio del juego
// ================================
document.getElementById("startBtn").addEventListener("click", () => {
  playerName = document.getElementById("playerNameInput").value.trim();
  if (playerName === "") {
    alert("⚠️ Ingresa tu nombre para jugar");
    return;
  }

  // Cambiar pantallas
  document.getElementById("loginScreen").classList.remove("active");
  document.getElementById("gameScreen").classList.add("active");

  document.getElementById("welcomeMsg").innerText = `Bienvenido, ${playerName}!`;

  // Avisar al servidor que un jugador se conectó
  socket.emit("playerJoined", playerName);
});

// ================================
// 🎮 Selección de jugadas
// ================================
const moves = document.querySelectorAll(".moveBtn");

moves.forEach((btn) => {
  btn.addEventListener("click", () => {
    playerChoice = btn.getAttribute("data-move");

    // Mostrar jugada del jugador
    const playerChoiceEl = document.getElementById("playerChoice");
    playerChoiceEl.innerText = getEmoji(playerChoice);
    playerChoiceEl.classList.add("glow");

    // Enviar jugada al servidor
    socket.emit("playerMove", { name: playerName, move: playerChoice });

    setTimeout(() => {
      playerChoiceEl.classList.remove("glow");
    }, 1000);
  });
});

// ================================
// 📡 Escuchar jugada del oponente
// ================================
socket.on("opponentMove", (move) => {
  opponentChoice = move;
  const opponentChoiceEl = document.getElementById("opponentChoice");
  opponentChoiceEl.innerText = getEmoji(opponentChoice);
  opponentChoiceEl.classList.add("glow");

  setTimeout(() => {
    opponentChoiceEl.classList.remove("glow");
  }, 1000);
});

// ================================
// 🏆 Recibir resultado de ronda
// ================================
socket.on("roundResult", (data) => {
  const resultText = document.getElementById("resultText");

  if (data.winner === "draw") {
    resultText.innerText = "🤝 ¡Empate!";
  } else if (data.winner === playerName) {
    resultText.innerText = "🎉 ¡Ganaste esta ronda!";
    playerScore++;
  } else {
    resultText.innerText = "💀 Perdiste esta ronda...";
    opponentScore++;
  }

  // Actualizar marcador
  document.getElementById("playerScore").innerText = `Tus puntos: ${playerScore}`;
  document.getElementById("opponentScore").innerText = `Puntos rival: ${opponentScore}`;
});

// ================================
// 🤝 Mostrar nombre del rival
// ================================
socket.on("updatePlayers", (players) => {
  const opponent = players.find((p) => p !== playerName);
  if (opponent) {
    document.getElementById("opponentLabel").innerText = opponent;
  }
});

// ================================
// 🔤 Función: jugada → emoji
// ================================
function getEmoji(move) {
  switch (move) {
    case "rock": return "✊";
    case "paper": return "✋";
    case "scissors": return "✌️";
    default: return "❓";
  }
}
