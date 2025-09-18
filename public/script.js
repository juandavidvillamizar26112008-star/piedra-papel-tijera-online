// script.js - Código extendido para el juego
let playerName = "";
let gameMode = ""; // "offline" o "online"
let round = 1;
let history = [];
let socket = null;
let canvas, ctx, animationFrame;

// Inicialización del juego y asignación de eventos
function initGame() {
  document.getElementById("start-offline").addEventListener("click", startOffline);
  document.getElementById("start-online").addEventListener("click", startOnline);
  document.getElementById("reset-score").addEventListener("click", resetScore);
  document.getElementById("restart-game").addEventListener("click", restartGame);
  document.getElementById("clear-history").addEventListener("click", clearHistory);

  document.querySelectorAll(".choice").forEach(btn => {
    btn.addEventListener("click", () => {
      const choice = btn.getAttribute("data-choice");
      processChoice(choice);
    });
  });

  document.getElementById("chat-send").addEventListener("click", sendChatMessage);
  document.getElementById("menu-offline").addEventListener("click", () => switchMode("offline"));
  document.getElementById("menu-online").addEventListener("click", () => switchMode("online"));
  document.getElementById("menu-tutorial").addEventListener("click", showTutorial);

  initCanvas();
}

// Inicia el modo offline
function startOffline() {
  playerName = document.getElementById("player-name").value.trim();
  if (!playerName) {
    alert("Por favor ingresa tu nombre.");
    return;
  }
  gameMode = "offline";
  switchToGameScreen();
  logEvent("Modo Offline iniciado para " + playerName);
}

// Inicia el modo online y se conecta al servidor
function startOnline() {
  playerName = document.getElementById("player-name").value.trim();
  if (!playerName) {
    alert("Por favor ingresa tu nombre.");
    return;
  }
  gameMode = "online";
  socket = io();
  // Enviar el modo "online" para el emparejamiento
  socket.emit("playerJoined", { name: playerName, mode: "online" });
  socketListeners();
  switchToGameScreen();
  document.getElementById("chat-section").style.display = "block";
  document.getElementById("stats-section").style.display = "block";
  logEvent("Modo Online iniciado para " + playerName);
}

// Cambiar modo desde el menú
function switchMode(mode) {
  if (mode === "offline" || mode === "online") {
    gameMode = mode;
    logEvent("Cambiando modo a " + mode);
    if (mode === "online") {
      startOnline();
    } else {
      startOffline();
    }
  }
}

// Configuración de eventos Socket.io para online
function socketListeners() {
  socket.on("gameResult", data => {
    displayResult(data.message);
    if (data.result) updateScore(data.result);
    addHistoryEntry(
      round++,
      playerName,
      data.playerChoice || "-",
      data.opponentName || "-",
      data.opponentChoice || "-",
      data.message
    );
  });
  socket.on("chatMessage", data => {
    addChatMessage(data.name, data.message);
  });
  socket.on("errorMessage", data => {
    alert("Error: " + data.error);
  });
}

// Transición a la pantalla del juego
function switchToGameScreen() {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("game-section").style.display = "block";
}

// Procesa la elección del jugador
function processChoice(choice) {
  if (gameMode === "offline") {
    playOffline(choice);
  } else if (gameMode === "online" && socket) {
    socket.emit("playerMove", { name: playerName, choice: choice });
  }
  logEvent(playerName + " eligió " + choice);
}

// Juego modo offline
function playOffline(playerChoice) {
  const options = ["piedra", "papel", "tijera"];
  const compChoice = options[Math.floor(Math.random() * options.length)];
  const result = determineWinner(playerChoice, compChoice);
  displayResult(`Seleccionaste ${playerChoice}, la computadora eligió ${compChoice}. ${result}`);
  updateScoreByResult(result);
  addHistoryEntry(round++, playerName, playerChoice, "Computadora", compChoice, result);
}

// Determina el ganador
function determineWinner(choice1, choice2) {
  if (choice1 === choice2) {
    return "Empate";
  }
  if (
    (choice1 === "piedra" && choice2 === "tijera") ||
    (choice1 === "papel" && choice2 === "piedra") ||
    (choice1 === "tijera" && choice2 === "papel")
  ) {
    return "Ganaste";
  } else {
    return "Perdiste";
  }
}

