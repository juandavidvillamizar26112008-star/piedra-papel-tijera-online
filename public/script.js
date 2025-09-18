const socket = io();

const roomInput = document.getElementById('room-input');
const joinBtn = document.getElementById('join-btn');
const statusDiv = document.getElementById('status');
const choicesDiv = document.getElementById('choices');
const resultDiv = document.getElementById('result');
const playAgainBtn = document.getElementById('play-again');

let roomId = null;
let playerNumber = null;

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
  if (playerNumber === 2) {
    statusDiv.textContent = `Sala ${roomId} lista. ¡Ambos jugadores conectados! Elige tu jugada.`;
    choicesDiv.style.display = 'flex';
    joinBtn.disabled = true;
    roomInput.disabled = true;
  }
});

socket.on('roomUpdate', (data) => {
  if (data.playersCount === 2) {
    statusDiv.textContent = `Sala ${roomId} lista. ¡Ambos jugadores conectados! Elige tu jugada.`;
    choicesDiv.style.display = 'flex';
    joinBtn.disabled = true;
    roomInput.disabled = true;
  } else {
    statusDiv.textContent = `Esperando al segundo jugador...`;
    choicesDiv.style.display = 'none';
  }
});

socket.on('roomFull', () => {
  alert('La sala está llena, intenta con otro código.');
});

const choiceButtons = document.querySelectorAll('.choice-btn');
choiceButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const choice = btn.getAttribute('data-choice');
    socket.emit('play', { roomId, choice });
    statusDiv.textContent = 'Esperando la jugada del oponente...';
    choicesDiv.style.display = 'none';
  });
});

socket.on('roundResult', ({ yourChoice, opponentChoice, result }) => {
  resultDiv.innerHTML = `
    <p>Tu jugada: ${yourChoice}</p>
    <p>Jugada del oponente: ${opponentChoice}</p>
    <h3>${result === 'gana' ? '¡Ganaste! 🎉' : result === 'pierde' ? 'Perdiste 😞' : 'Empate 🤝'}</h3>
  `;
  resultDiv.style.display = 'block';
  playAgainBtn.style.display = 'inline-block';
  statusDiv.textContent = '';
});

playAgainBtn.addEventListener('click', () => {
  resultDiv.style.display = 'none';
  choicesDiv.style.display = 'flex';
  statusDiv.textContent = 'Elige tu jugada.';
});

socket.on('playerLeft', () => {
  alert('El otro jugador se desconectó. La partida terminó.');
  location.reload();
});
