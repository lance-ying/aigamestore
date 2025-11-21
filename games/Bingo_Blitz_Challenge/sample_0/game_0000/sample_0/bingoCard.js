// bingoCard.js
import { gameState } from './globals.js';

export function generateBingoCard(p) {
  const card = [];
  const ranges = [
    [1, 15],   // B column
    [16, 30],  // I column
    [31, 45],  // N column
    [46, 60],  // G column
    [61, 75]   // O column
  ];
  
  for (let col = 0; col < 5; col++) {
    const column = [];
    const [min, max] = ranges[col];
    const available = [];
    
    for (let i = min; i <= max; i++) {
      available.push(i);
    }
    
    // Shuffle and pick 5 numbers
    for (let row = 0; row < 5; row++) {
      if (row === 2 && col === 2) {
        column.push('FREE');
      } else {
        const idx = Math.floor(p.random(available.length));
        column.push(available[idx]);
        available.splice(idx, 1);
      }
    }
    card.push(column);
  }
  
  return card;
}

export function getSquareKey(row, col) {
  return `${row},${col}`;
}

export function checkForBingo(p) {
  const newBingos = [];
  
  // Check rows
  for (let row = 0; row < 5; row++) {
    if (checkLine(row, 0, 0, 1)) {
      newBingos.push({ type: 'row', index: row });
    }
  }
  
  // Check columns
  for (let col = 0; col < 5; col++) {
    if (checkLine(0, col, 1, 0)) {
      newBingos.push({ type: 'col', index: col });
    }
  }
  
  // Check diagonals
  if (checkLine(0, 0, 1, 1)) {
    newBingos.push({ type: 'diag1' });
  }
  if (checkLine(0, 4, 1, -1)) {
    newBingos.push({ type: 'diag2' });
  }
  
  // Check 4 corners
  if (gameState.markedSquares.has(getSquareKey(0, 0)) &&
      gameState.markedSquares.has(getSquareKey(0, 4)) &&
      gameState.markedSquares.has(getSquareKey(4, 0)) &&
      gameState.markedSquares.has(getSquareKey(4, 4))) {
    newBingos.push({ type: 'corners' });
  }
  
  return newBingos;
}

function checkLine(startRow, startCol, rowDelta, colDelta) {
  for (let i = 0; i < 5; i++) {
    const row = startRow + i * rowDelta;
    const col = startCol + i * colDelta;
    if (!gameState.markedSquares.has(getSquareKey(row, col))) {
      return false;
    }
  }
  return true;
}

export function findNumberOnCard(number) {
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (gameState.bingoCard[col][row] === number) {
        return { row, col };
      }
    }
  }
  return null;
}