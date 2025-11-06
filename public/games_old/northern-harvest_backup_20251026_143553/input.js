// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { startGame, restartGame, togglePause, plantCrop, harvestAll } from './game-logic.js';

let p;

export function initInput(p5Instance) {
  p = p5Instance;
}

export function handleKeyPressed(key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Game phase controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame();
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      togglePause();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      togglePause();
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame();
    }
  }

  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (keyCode === 32) { // SPACE - quick harvest
      harvestAll();
    } else if (keyCode === 90) { // Z - plant selected crop
      if (gameState.selectedCrop) {
        plantCrop(gameState.selectedCrop);
      }
    }
  }
}

export function handleKeyReleased(key, keyCode) {
  // Log input release if needed
}

export function isKeyPressed(keyCode) {
  return p.keyIsDown(keyCode);
}