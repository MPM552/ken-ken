import {shuffle, random} from './utils.js';
import { countSolutions } from './solver.js';

const MAX_RETRY_COUNT = 5;
const MAX_SOLUTIONS = 2;

export const DIFFICULTY = {
  easy:   { maxCageSize: 4, maxSingleCells: 6, twoCellWeight: 5 },
  medium: { maxCageSize: 5, maxSingleCells: 3, twoCellWeight: 5 },
  hard:   { maxCageSize: 6, maxSingleCells: 4, twoCellWeight: 2 },
};

export function generatePuzzle(size, difficulty = 'easy') {
  let bestPuzzle = null;
  let bestSolutionCount = Infinity;

  const baseSettings = DIFFICULTY[difficulty] || DIFFICULTY.easy;
  const settings = {
  ...baseSettings,
  maxCageSize: Math.min(baseSettings.maxCageSize, size)
  };

  for (let i = 0; i < MAX_RETRY_COUNT; i++) {
  const solution = generateLatinSquare(size);
  const cages = partitionIntoCages(size, settings);
  assignOperationsAndTargets(cages, solution, size);

  const solutionCount = countSolutions(cages, size, MAX_SOLUTIONS + 1);
  console.log(`Generation attempts: ${i + 1}, Solutions found: ${solutionCount}`);

  if (solutionCount === 1) {
    return { solution, cages };
  }  

  if (solutionCount <= MAX_SOLUTIONS && solutionCount > 0) {
    if (solutionCount < bestSolutionCount) {
  bestPuzzle = { solution, cages };
  bestSolutionCount = solutionCount;
    }
    continue;
  }

  if (solutionCount > 0 && solutionCount < bestSolutionCount) {
    bestPuzzle = { solution, cages };
    bestSolutionCount = solutionCount;
  }
  }
  console.log(`Best puzzle found: ${bestSolutionCount} solutions`);
  return bestPuzzle;
}

function generateLatinSquare(size) {
  const base = Array.from({ length: size }, (_, i) => i + 1);
  return shuffle(base);

  const grid =[];
  for (let i = 0; i < size; i++) {
  const row = [];
  for (let j = 0; j < size; j++) {
    row.push(base[(i + j) % size]);
  }
  grid.push(row);
  }
  
  const rowOrder = Array.from({ length: size }, (_, i) => i);
  shuffle(rowOrder);
  const shuffledRows = rowOrder.map(i => grid[i]);

  const colOrder = Array.from({ length: size }, (_, i) => i);
  shuffle(colOrder);
  const result = shuffledRows.map(row => colOrder.map(j => row[j]));

  return result;
}

function partitionIntoCages(size, settings) {
  const assigned = Array.from({ length: size }, () => Array(size).fill(false));
  const cages = [];
  let cageId = 0;
  const maxSingleCells = settings.maxSingleCells;
  let singleCellCount = 0;

  const allCells = [];
  for (let i = 0; i < size; i++) {
  for (let j = 0; j < size; j++) {
    allCells.push({ row: i, col: j });
  }
  }
  shuffle(allCells);

  for (const startCell of allCells) {
  if (assigned[startCell.row][startCell.col]) {
    continue;
  }

  const maxCageSize = settings.maxCageSize;
  let cageSize = weightedCageSize(maxCageSize, singleCellCount, maxSingleCells, settings.twoCellWeight);

  if(cageSize === 1 && singleCellCount >= maxSingleCells) {
    cageSize = 2;
  }

  const cells = [startCell];
  assigned[startCell.row][startCell.col] = true;

  while (cells.length < cageSize) {
    const neighbors = getUnassignedNeighbors(cells, assigned, size);
    if (neighbors.length === 0) {
  break;
    }
    const nextCell = neighbors[randomInt(0, neighbors.length - 1)];
    cells.push(nextCell);
    assigned[nextCell.row][nextCell.col] = true;
  }

  if (cells.length === 1) {
    singleCellCount++;
  }
  
  cells.push({
    id: cageId++,
    cells,
    operation: null,
    target: 0
  });
  }

  if (singleCellCount > maxSingleCells) {
  mergeSingleCells(cages, maxSingleCells, size);
  }

  return cages;
}

