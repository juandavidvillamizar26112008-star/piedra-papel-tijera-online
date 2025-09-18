const socket = io();

const choices = {
  piedra: '✊',
  papel: '✋',
  tijera: '✌️',
};

const buttons = document.querySelectorAll('.choice-btn');
const resultDiv = document.getElementById('result');
const playerChoiceEmoji = document.getElementById('player-choice-emoji');
const computerChoiceEmoji = document.getElementById('computer-choice-emoji');
const resultText = document.getElementById('result-text');
const playAgainBtn = document.getElementById('play-again');
const scoreWin = document.getElementById('score-win');
const scoreLose = document.getElementById('score-lose');
const scoreTie = document.getElementById('score-tie');
const levelDisplay = document.getElementById('level');

let score = { gana: 0, pierde: 0, empate: 0 };
let level = 1;

function updateLevel() {
  level = Math.floor(score.gana / 5) + 1;
  levelDisplay.textContent = `Nivel: ${level}`;
}

function disableButtons(disabled) {
  buttons.forEach(btn => btn.disabled = disabled);
}

buttons.forEach(button => {
  button.addEventListener('click', () => {
    const choice = button.getAttribute('data-choice');
    socket.emit('play', choice);
    disableButtons(true);
  });
});

socket.on('result', ({ playerChoice, computerChoice, result }) => {
  playerChoiceEmoji.textContent = choices[playerChoice];
  computerChoiceEmoji.textContent = choices[computerChoice];

  if (result === 'gana') {
    resultText.textContent = '¡Ganaste! 🎉';
    resultDiv.className = 'result result-gana';
    score.gana++;
  } else if (result === 'pierde') {
    resultText.textContent = 'Perdiste 😞';
    resultDiv.className = 'result result-pierde';
    score.pierde++;
  } else {
    resultText.textContent = 'Empate 🤝';
    resultDiv.className = 'result result-empate';
    score.empate++;
  }

  scoreWin.textContent = score.gana;
  scoreLose.textContent = score.pierde;
  scoreTie.textContent = score.empate;

  updateLevel();

  resultDiv.classList.remove('hidden');
});

playAgainBtn.addEventListener('click', () => {
  resultDiv.classList.add('hidden');
  disableButtons(false);
});
