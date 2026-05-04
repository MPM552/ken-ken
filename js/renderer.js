import { getState, findDuplicates, findMatchingNumbers } from './game.js';

const OPERATION_DISPLAY = {
  '+': '+',
  '-': '\u2212',
  '*': '\u00D7',
  '/': '\u00F7'
};

export function renderGrid () {
  const state = getState();
  const grid = document.getElementById('game-grid');
  grid.innerHTML = '';
  grid.style.gridTemplateColumns = `repeat(${state.size}, 1fr)`;

  const cageLookup = buildCageLookup(state);

  for (let i = 0; i < state.size; i++) {
  for (let j = 0; j < state.size; j++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.row = i;
    cell.dataset.col = j;

    const cage = cageLookup[i][j];
    applyBoarders(cell, i, j, cage, cageLookup, state.size);

    if (isCageLabelCell(i, j, cage)) {
  const label = document.createElement('span');
  label.className = 'cage-label';
  if (cage.cells.length === 1) {
    label.textContent = `${cage.target}`;
  } else {
    label.textContent = `${cage.target}${OPERATION_DISPLAY[cage.operation]}`;
  }
  cell.appendChild(label);
    }

    const numDisplay = document.createElement('span');
    numDisplay.className = 'cell-number';
    cell.appendChild(numDisplay);

    const notesDisplay = document.createElement('div');
    notesDisplay.className = 'cell-notes';
    cell.appendChild(notesDisplay);

    grid.appendChild(cell);
  }
  }

  updateAllCells();
  updateHighlights();
}

export function updateAllCells() {
  const state = getState();
  for (let i = 0; i < state.size; i++) {
  for (let j = 0; j < state.size; j++) {
    updateCellDisplay(i, j);
  }
  }
}

function updateCellDisplay(row, col) {
  const state = getState();
  const cell = getCellElement(row, col);
  if (!cell) return;

  const numEl = cell.querySelector('.cell-number');
  const notesEl = cell.querySelector('.cell-notes');

  const value = state.board[row][col];
  const notes = state.notes[row][col];

  if (value !== 0) {
  numEl.textContent = value;
  numEl.style.display = '';
  notesEl.style.display = 'none';
  } else if (notes && notes.length > 0) {
  numEl.style.display = 'none';
  notesEl.style.display = '';
  notesEl.innerHTML = '';
  for (let i = 1; i <= notes.length; i++) {
    const noteElement = document.createElement('span');
    noteElement.className = 'note-number';
    noteElement.textContent = notes.includes(i) ? i : '';
    notesEl.appendChild(noteElement);
  }
  } else {
  numEl.textContent = '';
  numEl.style.display = '';
  notesEl.style.display = 'none';
  }
}

export function updateHighlights() {
  const state = getState();
  const allCells = document.querySelectorAll('.cell');
  allCells.forEach(cell => {
  cell.classList.remove('cell-selected', 'cell-highlight', 'cell-error');
  });
  if (!state.selectedCell) return;

  const { row, col } = state.selectedCell;
  const selectedEl = getCellElement(row, col);
  if (selectedEl) {
  selectedEl.classList.add('cell-selected');
  }

  const num = state.board[row][col];
  if (num !== 0) {
  const matches = findMatchingNumbers(row, col);
  for (const match of matches) {
    const el = getCellElement(match.row, match.col);
    if (el) el.classList.add('cell-highlighted');
  }

  const dupes = findDuplicates(row, col);
  if (dupes.length > 0) {
    selectedEl.classList.add('cell-error');
    for (const dupe of dupes) {
  const el = getCellElement(dupe.row, dupe.col);
  if (el) {
    el.classList.remove('cell-highlight');
    el.classList.add('cell-error');
  }
    }
  }
  }   
}

export function updateTimer(seconds) {
  const el = document.getElementById('timer-display');
  if (!el) return;
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  el.textContent = `${mins}:${secs}`;
}

export function updateNotesButton(isActive) {
  const btn = document.getElementById('notes-button');
  if (!btn) return;
  btn.textContent = isActive ? 'Notes: ON' : 'Notes: OFF';
  btn.classList.toggle('active', isActive);
}

export function showCelebration() {
  const state = getState();
  const overlay = document.getElementById('celebration');
  if (!overlay) return;

  const timeEl = overlay.querySelector('.celebration-time');
  if (timeEl) {
  const mins = String(Math.floor(state.timer / 60)).padStart(2, '0');
  const secs = String(state.timer % 60).padStart(2, '0');
  timeEl.textContent = `Time: ${mins}:${secs}`;
  }
  overlay.classList.add('visible');
}

export function hideCelebration() {
  const overlay = document.getElementById('celebration');
  if (overlay) {
  overlay.classList.remove('visible');
  }
}

function getCellElement(row, col) {
  return document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
}

function buildCageLookup(state) {
  const lookup = Array.from({ length: state.size }, () => new Array(state.size).fill(null));
  for (const cage of state.cages) {
  for (const cell of cage.cells) {
    lookup[cell.row][cell.col] = cage;
  }
  }
  return lookup;
}

function applyBoarders(cellEl, row, col, cage, cageLookup, size) {
  const cageId = cage.id;

  if (row === 0 || cageLookup[row - 1][col].id !== cage) {
  cellEl.classList.add('border-top');
  }
  if (row === size - 1 || cageLookup[row + 1][col].id !== cage) {
  cellEl.classList.add('border-bottom');
  }
  if (col === 0 || cageLookup[row][col - 1].id !== cage) {
  cellEl.classList.add('border-left');
  }
  if (col === size - 1 || cageLookup[row][col + 1].id !== cage) {
  cellEl.classList.add('border-right');
  }
}

function isCageLabelCell(row, col, cage) {
  let minRow = Infinity, minCol = Infinity;
  for (const cell of cage.cells) {
  if (cell.row < minRow || (cell.row === minRow && cell.col < minCol)) {
    minRow = cell.row;
    minCol = cell.col;
  }
  }
  return row === minRow && col === minCol;
}