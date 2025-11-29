// input.js - Input handling

import { gameState, PHASE_PLAYING } from './globals.js';

export function handlePlayerInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (!gameState.player || !gameState.player.alive) return;
  if (gameState.controlMode !== "HUMAN") return;
  
  const head = gameState.player.getHead();
  let targetAngle = gameState.player.angle;
  
  // Arrow key controls
  if (p.keyIsDown(37)) { // LEFT
    targetAngle = Math.PI;
  }
  if (p.keyIsDown(39)) { // RIGHT
    targetAngle = 0;
  }
  if (p.keyIsDown(38)) { // UP
    targetAngle = -Math.PI / 2;
  }
  if (p.keyIsDown(40)) { // DOWN
    targetAngle = Math.PI / 2;
  }
  
  // Diagonal movement
  if (p.keyIsDown(37) && p.keyIsDown(38)) {
    targetAngle = -3 * Math.PI / 4;
  }
  if (p.keyIsDown(39) && p.keyIsDown(38)) {
    targetAngle = -Math.PI / 4;
  }
  if (p.keyIsDown(37) && p.keyIsDown(40)) {
    targetAngle = 3 * Math.PI / 4;
  }
  if (p.keyIsDown(39) && p.keyIsDown(40)) {
    targetAngle = Math.PI / 4;
  }
  
  gameState.player.setTargetAngle(targetAngle);
  
  // Speed boost
  if (p.keyIsDown(32)) { // SPACE
    gameState.player.activateSpeedBoost();
  } else {
    gameState.player.deactivateSpeedBoost();
  }
  
  // Magnet power-up
  if (p.keyIsDown(90)) { // Z
    if (!gameState.player.magnetActive && gameState.player.powerups.magnet > 0) {
      gameState.player.activateMagnet();
    }
  }
}

export function handleAutomatedInput(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  if (gameState.controlMode === "HUMAN") return;
  if (!gameState.player || !gameState.player.alive) return;
  
  const action = window.get_automated_testing_action(gameState);
  
  if (!action) return;
  
  // Apply action
  if (action.targetAngle !== undefined) {
    gameState.player.setTargetAngle(action.targetAngle);
  }
  
  if (action.speedBoost) {
    gameState.player.activateSpeedBoost();
  } else {
    gameState.player.deactivateSpeedBoost();
  }
  
  if (action.useMagnet && !gameState.player.magnetActive && gameState.player.powerups.magnet > 0) {
    gameState.player.activateMagnet();
  }
}