// tetromino.js - Tetromino piece logic

import { gameState, SHAPES, SHAPE_NAMES, SHAPE_COLORS, GRID_COLS, GRID_ROWS } from './globals.js';

export function spawnNewPiece() {
  // Use next piece or generate random
  if (gameState.nextShape) {
    gameState.currentShape = gameState.nextShape;
    gameState.currentColor = gameState.nextColor;
  } else {
    const shapeIndex = Math.floor(Math.random() * SHAPE_NAMES.length);
    gameState.currentShape = SHAPE_NAMES[shapeIndex];
    gameState.currentColor = SHAPE_COLORS[gameState.currentShape];
  }
  
  // Generate next piece
  const nextShapeIndex = Math.floor(Math.random() * SHAPE_NAMES.length);
  gameState.nextShape = SHAPE_NAMES[nextShapeIndex];
  gameState.nextColor = SHAPE_COLORS[gameState.nextShape];
  
  gameState.currentPiece = SHAPES[gameState.currentShape];
  gameState.currentRotation = 0;
  gameState.pieceX = Math.floor(GRID_COLS / 2);
  gameState.pieceY = 1;
  gameState.isPieceLocked = false;
  gameState.lockDelayTimer = 0;
  gameState.lastFallTime = Date.now();
  
  // Check if spawn position is valid (game over check)
  if (!isValidPosition(gameState.pieceX, gameState.pieceY, gameState.currentPiece)) {
    return false; // Game over
  }
  
  return true;
}

export function rotatePiece() {
  if (!gameState.currentPiece) return;
  
  const rotated = gameState.currentPiece.map(([x, y]) => [-y, x]);
  
  // Try standard rotation
  if (isValidPosition(gameState.pieceX, gameState.pieceY, rotated)) {
    gameState.currentPiece = rotated;
    gameState.currentRotation = (gameState.currentRotation + 1) % 4;
    return;
  }
  
  // Wall kick attempts
  const kicks = [[1, 0], [-1, 0], [0, -1], [2, 0], [-2, 0]];
  for (let [dx, dy] of kicks) {
    if (isValidPosition(gameState.pieceX + dx, gameState.pieceY + dy, rotated)) {
      gameState.pieceX += dx;
      gameState.pieceY += dy;
      gameState.currentPiece = rotated;
      gameState.currentRotation = (gameState.currentRotation + 1) % 4;
      return;
    }
  }
}

export function movePiece(dx, dy) {
  if (!gameState.currentPiece) return false;
  
  const newX = gameState.pieceX + dx;
  const newY = gameState.pieceY + dy;
  
  if (isValidPosition(newX, newY, gameState.currentPiece)) {
    gameState.pieceX = newX;
    gameState.pieceY = newY;
    
    // Reset lock delay if moved down successfully
    if (dy > 0) {
      gameState.lockDelayTimer = 0;
    }
    
    return true;
  }
  
  // If moving down failed, start lock delay
  if (dy > 0 && !gameState.isPieceLocked) {
    if (gameState.lockDelayTimer === 0) {
      gameState.lockDelayTimer = Date.now();
    }
  }
  
  return false;
}

export function hardDrop() {
  if (!gameState.currentPiece) return;
  
  let dropDistance = 0;
  while (movePiece(0, 1)) {
    dropDistance++;
  }
  
  // Award points for drop distance
  gameState.score += dropDistance * 2;
  
  // Lock immediately
  lockPiece();
}

export function lockPiece() {
  if (!gameState.currentPiece) return;
  
  // Add piece to grid
  for (let [dx, dy] of gameState.currentPiece) {
    const gridX = gameState.pieceX + dx;
    const gridY = gameState.pieceY + dy;
    
    if (gridY >= 0 && gridY < GRID_ROWS && gridX >= 0 && gridX < GRID_COLS) {
      gameState.grid[gridY][gridX] = gameState.currentColor;
    }
  }
  
  gameState.isPieceLocked = true;
  gameState.currentPiece = null;
  
  // Check for line clears
  checkLineClear();
}

export function isValidPosition(x, y, piece) {
  for (let [dx, dy] of piece) {
    const gridX = x + dx;
    const gridY = y + dy;
    
    // Check boundaries
    if (gridX < 0 || gridX >= GRID_COLS || gridY >= GRID_ROWS) {
      return false;
    }
    
    // Allow pieces above grid during spawn
    if (gridY < 0) continue;
    
    // Check collision with placed blocks
    if (gameState.grid[gridY][gridX] !== 0) {
      return false;
    }
  }
  
  return true;
}

export function getGhostPosition() {
  if (!gameState.currentPiece) return null;
  
  let ghostY = gameState.pieceY;
  while (isValidPosition(gameState.pieceX, ghostY + 1, gameState.currentPiece)) {
    ghostY++;
  }
  
  return { x: gameState.pieceX, y: ghostY };
}

function checkLineClear() {
  const linesToClear = [];
  
  // Find complete lines
  for (let row = 0; row < GRID_ROWS; row++) {
    let isComplete = true;
    for (let col = 0; col < GRID_COLS; col++) {
      if (gameState.grid[row][col] === 0) {
        isComplete = false;
        break;
      }
    }
    if (isComplete) {
      linesToClear.push(row);
    }
  }
  
  if (linesToClear.length > 0) {
    gameState.clearingLines = linesToClear;
    gameState.clearAnimationTimer = Date.now();
  } else {
    // Spawn next piece immediately if no lines to clear
    if (!spawnNewPiece()) {
      gameState.gamePhase = "GAME_OVER_LOSE";
    }
  }
}

export function clearLines() {
  const numLines = gameState.clearingLines.length;
  
  // Remove cleared lines
  for (let row of gameState.clearingLines) {
    gameState.grid.splice(row, 1);
  }
  
  // Add empty lines at top
  for (let i = 0; i < numLines; i++) {
    const newRow = [];
    for (let col = 0; col < GRID_COLS; col++) {
      newRow.push(0);
    }
    gameState.grid.unshift(newRow);
  }
  
  // Update score and stats
  gameState.linesCleared += numLines;
  
  // Score multiplier for multiple lines
  const scores = [0, 100, 300, 500, 800];
  gameState.score += scores[numLines] * gameState.level;
  
  // Level up every 10 lines
  gameState.level = Math.floor(gameState.linesCleared / 10) + 1;
  
  // Increase fall speed
  gameState.fallSpeed = Math.max(100, 800 - (gameState.level - 1) * 50);
  
  gameState.clearingLines = [];
  
  // Spawn next piece
  if (!spawnNewPiece()) {
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
}