// input.js - Input handling (TAP-BASED for VLM compatibility)
import { gameState, GAME_PHASES } from './globals.js';
import { getDotAtPosition, areDotsAdjacent, colorsMatch, isSquareFormed, clearDots, applyGravity, fillEmptySpaces, checkAnchorObjective } from './grid.js';
import { getColorName, getLevelConfig, LEVEL_CONFIGS } from './levels.js';
import { SCORE_VALUES } from './globals.js';
// Import the centralized game functions from game.js
import { resetLevel, advanceLevel, returnToStart } from './game.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // TAP-BASED INPUT: Ignore if key is already pressed (prevent key repeat)
  const keyId = `${keyCode}`;
  if (gameState.keysPressed.has(keyId)) {
    return; // Key is being held, ignore repeat events
  }
  
  // Mark key as pressed
  gameState.keysPressed.add(keyId);
  
  // Check input cooldown for movement/action keys
  const now = Date.now();
  const isMovementOrAction = (keyCode >= 37 && keyCode <= 40) || keyCode === 32 || keyCode === 16;
  if (isMovementOrAction && (now - gameState.lastInputTime) < gameState.inputCooldown) {
    return; // Too soon after last input
  }

  // gameState.controlMode will always be "HUMAN" now, so no need for this check.

  if (gameState.gamePhase === GAME_PHASES.START) {
    if (keyCode === 13) { // ENTER
      startGame(p);
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (keyCode === 27) { // ESC
      pauseGame(p);
    } else if (keyCode === 32) { // SPACE
      handleSpacePress(p);
      gameState.lastInputTime = now;
    } else if (keyCode === 16) { // SHIFT
      handleShiftPress(p);
      gameState.lastInputTime = now;
    } else if (keyCode >= 37 && keyCode <= 40) { // ARROW KEYS
      handleArrowPress(p, keyCode);
      gameState.lastInputTime = now;
    }
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    if (keyCode === 27) { // ESC
      unpauseGame(p);
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (keyCode === 82) { // R
      handleGameEndInput(p);
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // TAP-BASED INPUT: Clear key from pressed set
  const keyId = `${keyCode}`;
  gameState.keysPressed.delete(keyId);

  // gameState.controlMode will always be "HUMAN" now, so no need for this check.
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Refactored: loadLevel, advanceLevel, returnToStart are now in game.js and imported.
// The original loadLevel function logic is now part of resetLevel in game.js.

function handleGameEndInput(p) {
  // Manual restart takes precedence, cancel any pending auto-restart
  gameState.autoRestartTimer = null;

  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    if (gameState.currentLevel < LEVEL_CONFIGS.length) {
      // Advance to next level
      advanceLevel(p);
    } else {
      // Game Complete - Return to start
      returnToStart(p);
    }
  } else {
    // Lose - Retry level
    resetLevel(p, gameState.currentLevel, true); // true to restore levelStartTotalScore
  }
}

function handleSpacePress(p) {
  if (gameState.isAnimating) return;
  
  // TAP-BASED: Single tap performs discrete action
  // If no path started, start building at current cursor position
  if (gameState.currentPath.length === 0) {
    const currentDot = getDotAtPosition(gameState.cursorX, gameState.cursorY);
    if (currentDot && currentDot.type !== 'anchor') {
      gameState.currentPath = [currentDot];
      gameState.currentSelectedDot = currentDot;
    }
  } else if (gameState.currentPath.length >= 2) {
    // Path has at least 2 dots, execute it
    executeMove(p);
  } else if (gameState.currentPath.length === 1) {
    // Single dot selected, pressing space again cancels it
    cancelPath();
  }
}

function handleShiftPress(p) {
  if (gameState.currentPath.length > 0 && !gameState.isAnimating) {
    cancelPath();
  }
}

function handleArrowPress(p, keyCode) {
  if (gameState.isAnimating) return;
  
  // Store old position
  const oldX = gameState.cursorX;
  const oldY = gameState.cursorY;
  
  // TAP-BASED: Single tap moves cursor by ONE grid cell
  // (For grid-based puzzle games, 1 cell per tap is the correct substantial movement)
  if (keyCode === 37) gameState.cursorX = Math.max(0, gameState.cursorX - 1); // LEFT
  if (keyCode === 39) gameState.cursorX = Math.min(gameState.gridCols - 1, gameState.cursorX + 1); // RIGHT
  if (keyCode === 38) gameState.cursorY = Math.max(0, gameState.cursorY - 1); // UP
  if (keyCode === 40) gameState.cursorY = Math.min(gameState.gridRows - 1, gameState.cursorY + 1); // DOWN
  
  // Check if cursor actually moved
  if (oldX === gameState.cursorX && oldY === gameState.cursorY) {
    return;
  }
  
  // Only auto-build path if we have a path started (after first space press)
  if (gameState.currentPath.length === 0) {
    // No path started, just moving cursor
    return;
  }
  
  // Auto-build path based on cursor position
  const currentDot = getDotAtPosition(gameState.cursorX, gameState.cursorY);
  
  if (!currentDot) {
    // Moved to empty space, cancel path
    cancelPath();
    return;
  }
  
  const lastDot = gameState.currentPath[gameState.currentPath.length - 1];
  
  // Check if backtracking to previous dot in path
  if (gameState.currentPath.length > 1) {
    const prevDot = gameState.currentPath[gameState.currentPath.length - 2];
    if (currentDot === prevDot) {
      // Remove last dot from path (backtrack)
      gameState.currentPath.pop();
      if (gameState.currentPath.length === 0) {
        gameState.currentSelectedDot = null;
      }
      return;
    }
  }
  
  // Check if moving away from path entirely (not adjacent to last dot)
  if (!areDotsAdjacent(lastDot, currentDot)) {
    // Moving too far, cancel current path
    cancelPath();
    return;
  }
  
  // Check if can extend path (adjacent, same color, not already in path)
  if (areDotsAdjacent(lastDot, currentDot) && 
      colorsMatch(lastDot.color, currentDot.color) &&
      !gameState.currentPath.includes(currentDot)) {
    
    if (currentDot.type !== 'anchor') {
      gameState.currentPath.push(currentDot);
    }
  } else if (!colorsMatch(lastDot.color, currentDot.color)) {
    // Different color, cancel path
    cancelPath();
  }
}

function cancelPath() {
  gameState.currentSelectedDot = null;
  gameState.currentPath = [];
}

function executeMove(p) {
  const path = gameState.currentPath;
  const selectedDot = gameState.currentSelectedDot;
  
  // Check for square
  const isSquare = isSquareFormed(path, selectedDot);
  let dotsToRemove = [...path];
  let score = 0;
  
  if (isSquare) {
    // Clear all dots of this color
    const targetColor = selectedDot.color;
    dotsToRemove = [];
    for (let row = 0; row < gameState.gridRows; row++) {
      for (let col = 0; col < gameState.gridCols; col++) {
        const dot = gameState.grid[row][col];
        if (dot && colorsMatch(dot.color, targetColor)) {
          dotsToRemove.push(dot);
        }
      }
    }
    score = dotsToRemove.length * SCORE_VALUES.SQUARE_DOT;
  } else {
    score = dotsToRemove.length * SCORE_VALUES.REGULAR_DOT;
  }
  
  gameState.score += score;
  gameState.totalScore += score;
  
  // Clear dots
  clearDots(p, dotsToRemove);
  
  // Start animation
  gameState.isAnimating = true;
  setTimeout(() => {
    applyGravity(p);
    setTimeout(() => {
      fillEmptySpaces(p);
      checkAnchorObjective();
      gameState.isAnimating = false;
      
      // Decrement moves
      gameState.currentMoves--;
      
      // Check win/lose conditions
      checkGameConditions(p);
    }, 300);
  }, 300);
  
  cancelPath();
}

function checkGameConditions(p) {
  // Check if all objectives met
  let allObjectivesMet = true;
  for (let key in gameState.levelObjectives) {
    if (gameState.levelObjectives[key].current < gameState.levelObjectives[key].target) {
      allObjectivesMet = false;
      break;
    }
  }
  
  if (allObjectivesMet && gameState.currentMoves >= 0) {
    // Win
    const movesBonus = gameState.currentMoves * SCORE_VALUES.MOVES_REMAINING;
    gameState.score += SCORE_VALUES.LEVEL_COMPLETE + movesBonus;
    gameState.totalScore += SCORE_VALUES.LEVEL_COMPLETE + movesBonus;
    
    // Update high score
    if (gameState.totalScore > gameState.highScore) {
      gameState.highScore = gameState.totalScore;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gameHighScore', gameState.highScore);
      }
    }
    
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", score: gameState.score, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    // Submit score to parent
    if (typeof window.submitScore === 'function') {
      window.submitScore(gameState.totalScore);
    }
  } else if (gameState.currentMoves <= 0 && !allObjectivesMet) {
    // Lose
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", score: gameState.score, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    // Submit score to parent
    if (typeof window.submitScore === 'function') {
      window.submitScore(gameState.totalScore);
    }
  }
}