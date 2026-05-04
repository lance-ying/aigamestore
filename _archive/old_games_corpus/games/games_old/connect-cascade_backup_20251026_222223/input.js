// input.js - Input handling
import { gameState, GAME_PHASES } from './globals.js';
import { getDotAtPosition, areDotsAdjacent, colorsMatch, isSquareFormed, clearDots, applyGravity, fillEmptySpaces, checkAnchorObjective } from './grid.js';
import { getColorName } from './levels.js';
import { SCORE_VALUES } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (gameState.controlMode !== "HUMAN") return;

  if (gameState.gamePhase === GAME_PHASES.START) {
    if (keyCode === 13) { // ENTER
      startGame(p);
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (keyCode === 27) { // ESC
      pauseGame(p);
    } else if (keyCode === 32) { // SPACE
      handleSpacePress(p);
    } else if (keyCode === 16) { // SHIFT
      handleShiftPress(p);
    } else if (keyCode >= 37 && keyCode <= 40) { // ARROW KEYS
      handleArrowPress(p, keyCode);
    }
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    if (keyCode === 27) { // ESC
      unpauseGame(p);
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (keyCode === 82) { // R
      returnToStart(p);
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

  if (gameState.controlMode !== "HUMAN") return;

  // Space key no longer uses release - everything is toggle-based now
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

function returnToStart(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 1;
  gameState.totalScore = 0;
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleSpacePress(p) {
  if (gameState.isAnimating) return;
  
  if (gameState.currentSelectedDot === null) {
    // Enter path building mode - select dot at cursor
    const dot = getDotAtPosition(gameState.cursorX, gameState.cursorY);
    if (dot) {
      gameState.currentSelectedDot = dot;
      gameState.currentPath = [dot];
      gameState.isSpaceHeld = true; // Using this to track "path mode active"
    }
  } else {
    // Exit path building mode - execute move if valid, otherwise cancel
    if (gameState.currentPath.length >= 2) {
      executeMove(p);
    } else {
      cancelPath();
    }
  }
}

function handleShiftPress(p) {
  if (gameState.currentSelectedDot !== null && !gameState.isAnimating) {
    cancelPath();
  }
}

function handleArrowPress(p, keyCode) {
  if (gameState.isAnimating) return;
  
  if (gameState.currentSelectedDot === null) {
    // Move cursor normally
    if (keyCode === 37) gameState.cursorX = Math.max(0, gameState.cursorX - 1); // LEFT
    if (keyCode === 39) gameState.cursorX = Math.min(gameState.gridCols - 1, gameState.cursorX + 1); // RIGHT
    if (keyCode === 38) gameState.cursorY = Math.max(0, gameState.cursorY - 1); // UP
    if (keyCode === 40) gameState.cursorY = Math.min(gameState.gridRows - 1, gameState.cursorY + 1); // DOWN
  } else {
    // Extend or retract path (in path building mode)
    if (keyCode === 37) gameState.cursorX = Math.max(0, gameState.cursorX - 1);
    if (keyCode === 39) gameState.cursorX = Math.min(gameState.gridCols - 1, gameState.cursorX + 1);
    if (keyCode === 38) gameState.cursorY = Math.max(0, gameState.cursorY - 1);
    if (keyCode === 40) gameState.cursorY = Math.min(gameState.gridRows - 1, gameState.cursorY + 1);
    
    const newDot = getDotAtPosition(gameState.cursorX, gameState.cursorY);
    
    if (newDot && gameState.currentPath.length > 0) {
      const lastDot = gameState.currentPath[gameState.currentPath.length - 1];
      
      // Check if backtracking
      if (gameState.currentPath.length > 1) {
        const prevDot = gameState.currentPath[gameState.currentPath.length - 2];
        if (newDot === prevDot) {
          gameState.currentPath.pop();
          return;
        }
      }
      
      // Check if can extend path
      if (areDotsAdjacent(lastDot, newDot) && 
          colorsMatch(lastDot.color, newDot.color) &&
          !gameState.currentPath.includes(newDot)) {
        gameState.currentPath.push(newDot);
      }
    }
  }
}

function cancelPath() {
  gameState.currentSelectedDot = null;
  gameState.currentPath = [];
  gameState.isSpaceHeld = false;
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
        localStorage.setItem('connectCascadeHighScore', gameState.highScore);
      }
    }
    
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", score: gameState.score, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.currentMoves <= 0 && !allObjectivesMet) {
    // Lose
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", score: gameState.score, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}