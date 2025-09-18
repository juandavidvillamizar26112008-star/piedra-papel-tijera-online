// script.js - Versión extendida con muchas funciones y manejo completo

// Variables globales para el estado del juego
let playerName = "";
let gameMode = ""; // "offline" o "online"
let round = 1;
let history = [];
let socket = null;
let canvas, ctx, animationFrame;

// Inicialización del juego y asignación de eventos
function initGame() {
  // Eventos para botones de inicio
  document.getElementById("start-offline").addEventListener("click", startOffline);
  document.getElementById("start-online").addEventListener("click", startOnline);

  // Eventos para reiniciar marcador y juego
  document.getElementById("reset-score").addEventListener("click", resetScore);
  document.getElementById("restart-game").addEventListener("click", restartGame);
  document.getElementById("clear-history").addEventListener("click", clearHistory);

  // Asignar eventos para las elecciones de jugadas
  document.querySelectorAll(".choice").forEach(btn => {
    btn.addEventListener("click", () => {
      const choice = btn.getAttribute("data-choice");
      processChoice(choice);
    });
  });

  // Evento para el chat online
  document.getElementById("chat-send").addEventListener("click", sendChatMessage);

  // Eventos adicionales desde el menú
  document.getElementById("menu-offline").addEventListener("click", () => switchMode("offline"));
  document.getElementById("menu-online").addEventListener("click", () => switchMode("online"));
  document.getElementById("menu-tutorial").addEventListener("click", showTutorial);

  // Inicializar el canvas para animaciones
  initCanvas();
}

// Función para iniciar el modo offline
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

// Función para iniciar el modo online
function startOnline() {
  playerName = document.getElementById("player-name").value.trim();
  if (!playerName) {
    alert("Por favor ingresa tu nombre.");
    return;
  }
  gameMode = "online";
  // Conectar con el servidor usando Socket.io
  socket = io();
  socket.emit("playerJoined", { name: playerName });
  socketListeners();
  switchToGameScreen();
  // Mostrar secciones online
  document.getElementById("chat-section").style.display = "block";
  document.getElementById("stats-section").style.display = "block";
  logEvent("Modo Online iniciado para " + playerName);
}

// Función para alternar entre modos mediante el menú superior
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

// Configurar eventos del socket para modo online
function socketListeners() {
  socket.on("gameResult", data => {
    // Mostrar resultados enviados por el servidor
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

// Transición de la pantalla de login a la pantalla del juego
function switchToGameScreen() {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("game-section").style.display = "block";
}

// Función para procesar las elecciones del usuario
function processChoice(choice) {
  if (gameMode === "offline") {
    playOffline(choice);
  } else if (gameMode === "online" && socket) {
    socket.emit("playerMove", { name: playerName, choice: choice });
  }
  // Registro de la acción del jugador
  logEvent(playerName + " eligió " + choice);
}

// Juego en modo offline: la computadora elige al azar
function playOffline(playerChoice) {
  const options = ["piedra", "papel", "tijera"];
  const compChoice = options[Math.floor(Math.random() * options.length)];
  const result = determineWinner(playerChoice, compChoice);
  displayResult(`Seleccionaste ${playerChoice}, la computadora eligió ${compChoice}. ${result}`);
  updateScoreByResult(result);
  addHistoryEntry(round++, playerName, playerChoice, "Computadora", compChoice, result);
}

// Función para determinar el ganador basado en las reglas del juego
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

// Actualiza el marcador basándose en el resultado del juego offline
function updateScoreByResult(result) {
  if (result === "Ganaste") updateScore("win");
  else if (result === "Perdiste") updateScore("loss");
  else updateScore("draw");
}

// Función para actualizar el marcador de victorias, derrotas y empates
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

// Función para mostrar los resultados en la pantalla
function displayResult(message) {
  document.getElementById("result").textContent = message;
}

// Función para agregar entradas al historial de partidas y actualizar la tabla
function addHistoryEntry(roundNum, player, playerChoice, opponent, opponentChoice, outcome) {
  history.push({ round: roundNum, player, playerChoice, opponent, opponentChoice, outcome });
  const tbody = document.querySelector("#history-table tbody");
  const row = document.createElement("tr");
  row.innerHTML = `<td>${roundNum}</td><td>${player}</td><td>${playerChoice}</td><td>${opponent}</td><td>${opponentChoice}</td><td>${outcome}</td>`;
  tbody.appendChild(row);
}

// Función para limpiar el historial de partidas
function clearHistory() {
  history = [];
  document.querySelector("#history-table tbody").innerHTML = "";
  logEvent("Historial limpio.");
}

// Reiniciar marcador y pantalla de resultados
function resetScore() {
  document.getElementById("wins").textContent = 0;
  document.getElementById("losses").textContent = 0;
  document.getElementById("draws").textContent = 0;
  logEvent("Marcador reiniciado.");
}

// Función para reiniciar el juego completo (incluye historial y resultados)
function restartGame() {
  resetScore();
  displayResult("Juego reiniciado.");
  round = 1;
  clearHistory();
  logEvent("Juego completo reiniciado.");
}

// Función para enviar mensajes en el chat (modo online)
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

// Función para agregar mensajes al chat
function addChatMessage(name, message) {
  const chatBox = document.getElementById("chat-messages");
  const p = document.createElement("p");
  p.textContent = `${name}: ${message}`;
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Inicialización y animación del canvas
function initCanvas() {
  canvas = document.getElementById("gameCanvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  let posX = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Dibujar una figura en movimiento (círculo)
    ctx.fillStyle = "#007BFF";
    ctx.beginPath();
    ctx.arc(50 + (posX % (canvas.width - 100)), canvas.height / 2, 20, 0, Math.PI * 2);
    ctx.fill();
    posX += 2;
    animationFrame = requestAnimationFrame(animate);
  }
  animate();
}

// Función para detener la animación del canvas (si es necesario)
function stopCanvasAnimation() {
  if (animationFrame) cancelAnimationFrame(animationFrame);
}

// Función auxiliar para mostrar el tutorial mediante un modal
function showTutorial() {
  const tutorialModal = document.getElementById("tutorial-modal");
  if (tutorialModal) {
    tutorialModal.style.display = "block";
  }
}

// Función auxiliar para registrar eventos en consola (útil para debugging)
function logEvent(info) {
  console.log(new Date().toLocaleTimeString() + " - " + info);
}

// Función para manejar eventos antes de cerrar o refrescar la página
function beforeUnloadHandler(e) {
  const confirmationMessage = "¿Seguro que quieres salir? Tu sesión de juego se perderá.";
  (e || window.event).returnValue = confirmationMessage;
  return confirmationMessage;
}

// Agregar evento para notificar antes de salir
window.addEventListener("beforeunload", beforeUnloadHandler);

// Inicializar el juego cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", initGame);