function mergeSingleCells(cages, maxSingleCells, size) {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  const cellToCage = new Map();
  for (const cage of cages) {
  for (const cell of cage.cells) {
    cellToCage.set(`${cell.row},${cell.col}`, cage);
  }
  }

  const singles = cages.filter(cage => cage.cells.length === 1);
  shuffle(singles);

  let merged = 0;
  for (const cage of singles) {
  const currentSignleCount = cages.filter(c => c.cells.length === 1).length;
  if (currentSignleCount <= maxSingleCells) {
    break;
  }
  const cell = cage.cells[0];
  for (const [dr, dc] of directions) {
    const nr = cell.row + dr;
    const nc = cell.col + dc;
    const key = `${nr},${nc}`;
    const neighbor = cellToCage.get(key);
    if (neighbor && neighbor !== cage) {
  neighbor.cells.push(cell);
  cage.cells = [];
  cellToCage.set(`${cell.row},${cell.col}`, neighbor);
  merged++;
  break;
    }
  }
  }

  for (let i =  cages.length - 1; i >= 0; i--) {
  if (cages[i].cells.length === 0) {
    cages.splice(i, 1);
  }
  }
}

function weightedCageSize(maxCageSize, singleCellCount, maxSingleCells, twoCellWeight) {
  const weights = [];
  for (let i = 1; i <= maxCageSize; i++) {
  if (i === 1) {
    weights.push(singleCellCount < maxSingleCells ? 1 : 0);
  } else if (i === 2) {
    weights.push(twoCellWeight);
  } else if (i === 3) {
    weights.push(5);
  } else {
    weights.push(3);
  }
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
  random -= weights[i];
  if (random <= 0) {
    return i + 1;
  }
  }
  return 2;
}
  
function getUnassignedNeighbors(cells, assigned, size) {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const cellsSet = new Set(cells.map(c => `${c.row},${c.col}`));
  const neighborMap = new Map();

  for (const cell of cells) {
  for (const [dr, dc] of directions) {
    const nr = cell.row + dr;
    const nc = cell.col + dc;
    const key = `${nr},${nc}`;
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && !assigned[nr][nc] && !cellsSet.has(key)) {
  neighborMap.set(key, { row: nr, col: nc });
    }
  }
  }
  return Array.from(neighborMap.values());
}

function assignOperationsAndTargets(cages, solution, size){
  for (const cage of cages) {
  const values = cage.cells.map(cell => solution[cell.row][cell.col]);

  if(values.length === 1) {
    cage.operation = null;
    cage.target = values[0];
    continue;
  }

  if(values.length === 2) {
    const ops = getPossibleOps2(values[0], values[1]);
    const op = ops[randomInt(0, ops.length - 1)];
    cage.operation = op.operation;
    cage.target = computeTarget(values, op);
  } else {
    const op = Math.random() < 0.5 ? '+' : '*';
    cage.operation = op;
    cage.target = computeTarget(values, op);
  }
  }
}

function getPossibleOps2(a, b) {
  const ops = ['+', '-', '*'];
  const max = Math.max(a, b);
  const min = Math.min(a, b);
  if (min !== 0 && max % min === 0) {
  ops.push('/');
  }
  return ops;
}

function computeTarget(values, operation) {
  switch (operation) {
  case '+':
  return values.reduce((sum, v) => sum + v, 0);
  case '-': {
  const max = Math.max(...values);
  const min = Math.min(...values);
  return max - min;
  }
  case '*':
  return values.reduce((product, v) => product * v, 1);
  case '/': {
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  return maxVal / minVal;
  }
  default:
  return 0;
  }
}