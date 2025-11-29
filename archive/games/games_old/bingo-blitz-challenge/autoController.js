// autoController.js
import { gameState, GAME_PHASES, CONTROL_MODES } from './globals.js';
import { findNumberOnCard, getSquareKey } from './bingoCard.js';
import { handleCorrectMark } from './scoring.js';
import { activateInstantMark, activateScoreMultiplier, activateFreeMark, useFreeMarkOnSelected } from './boosters.js';

let lastActionTime = 0;
let actionDelay = 100;

export function updateAutoController(p) {
  if (gameState.controlMode === CONTROL_MODES.HUMAN) return;
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const now = Date.now();
  if (now - lastActionTime < actionDelay) return;
  
  lastActionTime = now;
  
  if (gameState.controlMode === CONTROL_MODES.TEST_1) {
    autoPlayBasic(p);
  } else if (gameState.controlMode === CONTROL_MODES.TEST_2) {
    autoPlayWin(p);
  }
}

function autoPlayBasic(p) {
  if (!gameState.currentCalledNumber) return;
  
  const pos = findNumberOnCard(gameState.currentCalledNumber);
  if (pos && !gameState.markedSquares.has(getSquareKey(pos.row, pos.col))) {
    gameState.selectedRow = pos.row;
    gameState.selectedCol = pos.col;
    
    // Simulate space press
    const key = getSquareKey(pos.row, pos.col);
    const number = gameState.bingoCard[pos.col][pos.row];
    
    if (!gameState.markedSquares.has(key) && gameState.calledNumbers.includes(number)) {
      gameState.markedSquares.add(key);
      handleCorrectMark(true, p);
    }
  }
}

function autoPlayWin(p) {
  // More aggressive: use boosters and mark quickly
  if (gameState.boosters.instantMark.available) {
    activateInstantMark(p);
    return;
  }
  
  if (gameState.boosters.scoreMultiplier.available) {
    activateScoreMultiplier(p);
  }
  
  if (gameState.boosters.freeMark.available && p.frameCount % 180 === 0) {
    // Find best square to mark for potential bingo
    const bestSquare = findBestFreeMarkSquare(p);
    if (bestSquare) {
      gameState.selectedRow = bestSquare.row;
      gameState.selectedCol = bestSquare.col;
      activateFreeMark(p);
      useFreeMarkOnSelected(p);
      return;
    }
  }
  
  autoPlayBasic(p);
}

function findBestFreeMarkSquare(p) {
  // Find unmarked square that contributes to most potential bingos
  let bestSquare = null;
  let maxPotential = 0;
  
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const key = getSquareKey(row, col);
      if (!gameState.markedSquares.has(key)) {
        const potential = calculateBingoPotential(row, col);
        if (potential > maxPotential) {
          maxPotential = potential;
          bestSquare = { row, col };
        }
      }
    }
  }
  
  return bestSquare;
}

function calculateBingoPotential(row, col) {
  let potential = 0;
  
  // Check row
  let rowMarked = 0;
  for (let c = 0; c < 5; c++) {
    if (gameState.markedSquares.has(getSquareKey(row, c))) rowMarked++;
  }
  potential += rowMarked;
  
  // Check column
  let colMarked = 0;
  for (let r = 0; r < 5; r++) {
    if (gameState.markedSquares.has(getSquareKey(r, col))) colMarked++;
  }
  potential += colMarked;
  
  // Check diagonals
  if (row === col) {
    let diag1Marked = 0;
    for (let i = 0; i < 5; i++) {
      if (gameState.markedSquares.has(getSquareKey(i, i))) diag1Marked++;
    }
    potential += diag1Marked;
  }
  
  if (row + col === 4) {
    let diag2Marked = 0;
    for (let i = 0; i < 5; i++) {
      if (gameState.markedSquares.has(getSquareKey(i, 4 - i))) diag2Marked++;
    }
    potential += diag2Marked;
  }
  
  return potential;
}