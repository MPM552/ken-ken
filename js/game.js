import { generatePuzzle, DIFFICULTY } from './generator.js';

const DEFAULT_SIZE = 6;
const TIMER_INTERVAL_MS = 1000;

let gameState = createEmptyState();

function createEmptyState() {
  return {
  size: DEFAULT_SIZE,
  difficulty: 'easy',
  solution: [],
  cages: [],
  board: [],
  notes: [],
  selectedCell: null,
  notesMode: false,
  timer: 0,
  timerRunning: false,
  timerInterval: null,
  started: false,
  completed: false
  };
}

export function getState() {
  return gameState;
}

export function newGame(difficulty, size) {
  stopTimer();
  if (difficulty) gameState.difficulty = difficulty;
  if (size) gameState.size = size;
  const gridSize = gameState.size;
  const { solution, cages } = generatePuzzle(gridSize, gameState.difficulty);

  gameState.solution = solution;
  gameState.cages = cages;
  gameState.board = Array.from({ length: gridSize }, () => new Array(gridSize).fill(0));
  gameState.notes = Array.from({ length: gridSize }, () =>
  Array.from({ length: gridSize }, () => [])
  );
  gameState.selectedCell = null;
  gameState.notesMode = false;
  gameState.timer = 0;
  gameState.timerRunning = false;
  gameState.started = false;
  gameState.completed = false;
}

export function selectCell(row, col) {
  if (gameState.completed) return;
  if (row < 0 || row >= gameState.size || col < 0 || col >= gameState.size) return;
  gameState.selectedCell = { row, col };
}

export function placeNumber(num) {
  if (!gameState.selectedCell || gameState.completed) return false;
  const { row, col } = gameState.selectedCell;

  if (num < 1 || num > gameState.size) return false;

  if (!gameState.started) {
  gameState.started = true;
  startTimer();
  }

  if (gameState.notesMode) {
  toggleNote(row, col, num);
  } else {
  gameState.board[row][col] = num;
  if (checkWin()) {
    gameState.completed = true;
    stopTimer();
  }
  }
  return true;
}

function toggleNote(row, col, num) {
  const notes = gameState.notes[row][col];
  const index = notes.indexOf(num);
  if (index >= 0) {
  notes.splice(index, 1);
  } else {
  notes.push(num);
  notes.sort((a, b) => a - b);
  }
}

export function toggleNotesMode() {
  gameState.notesMode = !gameState.notesMode;
}

export function clearCell() {
  if (!gameState.selectedCell || gameState.completed) return;
  const { row, col } = gameState.selectedCell;
  if (gameState.board[row][col] !== 0) {
  gameState.board[row][col] = 0;
  } else {
  gameState.notes[row][col] = [];
  }
}

export function resetBoard() {
  stopTimer();
  gameState.timer = 0;
  gameState.started = false;
  gameState.completed = false;
  gameState.notesMode = false;
  gameState.selectedCell = null;

  for (let r = 0; r < gameState.size; r++) {
  for (let c = 0; c < gameState.size; c++) {
  if (!isGivenCell(r, c)) {
      gameState.board[r][c] = 0;
      gameState.notes[r][c] = [];
  }
  }
  }
}

export function moveSelection(dr, dc) {
  if (gameState.completed) return;
  if (!gameState.selectedCell) {
  gameState.selectedCell = { row: 0, col: 0 };
  return;
  }
  const newRow = Math.max(0, Math.min(gameState.size - 1, gameState.selectedCell.row + dr));
  const newCol = Math.max(0, Math.min(gameState.size - 1, gameState.selectedCell.col + dc));
  gameState.selectedCell = { row: newRow, col: newCol };
}

export function findDuplicates(row, col) {
  const num = gameState.board[row][col];
  if (num === 0) return [];
  const dupes = [];
  for (let i = 0; i < gameState.size; i++) {
  if (i !== col && gameState.board[row][i] === num) {
    dupes.push({ row, col: i });
  }
  }

  for (let i = 0; i < gameState.size; i++) {
  if (i !== row && gameState.board[i][col] === num) {
    dupes.push({ row: i, col });
  }
  }
  return dupes;
}

export function findMatchingNumbers(row, col) {
  const num = gameState.board[row][col];
  if (num === 0) return [];
  const matches = [];
  for (let r = 0; r < gameState.size; r++) {
  for (let c = 0; c < gameState.size; c++) {
    if (r === row && c === col) continue;
    if (gameState.board[r][c] === num) {
  matches.push({ row: r, col: c });
    }
  }
  }
  return matchingCages;
}

export function checkWin() {
  const { size, board, solution } = gameState;

  for (let i = 0; i < size; i++) {
  for (let j = 0; j < size; j++) {
    if (board[i][j] === 0) return false;
  }
  }

  for ( let r = 0; r < size; r++) {
  const seen = new Set();
  for (let c = 0; c < size; c++) {
    if (seen.has(board[r][c])) return false;
    seen.add(board[r][c]);
  }
  }

  for (let c = 0; c < size; c++) {
  const seen = new Set();
  for (let r = 0; r < size; r++) {
    if (seen.has(board[r][c])) return false;
    seen.add(board[r][c]);
  }
  }

  for (const cage of gameState.cages) {
  const values = cage.cells.map((c) => board[c.row][c.col]);
  if (!checkCageValues(values, cage.operation, cage.target)) return false;
  }
  return true;
}

function checkCageValues(values, operation, target) {
  if (operation === null) {
  return values[0] === target;
  }
  switch (operation) {
  case '+':
  return values.reduce((a, b) => a + b, 0) === target;
  case '-': {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return max - min === target;
  }
  case '*':
  return values.reduce((a, b) => a * b, 1) === target;
  case '/': {
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  return minVal !== 0 && maxVal / minVal === target;
  }
  default:
  return false;
  }
}

let timerCallback = null;

export function setTimerCallback(callback) {
  timerCallback = callback;
}

export function startTimer() {
  if (gameState.timerRunning) return;
  gameState.timerRunning = true;
  gameState.timerInterval = setInterval(() => {
  gameState.timer++;
  if (timerCallback) {
    timerCallback(gameState.timer);
  }
  }, TIMER_INTERVAL_MS);
}

function stopTimer() {
  if (gameState.timerRunning) {
  clearInterval(gameState.timerInterval);
  gameState.timerInterval = null;
  }
  gameState.timerRunning = false;
}

export function getCageForCell(row, col) {
  for (const cage of gameState.cages) {
  if (cage.cells.some((c) => c.row === row && c.col === col)) {
    return cage;
  }
  }
  return null;
}