const socket = io();

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusDiv = document.getElementById('status');
const scoreboardDiv = document.getElementById('scoreboard');
const joinBtn = document.getElementById('join-btn');
const roomInput = document.getElementById('room-input');
const gameContainer = document.getElementById('game-container');

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;

let roomId = null;
let playerNumber = null;
let gameStarted = false;
let alive = true;

joinBtn.addEventListener('click', () => {
  const room = roomInput.value.trim();
  if (!room) {
    alert('Por favor ingresa un código de sala.');
    return;
  }
  socket.emit('joinRoom', room);
});

socket.on('joinedRoom', (data) => {
  roomId = data.roomId;
  playerNumber = data.playerNumber;
  statusDiv.textContent = `Conectado a la sala ${roomId} como jugador ${playerNumber}. Esperando al otro jugador...`;
  joinBtn.disabled = true;
  roomInput.disabled = true;
});

socket.on('playersUpdate', (count) => {
  if (count === 2) {
    statusDiv.textContent = '¡Ambos jugadores conectados! El juego comenzará pronto.';
  } else {
    statusDiv.textContent = 'Esperando al segundo jugador...';
  }
});

socket.on('roomFull', () => {
  alert('La sala está llena, intenta con otro código.');
  joinBtn.disabled = false;
  roomInput.disabled = false;
});

socket.on('gameStart', () => {
  statusDiv.textContent = '¡Juego iniciado! Usa las teclas para moverte.';
  gameContainer.style.display = 'block';
  gameStarted = true;
  alive = true;
});

socket.on('gameState', (state) => {
  if (!gameStarted) return;
  drawGame(state);
});

socket.on('gameOver', (msg) => {
  statusDiv.textContent = `Juego terminado: ${msg}`;
  gameStarted = false;
  alive = false;
});

socket.on('playerLeft', () => {
  statusDiv.textContent = 'El otro jugador se desconectó. Juego terminado.';
  gameStarted = false;
  alive = false;
});

function drawGame(state) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Dibujar comida
  ctx.fillStyle = 'red';
  ctx.fillRect(state.food.x * GRID_SIZE, state.food.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);

  // Dibujar serpientes
  state.players.forEach((player, i) => {
    ctx.fillStyle = player.alive ? (player.id === socket.id ? 'lime' : 'orange') : 'gray';
    player.snake.forEach((segment, idx) => {
      ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE, GRID_SIZE);
      // Dibujar ojos en cabeza
      if (idx === 0 && player.alive) {
        ctx.fillStyle = 'black';
        const eyeSize = GRID_SIZE / 5;
        ctx.beginPath();
        ctx.arc(segment.x * GRID_SIZE + eyeSize * 2, segment.y * GRID_SIZE + eyeSize * 2, eyeSize, 0, 2 * Math.PI);
        ctx.arc(segment.x * GRID_SIZE + GRID_SIZE - eyeSize * 2, segment.y * GRID_SIZE + eyeSize * 2, eyeSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = player.alive ? (player.id === socket.id ? 'lime' : 'orange') : 'gray';
      }
    });
  });

  // Actualizar marcador
  let scoreText = '';
  state.players.forEach((player, i) => {
    scoreText += `Jugador ${i + 1}: ${player.score} puntos ${player.alive ? '' : '(Muerto)'}<br>`;
  });
  scoreboardDiv.innerHTML = scoreText;
}

// Control de teclado para mover la serpiente
window.addEventListener('keydown', (e) => {
  if (!gameStarted || !alive) return;

  let direction = null;

  // Jugador 1: WASD
  if (playerNumber === 1) {
    if (e.key === 'w' || e.key === 'W') direction = { x: 0, y: -1 };
    else if (e.key === 'a' || e.key === 'A') direction = { x: -1, y: 0 };
    else if (e.key === 's' || e.key === 'S') direction = { x: 0, y: 1 };
    else if (e.key === 'd' || e.key === 'D') direction = { x: 1, y: 0 };
  }

  // Jugador 2: Flechas
  if (playerNumber === 2) {
    if (e.key === 'ArrowUp') direction = { x: 0, y: -1 };
    else if (e.key === 'ArrowLeft') direction = { x: -1, y: 0 };
    else if (e.key === 'ArrowDown') direction = { x: 0, y: 1 };
    else if (e.key === 'ArrowRight') direction = { x: 1, y: 0 };
  }

  if (direction) {
    socket.emit('changeDirection', { roomId, direction });
  }
});
