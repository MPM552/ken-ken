import {
  newGame, getState, selectCell, placeNumber, toggleNotesMode,
  clearCell, resetBoard, moveSelection, setTimerCallback
} from './game.js';

import {
  renderGrid, updateAllCells, updateHighlights, updateTimer,
  updateNotesButton, showCelebration, hideCelebration
} from './renderer.js';

let selectedSize = 6;

document.addEventListener('DOMContentLoaded', () => {
  initGame();
  wireEvents();
});

function initGame() {
  hideCelebration();
  setTimerCallback(updateTimer);
  showSizeOverlay();
}

function wireEvents() {
  document.getElementById('game-grid').addEventListener('click', handleCellClick);

  document.addEventListener('keydown', handleKeyDown);

  document.getElementById('notes-button').addEventListener('click', handleNotesToggle);

  document.getElementById('clear-button').addEventListener('click', handleClear);

  document.getElementById('reset-button').addEventListener('click', handleReset);

  document.getElementById('new-game-button').addEventListener('click', showSizeOverlay);

  document.querySelectorAll('.size-button').forEach(button => {
  button.addEventListener('click', () => {
    selectedSize = parseInt(button.dataset.size, 10);
    hideSizeOverlay();
    showDifficultyOverlay();
  });
  });

  document.querySelectorAll('.difficulty-button').forEach(button => {
  button.addEventListener('click', () => {
    const difficulty = button.dataset.difficulty;
    hideDifficultyOverlay();
    startGame(difficulty, selectedSize);
  });
  });

  const celebrationBtn = document.getElementById('celebration-button');
  if (celebrationBtn) {
  celebrationBtn.addEventListener('click', () => {
    hideCelebration();
    showSizeOverlay();
  });
  }
}

function handleCellClick(event) {
  const cell = event.target.closest('.cell')  ;
  if (!cell) return;

  const row = parseInt(cell.dataset.row, 10);
  const col = parseInt(cell.dataset.col, 10);
  selectCell(row, col);
  updateHighlights();
}

function handleKeyDown(event) {
  const key = event.key;
  if (key >= '1' && key <= '9') {
  event.preventDefault();
  handleNumberInput(parseInt(key, 10));
  return;
  }

  switch (key) {
  case 'ArrowUp':
  event.preventDefault();
  moveSelection(-1, 0);
  updateHighlights();
  return;
  case 'ArrowDown':
  event.preventDefault();
  moveSelection(1, 0);
  updateHighlights();
  return;
  case 'ArrowLeft':
  event.preventDefault();
  moveSelection(0, -1);
  updateHighlights();
  return;
  case 'ArrowRight':
  event.preventDefault();
  moveSelection(0, 1);
  updateHighlights();
  return;
  }

  if (event.key === 'n' || event.key === 'N') {
  event.preventDefault();
  handleNotesToggle();
  return;
  }

  if (event.key === 'Backspace' || event.key === 'Delete') {
  event.preventDefault();
  handleClear();
  return;
  }
}

function handleNumberInput(num) {
  const placed = placeNumber(num);
  if (!placed) return;

  const state = getState();
  updateAllCells();
  updateHighlights();

  if (state.completed) {
  showCelebration();
  }
}

function handleNotesToggle() {
  toggleNotesMode();
  const state = getState();
  updateNotesButton(state.notesMode);
}

function handleClear() {
  clearCell();
  updateAllCells();
  updateHighlights();
}

function handleReset() {
  resetBoard();
  hideCelebration();
  renderGrid();
  updateTimer(0);
  updateNotesButton(false);
}

function showDifficultyOverlay() {
  document.getElementById('difficulty-overlay').classList.add('visible');
}

function hideDifficultyOverlay() {
  document.getElementById('difficulty-overlay').classList.remove('visible');
}

function showSizeOverlay() {
  document.getElementById('size-overlay').classList.add('visible');
}

function hideSizeOverlay() {
  document.getElementById('size-overlay').classList.remove('visible');
}   

function startGame(difficulty, size) {
  hideCelebration();
  newGame(difficulty, size);
  renderGrid();
  renderNumberButtons(size);
  updateTimer(0);
  updateNotesButton(false);
  document.getElementById('difficulty-label').textContent = 
  `${size}x${size} • ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
}

function renderNumberButtons(size) {
  const container = document.getElementById('number-buttons');
  container.innerHTML = '';
  for (let i = 1; i <= size; i++) {
  const button = document.createElement('button');
  button.className = 'number-button';
  button.dataset.number = i;
  button.textContent = i;
  button.addEventListener('click', () => handleNumberInput(i));
  container.appendChild(button);
  }
}

