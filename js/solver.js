export function countSolutions(cages, size, maxCount = 4) {
  const cageMap = new Map();
  for (const cage of cages) {
    for (const cell of cage.cells) {
      cageMap.set(`${cell.row},${cell.col}`, cage);
    }
  }

  const board = Array.from({ length: size }, () => Array(size).fill(0));
  const result = { count: 0 };

  solve(board, size, 0, 0, cageMap, maxCount, result);
  return result.count;
}

function solve(board, size, row, col, cageMap, maxCount, result) {
  if (result.count >= maxCount) return;

  if (col === size) {
    row++;
    col = 0;
  }

  if (row === size) {
    result.count++;
    return;
  }

  const cage = cageMap.get(`${row},${col}`);
  if (!cage) return;

  for (let num = 1; num <= size; num++) {
    if (!isValid(board, size, row, col, num, cageMap)) {
      continue;
    }
    board[row][col] = num;
    solve(board, size, row, col + 1, cageMap, maxCount, result);
    board[row][col] = 0;

    if (result.count >= maxCount) return;
  }
}

function isValid(board, size, row, col, num, cageMap) {
  // Check if the number is already in the same row
  for (let c = 0; c < size; c++) {
    if (board[row][c] === num) {
      return false;
    }
  }

  // Check if the number is already in the same column
  for (let r = 0; r < size; r++) {
    if (board[r][col] === num) {
      return false;
    }
  }

  // Check if the number is already in the same cage
  const cage = cageMap.get(`${row},${col}`);
  if (!cage) return true;

  const values = [];
  let allFilled = true;
  for (const cell of cage.cells) {
    const val =
      cell.row === row && cell.col === col ? num : board[cell.row][cell.col];
    if (val === 0) {
      allFilled = false;
    } else {
      values.push(val);
    }
  }

  if (cage.operation === null) {
    return num === cage.target;
  }

  if (allFilled) {
    return checkCageComplete(values, cage.operation, cage.target);
  }

  return checkCagePartial(
    values,
    cage.cells.length,
    cage.operation,
    cage.target,
    size,
  );
}

function checkCageComplete(values, operation, target) {
  switch (operation) {
    case "+":
      return values.reduce((a, b) => a + b, 0) === target;
    case "-": {
      const max = Math.max(...values);
      const min = Math.min(...values);
      return max - min === target;
    }
    case "*":
      return values.reduce((a, b) => a * b, 1) === target;
    case "/": {
      const maxVal = Math.max(...values);
      const minVal = Math.min(...values);
      return minVal !== 0 && maxVal / minVal === target;
    }
    default:
      return false;
  }
}

function checkCagePartial(values, totalCells, operation, target, size) {
  const remaining = totalCells - values.length;

  switch (operation) {
    case "+": {
      const currentSum = values.reduce((a, b) => a + b, 0);
      if (currentSum >= target) return false; // already at or over target
      if (currentSum + remaining * size < target) return false; // can't reach target even with max values
      if (currentSum + remaining * 1 > target) return false; // will overshoot even with min values
      return true;
    }
    case "-":
      return true;
    case "*": {
      const currentProduct = values.reduce((a, b) => a * b, 1);
      if (currentProduct > target) {
        return false;
      }
      if (target % currentProduct !== 0) {
        return false;
      }
      return true;
    }
    case "/":
      return true;
    default:
      return true;
  }
}