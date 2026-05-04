// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { moveSelection, isEmptyCell } from './gridManager.js';
import { validatePuzzle, checkAllCellsFilled } from './equationParser.js';
import { applyIncorrectSubmissionPenalty } from './scoring.js';
import { useHint } from './hints.js';
import { startLevel, completeLevel, failLevel } from './levelManager.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startLevel(gameState.currentLevel);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN && gameState.currentLevel < gameState.totalLevels) {
      startLevel(gameState.currentLevel);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN && gameState.currentLevel > gameState.totalLevels) {
      // All levels complete, return to start
      gameState.gamePhase = GAME_PHASES.START;
      gameState.currentLevel = 1;
      gameState.score = 0;
    }
  } else if (keyCode === 82) { // R - Restart
    gameState.gamePhase = GAME_PHASES.START;
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.incorrectSubmissions = 0;
    gameState.hintsUsed = 0;
    gameState.selectedCell = { row: -1, col: -1 };
  } else if (keyCode === 27) { // ESC - Pause/Unpause
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        event: "game_paused",
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        event: "game_resumed",
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  // Playing state controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Navigation
    if (keyCode === 37) { // LEFT
      moveSelection(0, -1);
    } else if (keyCode === 39) { // RIGHT
      moveSelection(0, 1);
    } else if (keyCode === 38) { // UP
      moveSelection(-1, 0);
    } else if (keyCode === 40) { // DOWN
      moveSelection(1, 0);
    }
    
    // Number input
    if (keyCode >= 48 && keyCode <= 57) { // 0-9
      const num = keyCode - 48;
      if (gameState.selectedCell.row !== -1) {
        const cell = gameState.currentGridData[gameState.selectedCell.row][gameState.selectedCell.col];
        if (cell.type === 'empty') {
          cell.playerInput = String(num);
        }
      }
    }
    
    // Clear cell
    if (keyCode === 8) { // BACKSPACE
      if (gameState.selectedCell.row !== -1) {
        const cell = gameState.currentGridData[gameState.selectedCell.row][gameState.selectedCell.col];
        if (cell.type === 'empty') {
          cell.playerInput = '';
        }
      }
    }
    
    // Submit
    if (keyCode === 32) { // SPACE
      submitPuzzle(p);
    }
    
    // Hint
    if (keyCode === 16) { // SHIFT
      useHint(p);
    }
  }
}

function submitPuzzle(p) {
  if (!checkAllCellsFilled()) {
    return; // Can't submit incomplete puzzle
  }

  const result = validatePuzzle();
  gameState.lastValidationResult = result;

  if (result.valid) {
    completeLevel(p);
  } else {
    gameState.incorrectSubmissions++;
    applyIncorrectSubmissionPenalty();
    
    p.logs.game_info.push({
      event: "incorrect_submission",
      data: { attempts: gameState.incorrectSubmissions },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    if (gameState.incorrectSubmissions >= gameState.maxIncorrectSubmissions) {
      failLevel(p);
    }
  }
}

export function handleTestingInput(p) {
  if (gameState.controlMode === "TEST_1") {
    // Basic testing: Navigate and input some numbers
    if (p.frameCount % 30 === 0) {
      const actions = ['RIGHT', 'DOWN', 'INPUT', 'SUBMIT'];
      const action = actions[Math.floor(p.frameCount / 30) % actions.length];
      
      if (action === 'RIGHT') {
        moveSelection(0, 1);
      } else if (action === 'DOWN') {
        moveSelection(1, 0);
      } else if (action === 'INPUT' && gameState.selectedCell.row !== -1) {
        const cell = gameState.currentGridData[gameState.selectedCell.row][gameState.selectedCell.col];
        if (cell.type === 'empty') {
          cell.playerInput = String(Math.floor(p.random() * 9) + 1);
        }
      } else if (action === 'SUBMIT') {
        if (checkAllCellsFilled()) {
          submitPuzzle(p);
        }
      }
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Win testing: Fill with correct solution
    if (p.frameCount === 60) {
      const puzzle = require('./puzzles.js').puzzles[gameState.currentLevel];
      if (puzzle && puzzle.solution && puzzle.solution[0]) {
        for (let solCell of puzzle.solution[0]) {
          gameState.currentGridData[solCell.row][solCell.col].playerInput = String(solCell.value);
        }
      }
    }
    if (p.frameCount === 90) {
      submitPuzzle(p);
    }
  }
}