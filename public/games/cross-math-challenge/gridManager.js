// gridManager.js - Grid initialization and management

import { gameState } from './globals.js';
import { puzzles } from './puzzles.js';

export function initializeGrid(level) {
  const puzzle = puzzles[level];
  if (!puzzle) return false;

  gameState.gridSize = puzzle.size;
  gameState.currentGridData = [];

  // Deep copy puzzle grid and add playerInput field
  for (let row = 0; row < puzzle.size; row++) {
    gameState.currentGridData[row] = [];
    for (let col = 0; col < puzzle.size; col++) {
      const cell = { ...puzzle.grid[row][col] };
      cell.playerInput = '';
      gameState.currentGridData[row][col] = cell;
    }
  }

  // Calculate grid positioning
  const totalGridSize = gameState.gridSize * gameState.cellSize;
  gameState.gridOffsetX = (600 - totalGridSize) / 2;
  gameState.gridOffsetY = (400 - totalGridSize) / 2 + 20;

  // Select first empty cell
  selectFirstEmptyCell();

  return true;
}

export function selectFirstEmptyCell() {
  for (let row = 0; row < gameState.gridSize; row++) {
    for (let col = 0; col < gameState.gridSize; col++) {
      const cell = gameState.currentGridData[row][col];
      if (cell.type === 'empty') {
        gameState.selectedCell = { row, col };
        return;
      }
    }
  }
  gameState.selectedCell = { row: -1, col: -1 };
}

export function isEmptyCell(row, col) {
  if (row < 0 || row >= gameState.gridSize || col < 0 || col >= gameState.gridSize) {
    return false;
  }
  return gameState.currentGridData[row][col].type === 'empty';
}

export function moveSelection(dr, dc) {
  if (gameState.selectedCell.row === -1) {
    selectFirstEmptyCell();
    return;
  }

  let newRow = gameState.selectedCell.row + dr;
  let newCol = gameState.selectedCell.col + dc;

  // Find next empty cell in direction
  for (let i = 0; i < gameState.gridSize * 2; i++) {
    if (newRow >= 0 && newRow < gameState.gridSize && 
        newCol >= 0 && newCol < gameState.gridSize) {
      if (isEmptyCell(newRow, newCol)) {
        gameState.selectedCell = { row: newRow, col: newCol };
        return;
      }
    }
    newRow += dr;
    newCol += dc;
  }
}

export function getCellAtPosition(x, y) {
  const col = Math.floor((x - gameState.gridOffsetX) / gameState.cellSize);
  const row = Math.floor((y - gameState.gridOffsetY) / gameState.cellSize);
  
  if (row >= 0 && row < gameState.gridSize && col >= 0 && col < gameState.gridSize) {
    return { row, col };
  }
  return null;
}