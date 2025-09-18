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
  opponentNameDisplay.text
