// input.js - Input handling

import { gameState, PHASE, DIRECTION } from './globals.js';
import { movePlayer, activateInvisibility, hackNearbyTerminal, waitTurn } from './game_logic.js';

export function handleKeyPressed(p, keyCode) {
  // Log the input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE.START) {
      startGame(p);
    }
    return;
  }

  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE.PLAYING) {
      gameState.gamePhase = PHASE.PAUSED;
      p.noLoop();
    } else if (gameState.gamePhase === PHASE.PAUSED) {
      gameState.gamePhase = PHASE.PLAYING;
      p.loop();
    }
    return;
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE.GAME_OVER_WIN || 
        gameState.gamePhase === PHASE.GAME_OVER_LOSE) {
      resetToStart(p);
    }
    return;
  }

  // Gameplay controls
  if (gameState.gamePhase === PHASE.PLAYING) {
    let moved = false;
    
    // Arrow keys for movement
    if (keyCode === 37) { // LEFT
      moved = movePlayer(DIRECTION.LEFT, p);
    } else if (keyCode === 38) { // UP
      moved = movePlayer(DIRECTION.UP, p);
    } else if (keyCode === 39) { // RIGHT
      moved = movePlayer(DIRECTION.RIGHT, p);
    } else if (keyCode === 40) { // DOWN
      moved = movePlayer(DIRECTION.DOWN, p);
    } else if (keyCode === 32) { // SPACE - invisibility
      activateInvisibility(p);
    } else if (keyCode === 90) { // Z - hack
      hackNearbyTerminal(p);
    } else if (keyCode === 16) { // SHIFT - wait
      waitTurn(p);
    }
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE.PLAYING;
  p.logs.game_info.push({
    data: { event: "game_started", phase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetToStart(p) {
  // Don't reset p.logs!
  gameState.gamePhase = PHASE.START;
  gameState.score = 0;
  gameState.turnCount = 0;
  gameState.invisibilityCharges = 3;
  gameState.isInvisible = false;
  gameState.invisibilityTurnsLeft = 0;
  gameState.detectedBy = null;
  gameState.exitReached = false;
  gameState.lastPlayerMove = null;
  gameState.moveHistory = [];
  
  // Reload level
  const { loadLevel } = require('./grid.js');
  const levelData = loadLevel(gameState.level, p);
  gameState.grid = levelData.grid;
  gameState.entities = levelData.entities;
  gameState.player = levelData.player;
  
  p.logs.game_info.push({
    data: { event: "game_reset", phase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}