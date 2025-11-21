import { gameState, GAME_PHASES, LEVELS } from './globals.js';
import { startLevel, checkDifferenceClick, useHint, resetGame } from './gameLogic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game or progress
  if (keyCode === 13) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      startLevel(p, 1);
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
      if (gameState.currentLevel < LEVELS.length) {
        startLevel(p, gameState.currentLevel + 1);
      } else {
        // Completed all levels
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
      startLevel(p, 1);
    }
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // R - Restart to start screen
  if (keyCode === 82) {
    resetGame(p);
  }
  
  // Z - Return to main menu from level complete or game over
  if (keyCode === 90) {
    if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE ||
        gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
    }
  }
  
  // SPACE - Use hint
  if (keyCode === 32) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.hintActive) {
      useHint(p);
    }
  }
  
  // Arrow keys for keyboard-only difference selection (TEST mode support)
  if (gameState.controlMode !== "HUMAN") {
    if (keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40) {
      // Arrow keys pressed - handled by test controller
    }
  }
}

export function handleMousePressed(p, mouseX, mouseY) {
  // Only process mouse in HUMAN mode
  if (gameState.controlMode !== "HUMAN") {
    return;
  }
  
  // Log input
  p.logs.inputs.push({
    input_type: "mousePressed",
    data: { mouseX: mouseX, mouseY: mouseY },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    checkDifferenceClick(p, mouseX, mouseY);
  }
}