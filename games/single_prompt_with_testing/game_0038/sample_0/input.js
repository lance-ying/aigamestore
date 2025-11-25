// input.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
         PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, GRID_COLS, GRID_ROWS } from './globals.js';
import { placeRoad, removeRoad } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === 13) {  // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) {  // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) {  // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE ||
        gameState.gamePhase === PHASE_PAUSED) {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Movement
  if (keyCode === 37) {  // LEFT
    gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  } else if (keyCode === 39) {  // RIGHT
    gameState.cursorX = Math.min(GRID_COLS - 1, gameState.cursorX + 1);
  } else if (keyCode === 38) {  // UP
    gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  } else if (keyCode === 40) {  // DOWN
    gameState.cursorY = Math.min(GRID_ROWS - 1, gameState.cursorY + 1);
  }
  
  // Place/remove road
  if (keyCode === 32) {  // SPACE
    const cell = gameState.grid[gameState.cursorY][gameState.cursorX];
    if (cell.type === "ROAD" || cell.type === "HIGHWAY") {
      removeRoad(gameState.cursorX, gameState.cursorY);
    } else if (cell.type === null) {
      placeRoad(gameState.cursorX, gameState.cursorY);
    }
  }
  
  // Toggle upgrade mode
  if (keyCode === 16) {  // SHIFT
    if (gameState.highwayTilesAvailable > 0) {
      gameState.upgradeMode = !gameState.upgradeMode;
    }
  }
  
  // Toggle connection view
  if (keyCode === 90) {  // Z
    gameState.showConnectionView = !gameState.showConnectionView;
  }
}

export function handleKeyReleased(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, action: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = PHASE_START;
  p.logs.game_info.push({
    data: { phase: PHASE_START, action: "game_reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}