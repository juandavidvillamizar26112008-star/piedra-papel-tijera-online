// ================================
// 🎵 Música de fondo
// ================================
const music = new Audio("music.mp3"); // pon tu archivo de música aquí
music.loop = true;
let musicPlaying = false;

document.getElementById("musicBtn").addEventListener("click", () => {
  if (musicPlaying) {
    music.pause();
    document.getElementById("musicBtn").innerText = "🎵 Música: OFF";
  } else {
    music.play();
    document.getElementById("musicBtn").innerText = "🔊 Música: ON";
  }
  musicPlaying = !musicPlaying;
});

// ================================
// ⚡ Conexión con Socket.IO
// ================================
const socket = io(); // Se conecta al servidor donde esté corriendo socket.io

let playerName = "";
let rivalName = "";
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

  // Mostrar pantalla de juego
  document.querySelector(".name-input").style.display = "none";
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

    // Avisar al servidor de la jugada
    socket.emit("playerMove", { name: playerName, move: playerChoice });

    // Reset glow después de 1 segundo
    setTimeout(() => {
      playerChoiceEl.classList.remove("glow");
    }, 1000);
  });
});

// ================================
// 📡 Escuchar jugada del oponente
// ================================
socket.on("opponentMove", (data) => {
  opponentChoice = data.move;
  rivalName = data.name;

  document.getElementById("opponentLabel").innerText = `Rival: ${rivalName}`;
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
  document.getElementById("opponentScore").innerText = `Puntos Rival: ${opponentScore}`;
});

// ================================
// 🔤 Función: convertir jugada a emoji
// ================================
function getEmoji(move) {
  switch (move) {
    case "piedra": return "✊";
    case "papel": return "✋";
    case "tijera": return "✌️";
    default: return "❓";
  }
}

