// automated_testing_controller.js - Automated testing strategies

import { gameState } from './globals.js';

function getTestBasicAction(gameState) {
  // TEST_1: Basic movement and combat test
  if (!gameState.player) return null;
  
  const actions = [];
  
  // Try different movements
  if (gameState.frameCount % 60 < 20) {
    actions.push(39); // Right
  } else if (gameState.frameCount % 60 < 40) {
    actions.push(37); // Left
  }
  
  // Jump occasionally
  if (gameState.frameCount % 45 === 0) {
    actions.push(32); // Space
  }
  
  // Dash occasionally
  if (gameState.frameCount % 90 === 0 && gameState.player.dashCooldown <= 0) {
    actions.push(16); // Shift
  }
  
  // Fire rockets at enemies
  if (gameState.enemies.length > 0 && gameState.player.rocketCooldown <= 0) {
    actions.push(90); // Z
  }
  
  // Chainsaw slide toward enemies
  if (gameState.enemies.length > 0 && gameState.player.onGround) {
    const nearestEnemy = gameState.enemies[0];
    if (Math.abs(nearestEnemy.x - gameState.player.x) < 150) {
      return { keyCode: 40 }; // Down for slide
    }
  }
  
  return actions.length > 0 ? { keyCode: actions[0] } : null;
}

function getTestWinAction(gameState) {
  // TEST_2: Optimal strategy to win
  if (!gameState.player || gameState.enemies.length === 0) {
    return null;
  }
  
  const player = gameState.player;
  const nearestEnemy = gameState.enemies.reduce((closest, enemy) => {
    const dist1 = Math.abs(player.x - closest.x);
    const dist2 = Math.abs(player.x - enemy.x);
    return dist1 < dist2 ? closest : enemy;
  });
  
  const dx = nearestEnemy.x - player.x;
  const dy = nearestEnemy.y - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Prioritize chainsaw slide when close and on ground
  if (distance < 100 && player.onGround && !player.isSliding) {
    return { keyCode: 40 }; // Start slide
  }
  
  // Fire rockets when available
  if (player.rocketCooldown <= 0 && distance > 80 && distance < 300) {
    return { keyCode: 90 }; // Z
  }
  
  // Dash to close distance or escape
  if (player.dashCooldown <= 0) {
    if (distance > 200 || (distance < 50 && player.health < 30)) {
      return { keyCode: 16 }; // Shift
    }
  }
  
  // Jump over enemies or to wall-run
  if (!player.onGround && Math.abs(dx) < 30) {
    return { keyCode: 32 }; // Space
  }
  
  // Move toward enemy
  if (Math.abs(dx) > 40) {
    return { keyCode: dx > 0 ? 39 : 37 }; // Right or Left
  }
  
  // Jump if stuck
  if (player.onGround && Math.abs(player.vx) < 1) {
    return { keyCode: 32 }; // Space
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;