// Actualiza el marcador en base al resultado offline
function updateScoreByResult(result) {
  if (result === "Ganaste") updateScore("win");
  else if (result === "Perdiste") updateScore("loss");
  else updateScore("draw");
}

// Actualiza el marcador
function updateScore(result) {
  const winsElem = document.getElementById("wins");
  const lossesElem = document.getElementById("losses");
  const drawsElem = document.getElementById("draws");
  if (result === "win") {
    winsElem.textContent = parseInt(winsElem.textContent) + 1;
  } else if (result === "loss") {
    lossesElem.textContent = parseInt(lossesElem.textContent) + 1;
  } else if (result === "draw") {
    drawsElem.textContent = parseInt(drawsElem.textContent) + 1;
  }
}

// Muestra resultado en la pantalla
function displayResult(message) {
  document.getElementById("result").textContent = message;
}

// Añade entrada al historial de partidas
function addHistoryEntry(roundNum, player, playerChoice, opponent, opponentChoice, outcome) {
  history.push({ round: roundNum, player, playerChoice, opponent, opponentChoice, outcome });
  const tbody = document.querySelector("#history-table tbody");
  const row = document.createElement("tr");
  row.innerHTML = `<td>${roundNum}</td><td>${player}</td><td>${playerChoice}</td><td>${opponent}</td><td>${opponentChoice}</td><td>${outcome}</td>`;
  tbody.appendChild(row);
}

// Limpia el historial
function clearHistory() {
  history = [];
  document.querySelector("#history-table tbody").innerHTML = "";
  logEvent("Historial limpio.");
}

// Reinicia solo el marcador
function resetScore() {
  document.getElementById("wins").textContent = 0;
  document.getElementById("losses").textContent = 0;
  document.getElementById("draws").textContent = 0;
  logEvent("Marcador reiniciado.");
}

// Reinicia juego completo
function restartGame() {
  resetScore();
  displayResult("Juego reiniciado.");
  round = 1;
  clearHistory();
  logEvent("Juego completo reiniciado.");
}

// Envía mensaje de chat en línea
function sendChatMessage() {
  const msgInput = document.getElementById("chat-input");
  const message = msgInput.value.trim();
  if (message && socket) {
    socket.emit("chatMessage", { name: playerName, message: message });
    addChatMessage(playerName, message);
    msgInput.value = "";
    logEvent("Mensaje de chat enviado: " + message);
  }
}

// Añade mensaje al chat
function addChatMessage(name, message) {
  const chatBox = document.getElementById("chat-messages");
  const p = document.createElement("p");
  p.textContent = `${name}: ${message}`;
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Inicializa y anima el canvas
function initCanvas() {
  canvas = document.getElementById("gameCanvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  let posX = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#007BFF";
    ctx.beginPath();
    ctx.arc(50 + (posX % (canvas.width - 100)), canvas.height / 2, 20, 0, Math.PI * 2);
    ctx.fill();
    posX += 2;
    animationFrame = requestAnimationFrame(animate);
  }
  animate();
}

// Detiene la animación del canvas si es necesario
function stopCanvasAnimation() {
  if (animationFrame) cancelAnimationFrame(animationFrame);
}

// Muestra el tutorial (modal)
function showTutorial() {
  const tutorialModal = document.getElementById("tutorial-modal");
  if (tutorialModal) {
    tutorialModal.style.display = "block";
  }
}

// Registra eventos en consola para debugging
function logEvent(info) {
  console.log(new Date().toLocaleTimeString() + " - " + info);
}

// Confirma antes de salir de la página
function beforeUnloadHandler(e) {
  const confirmationMessage = "¿Seguro que quieres salir? Tu sesión de juego se perderá.";
  (e || window.event).returnValue = confirmationMessage;
  return confirmationMessage;
}

window.addEventListener("beforeunload", beforeUnloadHandler);
document.addEventListener("DOMContentLoaded", initGame);

