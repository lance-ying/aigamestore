// hints.js - Hint system

import { gameState } from './globals.js';
import { puzzles } from './puzzles.js';
import { applyHintPenalty } from './scoring.js';

export function useHint(p) {
  const puzzle = puzzles[gameState.currentLevel];
  if (!puzzle || !puzzle.solution || puzzle.solution.length === 0) return false;

  // Find all empty cells that don't have input yet
  const emptyCells = [];
  for (let row = 0; row < gameState.gridSize; row++) {
    for (let col = 0; col < gameState.gridSize; col++) {
      const cell = gameState.currentGridData[row][col];
      if (cell.type === 'empty' && cell.playerInput === '') {
        emptyCells.push({ row, col });
      }
    }
  }

  if (emptyCells.length === 0) return false;

  // Pick random empty cell
  const randomCell = emptyCells[Math.floor(p.random() * emptyCells.length)];

  // Find solution value for this cell
  const solutionCells = puzzle.solution[0];
  for (let solCell of solutionCells) {
    if (solCell.row === randomCell.row && solCell.col === randomCell.col) {
      gameState.currentGridData[randomCell.row][randomCell.col].playerInput = String(solCell.value);
      gameState.hintsUsed++;
      applyHintPenalty();
      
      // Log hint usage
      p.logs.game_info.push({
        event: "hint_used",
        data: { row: randomCell.row, col: randomCell.col, value: solCell.value },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      return true;
    }
  }

  return false;
}