const socket = io();

// Elementos del DOM
const startContainer = document.getElementById("startContainer");
const gameContainer = document.getElementById("gameContainer");
const startButton = document.getElementById("startButton");
const playerNameInput = document.getElementById("playerNameInput");
const welcomeMessage = document.getElementById("welcomeMessage");
const opponentNameElement = document.getElementById("opponentName");
const playerChoiceEl = document.getElementById("playerChoice");
const opponentChoiceEl = document.getElementById("opponentChoice");
const playerScoreEl = document.getElementById("playerScore");
const opponentScoreEl = document.getElementById("opponentScore");
const resultMessage = document.getElementById("resultMessage");

let playerName = "";
let playerScore = 0;
let opponentScore = 0;

// Botón de inicio
startButton.addEventListener("click", () => {
  const name = playerNameInput.value.trim();
  if (!name) {
    alert("Por favor, escribe tu nombre.");
    return;
  }

  playerName = name;
  socket.emit("joinGame", playerName);

  welcomeMessage.textContent = `Bienvenido, ${playerName}!`;

  // Ocultar inicio y mostrar juego
  startContainer.style.display = "none";
  gameContainer.style.display = "block";
});

// Función para enviar jugadas
function makeChoice(choice) {
  playerChoiceEl.textContent = choiceEmoji(choice);
  socket.emit("playerMove", { name: playerName, move: choice });
  resultMessage.textContent = "Esperando jugada del rival...";
}

// Mostrar jugada como emoji
function choiceEmoji(choice) {
  if (choice === "piedra") return "✊";
  if (choice === "papel") return "✋";
  if (choice === "tijera") return "✌️";
  return "❓";
}

// Escuchar cuando se asigna un rival
socket.on("opponentFound", (opponentName) => {
  opponentNameElement.textContent = opponentName || "Esperando...";
});

// Escuchar jugadas resueltas
socket.on("roundResult", (data) => {
  const { playerMove, opponentMove, winner } = data;

  playerChoiceEl.textContent = choiceEmoji(playerMove);
  opponentChoiceEl.textContent = choiceEmoji(opponentMove);

  if (winner === "empate") {
    resultMessage.textContent = "🤝 ¡Empate!";
  } else if (winner === playerName) {
    playerScore++;
    playerScoreEl.textContent = `Tus puntos: ${playerScore}`;
    resultMessage.textContent = "🎉 ¡Ganaste esta ronda!";
  } else {
    opponentScore++;
    opponentScoreEl.textContent = `Puntos Rival: ${opponentScore}`;
    resultMessage.textContent = "😢 Perdiste esta ronda...";
  }
});

// Música ON/OFF
const musicToggle = document.getElementById("musicToggle");
let musicOn = false;
let audio = new Audio("music.mp3");

musicToggle.addEventListener("click", () => {
  if (musicOn) {
    audio.pause();
    musicToggle.textContent = "🎵 Música: OFF";
  } else {
    audio.loop = true;
    audio.play();
    musicToggle.textContent = "🎵 Música: ON";
  }
  musicOn = !musicOn;
});


