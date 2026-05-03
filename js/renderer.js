import { getState, findDuplicates, findMatchingNumbers } from './game.js';

const OPERATION_DISPLAY = {
    '+': '+',
    '-': '\u2212',
    '*': '\u00D7',
    '/': '\u00F7'
};

export function renderGird () {
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
                    label.textContent = `${cage.value}`;
                } else {
                    label.textContent = `${cage.value}${OPERATION_DISPLAY[cage.operation]}`;
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
    updateHighlights()
}