// input_handler.js - Input handling and processing

import {
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  DESIGN_PHASE,
  SIMULATE_PHASE,
  gameState
} from './globals.js';

import { startGame, restartGame, togglePause } from './game_logic.js';
import { handleDesignInput, startSimulation } from './design_phase.js';

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
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      restartGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      togglePause(p);
    }
    return;
  }
  
  // Game-specific controls during PLAYING phase
  if (gameState.gamePhase === PHASE_PLAYING && gameState.gamePhase !== PHASE_PAUSED) {
    if (gameState.designPhase === DESIGN_PHASE) {
      handleDesignInput(p, keyCode);
    }
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

export function processAutomatedInput(p, action) {
  if (!action) return;
  
  // Log automated action
  p.logs.inputs.push({
    input_type: "automated",
    data: { action },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Process action
  if (action.keyCode) {
    handleKeyPressed(p, action.key, action.keyCode);
  }
}