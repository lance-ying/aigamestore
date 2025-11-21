// puzzles.js
import { gameState } from './globals.js';

export const PUZZLES = {
  codePanel: {
    type: "code",
    solution: "1573",
    currentInput: "",
    reward: "key",
    description: "Enter a 4-digit code"
  }
};

export function initializePuzzle(puzzleId) {
  if (!gameState.puzzleStates[puzzleId]) {
    gameState.puzzleStates[puzzleId] = {
      solved: false,
      attempts: 0,
      currentInput: ""
    };
  }
}

export function handlePuzzleInput(puzzleId, input) {
  const puzzle = PUZZLES[puzzleId];
  const state = gameState.puzzleStates[puzzleId];
  
  if (!puzzle || !state || state.solved) return false;
  
  if (puzzle.type === "code") {
    state.currentInput += input;
    if (state.currentInput.length >= puzzle.solution.length) {
      if (state.currentInput === puzzle.solution) {
        state.solved = true;
        gameState.progressFlags.codeEntered = true;
        if (puzzle.reward) {
          gameState.inventory.push(puzzle.reward);
          gameState.score += 100;
        }
        return true;
      } else {
        state.currentInput = "";
        state.attempts++;
        return false;
      }
    }
  }
  
  return null; // Still inputting
}

export function solvePuzzle(puzzleId) {
  const puzzle = PUZZLES[puzzleId];
  const state = gameState.puzzleStates[puzzleId];
  
  if (puzzle && state && !state.solved) {
    state.solved = true;
    if (puzzle.reward) {
      gameState.inventory.push(puzzle.reward);
      gameState.score += 100;
    }
    return true;
  }
  return false;
}