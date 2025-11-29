// automated_testing_controller.js - Automated testing AI

import { gameState } from './globals.js';
import { distance } from './utils.js';

function getTestWinAction(gameState) {
  if (!gameState.player || !gameState.tattletail) return null;
  
  // Priority 1: Keep flashlight on if battery is good
  if (gameState.flashlightBattery > 30 && !gameState.flashlightOn) {
    return { keyCode: 90 }; // Z to toggle flashlight
  }
  
  // Priority 2: Recharge flashlight if low
  if (gameState.flashlightBattery < 50) {
    return { keyCode: 16 }; // SHIFT to shake
  }
  
  // Priority 3: Care for Tattletail if needs are low
  const dist = distance(
    gameState.player.x,
    gameState.player.y,
    gameState.tattletail.x,
    gameState.tattletail.y
  );
  
  if (gameState.tattletailNeedType !== "none") {
    if (dist < 80) {
      // Close enough to interact
      return { keyCode: 32 }; // SPACE to interact
    } else {
      // Move towards Tattletail
      const dx = gameState.tattletail.x - gameState.player.x;
      const dy = gameState.tattletail.y - gameState.player.y;
      const angle = Math.atan2(dy, dx);
      const playerAngle = gameState.player.angle;
      
      // Calculate angle difference
      let angleDiff = angle - playerAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      if (Math.abs(angleDiff) > 0.3) {
        // Need to turn
        return angleDiff > 0 ? { keyCode: 39 } : { keyCode: 37 }; // RIGHT or LEFT
      } else {
        // Move forward
        return { keyCode: 38 }; // UP
      }
    }
  }
  
  // Priority 4: Avoid Mama if she's active and close
  if (gameState.mama && gameState.mama.active && gameState.mama.spawnDelay <= 0) {
    const mamaDist = distance(
      gameState.player.x,
      gameState.player.y,
      gameState.mama.x,
      gameState.mama.y
    );
    
    if (mamaDist < 150) {
      // Run away from Mama
      const dx = gameState.player.x - gameState.mama.x;
      const dy = gameState.player.y - gameState.mama.y;
      const angle = Math.atan2(dy, dx);
      const playerAngle = gameState.player.angle;
      
      let angleDiff = angle - playerAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      if (Math.abs(angleDiff) > 0.5) {
        return angleDiff > 0 ? { keyCode: 39 } : { keyCode: 37 };
      } else {
        return { keyCode: 38 }; // Move forward away from Mama
      }
    }
  }
  
  // Default: Stay quiet and wait
  return null;
}

function getBasicTestAction(gameState) {
  // Test basic movement patterns
  const time = Math.floor(gameState.frameCount / 60);
  const pattern = time % 8;
  
  switch (pattern) {
    case 0:
    case 1:
      return { keyCode: 38 }; // Forward
    case 2:
      return { keyCode: 39 }; // Turn right
    case 3:
    case 4:
      return { keyCode: 38 }; // Forward
    case 5:
      return { keyCode: 37 }; // Turn left
    case 6:
      return { keyCode: 90 }; // Toggle flashlight
    case 7:
      return { keyCode: 32 }; // Try interact
    default:
      return null;
  }
}

function getRandomAction(gameState) {
  const actions = [
    { keyCode: 37 }, // LEFT
    { keyCode: 38 }, // UP
    { keyCode: 39 }, // RIGHT
    { keyCode: 40 }, // DOWN
    { keyCode: 32 }, // SPACE
    { keyCode: 90 }, // Z
    { keyCode: 16 }, // SHIFT
  ];
  
  if (Math.random() < 0.3) {
    return actions[Math.floor(Math.random() * actions.length)];
  }
  
  return null;
}

export function get_automated_testing_action(gameState) {
  if (!gameState) return null;
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}