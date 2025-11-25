// input.js - Input handling

import { gameState } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleInput(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  if (gameState.controlMode === "HUMAN") {
    handleHumanInput(p);
  } else {
    handleAutomatedInput(p);
  }
}

function handleHumanInput(p) {
  if (!gameState.player) return;
  
  // Movement
  if (p.keyIsDown(37)) { // Left
    gameState.player.move(-1);
  } else if (p.keyIsDown(39)) { // Right
    gameState.player.move(1);
  } else {
    gameState.player.move(0);
  }
  
  // Jump
  if (p.keyIsDown(90)) { // Z
    gameState.player.jump();
  }
  
  // Aim
  if (p.keyIsDown(38)) { // Up
    gameState.player.aimAngle = -Math.PI / 4;
  } else if (p.keyIsDown(40)) { // Down
    gameState.player.aimAngle = Math.PI / 4;
  } else {
    gameState.player.aimAngle = 0;
  }
  
  // Apply facing to aim
  if (gameState.player.facing === -1 && gameState.player.aimAngle === 0) {
    gameState.player.aimAngle = Math.PI;
  }
  
  // Shoot
  if (p.keyIsDown(32)) { // Space
    gameState.player.shoot();
  }
  
  // Special
  if (p.keyIsDown(16)) { // Shift
    gameState.player.useSpecial();
  }
}

function handleAutomatedInput(p) {
  if (!gameState.player) return;
  
  const action = get_automated_testing_action(gameState);
  
  if (!action) return;
  
  // Reset player movement
  gameState.player.move(0);
  
  // Apply actions
  if (action.left) {
    gameState.player.move(-1);
  }
  if (action.right) {
    gameState.player.move(1);
  }
  if (action.jump) {
    gameState.player.jump();
  }
  if (action.shoot) {
    gameState.player.shoot();
  }
  if (action.special) {
    gameState.player.useSpecial();
  }
  if (action.aimUp) {
    gameState.player.aimAngle = -Math.PI / 4;
  } else if (action.aimDown) {
    gameState.player.aimAngle = Math.PI / 4;
  } else {
    gameState.player.aimAngle = 0;
  }
  
  // Apply facing to aim
  if (gameState.player.facing === -1 && gameState.player.aimAngle === 0) {
    gameState.player.aimAngle = Math.PI;
  }
}