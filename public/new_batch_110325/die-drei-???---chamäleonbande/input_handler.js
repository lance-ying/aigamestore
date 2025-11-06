// input_handler.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { startGame, togglePause, restartGame } from './game_logic.js';
import { handleGameplayInput } from './gameplay.js';

export function handleKeyPressed(p, keyCode) {
  // Log the input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase transitions
  if (keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
    startGame();
    return;
  }

  if (keyCode === 27) { // ESC - Pause/Unpause
    togglePause();
    return;
  }

  if (keyCode === 82) { // R - Restart
    restartGame();
    return;
  }

  // Gameplay inputs
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(keyCode);
  }
}

export function handleKeyReleased(p, keyCode) {
  // Log the input
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}