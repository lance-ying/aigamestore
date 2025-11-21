// ai.js - AI opponent logic

import { gameState, CELL_EMPTY, CELL_X, CELL_O } from './globals.js';
import { getEmptyCells, placeMark, checkWinner } from './board.js';

export function makeAIMove(p) {
  const difficulty = getCurrentAIDifficulty();
  
  let move = null;
  
  switch (difficulty) {
    case 'random':
      move = makeRandomMove(p);
      break;
    case 'easy':
      move = makeEasyMove(p);
      break;
    case 'medium':
      move = makeMediumMove(p);
      break;
    case 'hard':
      move = makeHardMove(p);
      break;
    case 'impossible':
      move = makeImpossibleMove(p);
      break;
    default:
      move = makeRandomMove(p);
  }
  
  if (move) {
    placeMark(move.row, move.col, CELL_O);
  }
}

function getCurrentAIDifficulty() {
  const configs = [
    { level: 1, difficulty: 'random' },
    { level: 2, difficulty: 'easy' },
    { level: 3, difficulty: 'medium' },
    { level: 4, difficulty: 'hard' },
    { level: 5, difficulty: 'impossible' }
  ];
  
  const config = configs.find(c => c.level === gameState.currentLevel);
  return config ? config.difficulty : 'random';
}

function makeRandomMove(p) {
  const empty = getEmptyCells();
  if (empty.length === 0) return null;
  return empty[Math.floor(p.random() * empty.length)];
}

function makeEasyMove(p) {
  // Try to win
  const winMove = findWinningMove(CELL_O);
  if (winMove) return winMove;
  
  // Block player win
  const blockMove = findWinningMove(CELL_X);
  if (blockMove) return blockMove;
  
  // Random
  return makeRandomMove(p);
}

function makeMediumMove(p) {
  // Try to win
  const winMove = findWinningMove(CELL_O);
  if (winMove) return winMove;
  
  // Block player win
  const blockMove = findWinningMove(CELL_X);
  if (blockMove) return blockMove;
  
  // Try to create 2-in-a-row
  const setupMove = findSetupMove(CELL_O);
  if (setupMove) return setupMove;
  
  // Block player 2-in-a-row
  const blockSetupMove = findSetupMove(CELL_X);
  if (blockSetupMove) return blockSetupMove;
  
  // Random
  return makeRandomMove(p);
}

function makeHardMove(p) {
  // Use minimax with limited depth
  return minimaxMove(2);
}

function makeImpossibleMove(p) {
  // Use full minimax for 3x3 grid
  return minimaxMove(9);
}

function findWinningMove(player) {
  const empty = getEmptyCells();
  
  for (const cell of empty) {
    // Temporarily place mark
    gameState.gameBoard[cell.row][cell.col] = player;
    const result = checkWinner();
    gameState.gameBoard[cell.row][cell.col] = CELL_EMPTY;
    
    if (result && result.winner === player) {
      return cell;
    }
  }
  
  return null;
}

function findSetupMove(player) {
  const empty = getEmptyCells();
  
  for (const cell of empty) {
    gameState.gameBoard[cell.row][cell.col] = player;
    const count = countTwoInARow(player);
    gameState.gameBoard[cell.row][cell.col] = CELL_EMPTY;
    
    if (count > 0) {
      return cell;
    }
  }
  
  return null;
}

function countTwoInARow(player) {
  let count = 0;
  const size = gameState.currentGridSize;
  const board = gameState.gameBoard;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] !== player) continue;
      
      // Check patterns with exactly 2 of player's marks and 1 empty
      const patterns = [
        // Horizontal
        col <= size - 3 ? [board[row][col + 1], board[row][col + 2]] : null,
        // Vertical
        row <= size - 3 ? [board[row + 1][col], board[row + 2][col]] : null,
        // Diagonal down-right
        row <= size - 3 && col <= size - 3 ? [board[row + 1][col + 1], board[row + 2][col + 2]] : null,
        // Diagonal down-left
        row <= size - 3 && col >= 2 ? [board[row + 1][col - 1], board[row + 2][col - 2]] : null
      ];
      
      for (const pattern of patterns) {
        if (!pattern) continue;
        const playerCount = pattern.filter(c => c === player).length;
        const emptyCount = pattern.filter(c => c === CELL_EMPTY).length;
        if (playerCount === 1 && emptyCount === 1) {
          count++;
        }
      }
    }
  }
  
  return count;
}

function minimaxMove(depth) {
  let bestScore = -Infinity;
  let bestMove = null;
  const empty = getEmptyCells();
  
  for (const cell of empty) {
    gameState.gameBoard[cell.row][cell.col] = CELL_O;
    const score = minimax(depth - 1, false, -Infinity, Infinity);
    gameState.gameBoard[cell.row][cell.col] = CELL_EMPTY;
    
    if (score > bestScore) {
      bestScore = score;
      bestMove = cell;
    }
  }
  
  return bestMove || makeRandomMove({ random: Math.random });
}

function minimax(depth, isMaximizing, alpha, beta) {
  const result = checkWinner();
  
  if (result) {
    return result.winner === CELL_O ? 10 : -10;
  }
  
  if (getEmptyCells().length === 0) {
    return 0;
  }
  
  if (depth === 0) {
    return evaluateBoard();
  }
  
  const empty = getEmptyCells();
  
  if (isMaximizing) {
    let maxScore = -Infinity;
    for (const cell of empty) {
      gameState.gameBoard[cell.row][cell.col] = CELL_O;
      const score = minimax(depth - 1, false, alpha, beta);
      gameState.gameBoard[cell.row][cell.col] = CELL_EMPTY;
      maxScore = Math.max(maxScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxScore;
  } else {
    let minScore = Infinity;
    for (const cell of empty) {
      gameState.gameBoard[cell.row][cell.col] = CELL_X;
      const score = minimax(depth - 1, true, alpha, beta);
      gameState.gameBoard[cell.row][cell.col] = CELL_EMPTY;
      minScore = Math.min(minScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minScore;
  }
}

function evaluateBoard() {
  const aiSetups = countTwoInARow(CELL_O);
  const playerSetups = countTwoInARow(CELL_X);
  return aiSetups - playerSetups;
}