// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { moveCursor, selectNextTruck, addPathNode, clearCurrentTruckPath } from './pathPlanner.js';
import { startSimulation } from './simulation.js';
import { resetLevel, nextLevel } from './levelManager.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Global controls
  if (p.keyCode === 13) { // ENTER
    handleEnterKey(p);
  } else if (p.keyCode === 27) { // ESC
    handleEscKey(p);
  } else if (p.keyCode === 82) { // R
    handleRKey(p);
  }

  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.isSimulating) {
    handleGameplayInput(p);
  }

  return false; // Prevent default
}

function handleEnterKey(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.PLAYING, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.isSimulating) {
    // Start simulation
    startSimulation();
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    // Next level
    nextLevel();
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.PLAYING, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleEscKey(p) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    gameState.gamePhase = GAME_PHASES.PAUSED;
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.PAUSED },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleRKey(p) {
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
      gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
      gameState.gamePhase === GAME_PHASES.PLAYING) {
    resetLevel();
    gameState.gamePhase = GAME_PHASES.START;
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleGameplayInput(p) {
  // Arrow keys - move cursor
  if (p.keyCode === 37) { // LEFT
    moveCursor(-1, 0);
  } else if (p.keyCode === 38) { // UP
    moveCursor(0, -1);
  } else if (p.keyCode === 39) { // RIGHT
    moveCursor(1, 0);
  } else if (p.keyCode === 40) { // DOWN
    moveCursor(0, 1);
  }
  
  // SPACE - add path node
  if (p.keyCode === 32) {
    addPathNode();
  }
  
  // Z - select next truck
  if (p.keyCode === 90) {
    selectNextTruck();
  }
  
  // X - clear current truck path (88 is X)
  if (p.keyCode === 88) {
    clearCurrentTruckPath();
  }
}