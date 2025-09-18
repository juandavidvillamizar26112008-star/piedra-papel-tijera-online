const playerScoreSpan = document.getElementById('playerScore');
const rivalScoreSpan = document.getElementById('rivalScore');
const resultMessage = document.getElementById('resultMessage');
const roundDetails = document.getElementById('roundDetails');
const choiceButtons = document.querySelectorAll('.choice-btn');
const resetBtn = document.getElementById('resetBtn');

let playerScore = 0;
let rivalScore = 0;
let isPlaying = true;

const choices = ['piedra', 'papel', 'tijera'];

function getRivalChoice() {
  const randomIndex = Math.floor(Math.random() * choices.length);
  return choices[randomIndex];
}

function determineWinner(player, rival) {
  if (player === rival) return 'empate';

  if (
    (player === 'piedra' && rival === 'tijera') ||
    (player === 'papel' && rival === 'piedra') ||
    (player === 'tijera' && rival === 'papel')
  ) {
    return 'jugador';
  } else {
    return 'rival';
  }
}

function updateScores(winner) {
  if (winner === 'jugador') {
    playerScore++;
    playerScoreSpan.textContent = playerScore;
  } else if (winner === 'rival') {
    rivalScore++;
    rivalScoreSpan.textContent = rivalScore;
  }
}

function showResult(playerChoice, rivalChoice, winner) {
  let message = '';
  if (winner === 'empate') {
    message = "¡Empate!";
  } else if (winner === 'jugador') {
    message = "¡Ganaste esta ronda!";
  } else {
    message = "¡Perdiste esta ronda!";
  }

  resultMessage.textContent = message;
  roundDetails.textContent = `Tú: ${playerChoice} vs Rival: ${rivalChoice}`;
}

function disableChoices(disabled) {
  choiceButtons.forEach(btn => {
    btn.disabled = disabled;
    if (disabled) {
      btn.classList.add('disabled');
    } else {
      btn.classList.remove('disabled');
    }
  });
}

function resetGame() {
  playerScore = 0;
  rivalScore = 0;
  playerScoreSpan.textContent = playerScore;
  rivalScoreSpan.textContent = rivalScore;
  resultMessage.textContent = "Elige tu jugada para comenzar";
  roundDetails.textContent = '';
  resetBtn.hidden = true;
  isPlaying = true;
  disableChoices(false);
}

choiceButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (!isPlaying) return;

    isPlaying = false;
    disableChoices(true);

    const playerChoice = button.dataset.choice;
    const rivalChoice = getRivalChoice();
    const winner = determineWinner(playerChoice, rivalChoice);

    updateScores(winner);
    showResult(playerChoice, rivalChoice, winner);

    // Mostrar botón reiniciar si alguien llega a 5 puntos
    if (playerScore === 5 || rivalScore === 5) {
      resultMessage.textContent += playerScore === 5 ? " 🎉 ¡Ganaste el juego!" : " 😞 ¡Perdiste el juego!";
      resetBtn.hidden = false;
      disableChoices(true);
    } else {
      // Permitir siguiente jugada después de 1.5 segundos
      setTimeout(() => {
        isPlaying = true;
        disableChoices(false);
        resultMessage.textContent = "Elige tu jugada para continuar";
        roundDetails.textContent = '';
      }, 1500);
    }
  });
});

resetBtn.addEventListener('click', resetGame);



