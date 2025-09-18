const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
app.use(cors());

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = new Server(server);

const choices = ['piedra', 'papel', 'tijera'];

let playerHistory = [];

function getComputerChoice() {
  if (playerHistory.length < 3) {
    return choices[Math.floor(Math.random() * choices.length)];
  }
  const counts = { piedra: 0, papel: 0, tijera: 0 };
  playerHistory.forEach(c => counts[c]++);
  const maxChoice = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  switch (maxChoice) {
    case 'piedra': return 'papel';
    case 'papel': return 'tijera';
    case 'tijera': return 'piedra';
  }
}

function getResult(player, computer) {
  if (player === computer) return 'empate';
  if (
    (player === 'piedra' && computer === 'tijera') ||
    (player === 'papel' && computer === 'piedra') ||
    (player === 'tijera' && computer === 'papel')
  ) return 'gana';
  return 'pierde';
}

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  socket.on('play', (playerChoice) => {
    playerHistory.push(playerChoice);
    if (playerHistory.length > 10) playerHistory.shift();

    const computerChoice = getComputerChoice();
    const result = getResult(playerChoice, computerChoice);

    socket.emit('result', { playerChoice, computerChoice, result });
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
