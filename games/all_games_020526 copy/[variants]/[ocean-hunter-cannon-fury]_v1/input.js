import { gameState, LEVELS, UPGRADES, CANNON_ROTATION_STEP } from './globals.js';
import { rotateCannon, fireCannon } from './cannon.js';
import { startGame, togglePause, restartGame, purchaseUpgrade } from './gameLogic.js';

export function handleKeyPressed(p) {
  // Track key state for continuous movement
  gameState.keysPressed[p.keyCode] = true;
  
  // ENTER - Start game
  if (p.keyCode === 13) {
    if (gameState.gamePhase === 'START') {
      startGame(p);
    }
    return;
  }
  
  // ESC - Pause/Unpause
  if (p.keyCode === 27) {
    if (gameState.gamePhase === 'PLAYING' || gameState.gamePhase === 'PAUSED') {
      togglePause(p);
    }
    return;
  }
  
  // R - Restart
  if (p.keyCode === 82) {
    if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
      // Cancel any pending auto-restart before manual restart
      if (gameState.autoRestartTimeoutId) {
        clearTimeout(gameState.autoRestartTimeoutId);
        gameState.autoRestartTimeoutId = null;
      }
      gameState.autoRestartScheduled = false; // Reset flag

      restartGame(p);
    }
    return;
  }
  
  // Removed 'E' key handler for toggling easy mode/trajectory as trajectory is now always shown.
  
  // Game controls only work during PLAYING
  if (gameState.gamePhase !== 'PLAYING') return;
  
  // Space - Fire (single press)
  if (p.keyCode === 32) {
    fireCannon(p);
  }
  
  // Upgrades (1, 2, 3, 4 keys)
  if (p.keyCode === 49) { // 1 key
    purchaseUpgrade('damage', p);
  }
  if (p.keyCode === 50) { // 2 key
    purchaseUpgrade('fireRate', p);
  }
  if (p.keyCode === 51) { // 3 key
    purchaseUpgrade('rotationSpeed', p);
  }
  if (p.keyCode === 52) { // 4 key
    purchaseUpgrade('weaponType', p);
  }
}

export function handleKeyReleased(p) {
  gameState.keysPressed[p.keyCode] = false;
}

// Process continuous movement from held keys
export function processContinuousInput(p) {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  // Arrow Left - Rotate cannon left
  if (gameState.keysPressed[37]) {
    rotateCannon(-1, p);
  }
  
  // Arrow Right - Rotate cannon right
  if (gameState.keysPressed[39]) {
    rotateCannon(1, p);
  }
}