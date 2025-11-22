// input.js - Input handling
import { gameState, PHASE_PLAYING, PHASE_PAUSED, PHASE_START, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { startGame, togglePause, restartGame } from './gameLogic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
  }

  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      togglePause(p);
    }
  }

  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      restartGame(p);
    }
  }

  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING && gameState.fallingCard) {
    if (keyCode === 37) { // LEFT
      gameState.fallingCard.moveLeft();
    } else if (keyCode === 39) { // RIGHT
      gameState.fallingCard.moveRight();
    } else if (keyCode === 40) { // DOWN
      gameState.fallingCard.speedUp();
    } else if (keyCode === 32) { // SPACE
      gameState.fallingCard.drop();
    }
  }
}