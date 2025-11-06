// ai.js - AI opponent logic

import { gameState, CELL_STATE, TURN } from './globals.js';
import { placeMarkOnBoard, checkWinner, isBoardFull, getEmptyCells } from './board.js';

export function makeAIMove(difficulty) {
  const emptyCells = getEmptyCells();
  
  if (emptyCells.length === 0) {
    return null;
  }
  
  let move = null;
  
  if (difficulty === "EASY") {
    move = makeEasyMove(emptyCells);
  } else if (difficulty === "MEDIUM") {
    move = makeMediumMove(emptyCells);
  } else if (difficulty === "HARD") {
    move = makeHardMove(emptyCells);
  }
  
  return move;
}

function makeEasyMove(emptyCells) {
  // Check for immediate win
  const winMove = findWinningMove(CELL_STATE.AI);
  if (winMove) return winMove;
  
  // Check for immediate block
  const blockMove = findWinningMove(CELL_STATE.PLAYER);
  if (blockMove) return blockMove;
  
  // Random move
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
}

function makeMediumMove(emptyCells) {
  // Check for immediate win
  const winMove = findWinningMove(CELL_STATE.AI);
  if (winMove) return winMove;
  
  // Check for immediate block
  const blockMove = findWinningMove(CELL_STATE.PLAYER);
  if (blockMove) return blockMove;
  
  // Try to create a fork (two ways to win)
  const forkMove = findForkMove(CELL_STATE.AI);
  if (forkMove) return forkMove;
  
  // Block opponent's fork
  const blockForkMove = findForkMove(CELL_STATE.PLAYER);
  if (blockForkMove) return blockForkMove;
  
  // Take center if available
  const center = Math.floor(gameState.boardSize / 2);
  if (gameState.board[center][center] === CELL_STATE.EMPTY) {
    return [center, center];
  }
  
  // Take a corner
  const corners = [
    [0, 0],
    [0, gameState.boardSize - 1],
    [gameState.boardSize - 1, 0],
    [gameState.boardSize - 1, gameState.boardSize - 1]
  ];
  const emptyCorners = corners.filter(([r, c]) => gameState.board[r][c] === CELL_STATE.EMPTY);
  if (emptyCorners.length > 0) {
    const randomIndex = Math.floor(Math.random() * emptyCorners.length);
    return emptyCorners[randomIndex];
  }
  
  // Random move
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
}

function makeHardMove(emptyCells) {
  // Use minimax algorithm
  const bestMove = minimax(gameState.board, CELL_STATE.AI, 0, -Infinity, Infinity);
  return bestMove.move;
}

function findWinningMove(mark) {
  const emptyCells = getEmptyCells();
  
  for (const [row, col] of emptyCells) {
    // Try placing mark
    gameState.board[row][col] = mark;
    const result = checkWinner();
    gameState.board[row][col] = CELL_STATE.EMPTY;
    
    if (result && result.winner === mark) {
      return [row, col];
    }
  }
  
  return null;
}

function findForkMove(mark) {
  const emptyCells = getEmptyCells();
  
  for (const [row, col] of emptyCells) {
    gameState.board[row][col] = mark;
    
    // Count how many winning moves this creates
    let winningMoves = 0;
    const testEmptyCells = getEmptyCells();
    
    for (const [testRow, testCol] of testEmptyCells) {
      gameState.board[testRow][testCol] = mark;
      const result = checkWinner();
      gameState.board[testRow][testCol] = CELL_STATE.EMPTY;
      
      if (result && result.winner === mark) {
        winningMoves++;
      }
    }
    
    gameState.board[row][col] = CELL_STATE.EMPTY;
    
    if (winningMoves >= 2) {
      return [row, col];
    }
  }
  
  return null;
}

function minimax(board, player, depth, alpha, beta) {
  const result = checkWinner();
  
  if (result) {
    if (result.winner === CELL_STATE.AI) {
      return { score: 10 - depth };
    } else if (result.winner === CELL_STATE.PLAYER) {
      return { score: depth - 10 };
    }
  }
  
  if (isBoardFull()) {
    return { score: 0 };
  }
  
  // Limit depth for performance on larger boards
  if (depth >= 6) {
    return { score: 0 };
  }
  
  const emptyCells = getEmptyCells();
  let bestMove = null;
  
  if (player === CELL_STATE.AI) {
    let maxScore = -Infinity;
    
    for (const [row, col] of emptyCells) {
      gameState.board[row][col] = CELL_STATE.AI;
      const result = minimax(board, CELL_STATE.PLAYER, depth + 1, alpha, beta);
      gameState.board[row][col] = CELL_STATE.EMPTY;
      
      if (result.score > maxScore) {
        maxScore = result.score;
        bestMove = [row, col];
      }
      
      alpha = Math.max(alpha, maxScore);
      if (beta <= alpha) {
        break; // Alpha-beta pruning
      }
    }
    
    return { score: maxScore, move: bestMove };
  } else {
    let minScore = Infinity;
    
    for (const [row, col] of emptyCells) {
      gameState.board[row][col] = CELL_STATE.PLAYER;
      const result = minimax(board, CELL_STATE.AI, depth + 1, alpha, beta);
      gameState.board[row][col] = CELL_STATE.EMPTY;
      
      if (result.score < minScore) {
        minScore = result.score;
        bestMove = [row, col];
      }
      
      beta = Math.min(beta, minScore);
      if (beta <= alpha) {
        break; // Alpha-beta pruning
      }
    }
    
    return { score: minScore, move: bestMove };
  }
}