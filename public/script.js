const socket = io();

const loginScreen = document.getElementById('loginScreen');
const gameScreen = document.getElementById('gameScreen');
const playerNameInput = document.getElementById('playerNameInput');
const startBtn = document.getElementById('startBtn');
const playerNameDisplay = document.getElementById('playerNameDisplay');
const opponentNameDisplay = document.getElementById('opponentNameDisplay');
const playerScoreSpan = document.getElementById('playerScore');
const rivalScoreSpan = document.getElementById('rivalScore');
const resultMessage = document.getElementById('resultMessage');
const roundDetails = document.getElementById('roundDetails');
const choiceButtons = document.querySelectorAll('.choice-btn');
const resetBtn = document.getElementById('resetBtn');

const soundClick = document.getElementById('soundClick');
const soundWin = document.getElementById('soundWin');
const soundLose = document.getElementById('soundLose');
const soundDraw = document.getElementById('soundDraw');

let playerName = '';
let opponentName = '';
let roomId = null;
let playerScore = 0;
let rivalScore = 0;
let canPlay = false;

// Habilitar botón iniciar solo si hay texto
playerNameInput.addEventListener('input', () => {
  startBtn.disabled = playerNameInput.value.trim().length === 0;
});

// Iniciar juego y enviar login
startBtn.addEventListener('click', () => {
  playerName = playerNameInput.value.trim();
  if (!playerName) return;

  socket.emit('login', playerName);
  playerNameDisplay.textContent = playerName;
  loginScreen.classList.remove('active');
  gameScreen.classList.add('active');
  resultMessage.textContent = 'Buscando rival...';
});

// Esperando rival
socket.on('waiting', (msg) => {
  resultMessage.textContent = msg;
  opponentNameDisplay.textContent = 'Esperando...';
  canPlay = false;
});

// Comienza la partida
socket.on('startGame', (data) => {
  roomId = data.roomId;
  opponentName = data.opponent;
  opponentNameDisplay.textContent = opponentName;
  playerScore = 0;
  rivalScore = 0;
  playerScoreSpan.textContent = playerScore;
  rivalScoreSpan.textContent = rivalScore;
  resultMessage.textContent = '¡Partida iniciada! Elige tu jugada';
  roundDetails.textContent = '';
  resetBtn.hidden = true;
  canPlay = true;
});

// Manejar jugada
choiceButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (!canPlay) return;
    const choice = btn.dataset.choice;
    soundClick.play();
    canPlay = false;
    socket.emit('play', { roomId, choice });
    resultMessage.textContent = 'Esperando jugada del rival...';
  });
});

// Resultado de la ronda
socket.on('roundResult', (data) => {
  const { choices, winner } = data;
  const playerChoice = choices[socket.id];
  const rivalSocketId = Object.keys(choices).find(id => id !== socket.id);
  const rivalChoice = choices[rivalSocketId];

  let message = '';
  if (winner === 'draw') {
    message = '¡Empate!';
    soundDraw.play();
  } else if ((winner === 'p1' && socket.id === Object.keys(choices)[0]) ||
             (winner === 'p2' && socket.id === Object.keys(choices)[1])) {
    message = '¡Ganaste esta ronda!';
    playerScore++;
    playerScoreSpan.textContent = playerScore;
    soundWin.play();
  } else {
    message = '¡Perdiste esta ronda!';
    rivalScore++;
    rivalScoreSpan.textContent = rivalScore;
    soundLose.play();
  }

  resultMessage.textContent = message;
  roundDetails.textContent = `Tú: ${playerChoice} vs Rival: ${rivalChoice}`;

  // Permitir jugar siguiente ronda después de 2 segundos
  setTimeout(() => {
    if (playerScore >= 5 || rivalScore >= 5) {
      const finalMsg = playerScore > rivalScore ? '🎉 ¡Ganaste el juego!' : '😞 ¡Perdiste el juego!';
      resultMessage.textContent = finalMsg;
      resetBtn.hidden = false;
      canPlay = false;
    } else {
      resultMessage.textContent = 'Elige tu jugada para la siguiente ronda';
      roundDetails.textContent = '';
      canPlay = true;
    }
  }, 2000);
});

// Rival desconectado
socket.on('opponentLeft', () => {
  resultMessage.textContent = 'Tu rival se desconectó. Esperando nuevo rival...';
  opponentNameDisplay.textContent = 'Esperando...';
  rivalScore = 0;
  playerScore = 0;
  playerScoreSpan.textContent = playerScore;
  rivalScoreSpan.textContent = rivalScore;
  canPlay = false;
  resetBtn.hidden = true;
});

// Reiniciar juego
resetBtn.addEventListener('click', () => {
  playerScore = 0;
  rivalScore = 0;
  playerScoreSpan.textContent = playerScore;
  rivalScoreSpan.textContent = rivalScore;
  resultMessage.textContent = 'Buscando rival...';
  roundDetails.textContent = '';
  resetBtn.hidden = true;
  canPlay = false;
  socket.emit('login', playerName);
});
