// automated_testing_controller.js - Automated testing and AI control
import { gameState } from './globals.js';

let moveHistory = [];
let stuckCounter = 0;
let lastAction = null;
let testState = {
  phase: 'explore',
  targetPlatformIndex: 1,
  waitTimer: 0
};

function getTestWinAction(gs) {
  const player = gs.player;
  if (!player) return null;
  
  // Reset stuck counter if position changed significantly
  if (moveHistory.length > 0) {
    const lastPos = moveHistory[moveHistory.length - 1];
    const dist = Math.sqrt((player.x - lastPos.x) ** 2 + (player.y - lastPos.y) ** 2);
    if (dist > 5) {
      stuckCounter = 0;
    } else {
      stuckCounter++;
    }
  }
  
  moveHistory.push({ x: player.x, y: player.y });
  if (moveHistory.length > 30) moveHistory.shift();
  
  // Check if we've won
  if (player.y < 100 && player.x > 210 && player.x < 390) {
    return null; // We won!
  }
  
  // Strategy: Climb upward through platforms, collect dash, defeat enemies when necessary
  
  // Find nearest platform above us
  let targetPlatform = null;
  let minDist = Infinity;
  
  for (let platform of gs.platforms) {
    if (platform.y < player.y - 20) { // Platform is above us
      let dist = Math.sqrt((platform.x - player.x) ** 2 + (platform.y - player.y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        targetPlatform = platform;
      }
    }
  }
  
  // Check for dash pickup if not unlocked
  if (!gs.dashUnlocked) {
    for (let pickup of gs.pickups) {
      if (pickup.constructor.name === 'DashPickup' && !pickup.collected) {
        targetPlatform = { x: pickup.x, y: pickup.y };
        break;
      }
    }
  }
  
  if (!targetPlatform) {
    // No platform above, find the citadel
    for (let platform of gs.platforms) {
      if (platform.type === 'citadel') {
        targetPlatform = platform;
        break;
      }
    }
  }
  
  let actions = [];
  
  if (targetPlatform) {
    let dx = targetPlatform.x - player.x;
    let dy = targetPlatform.y - player.y;
    
    // Horizontal movement
    if (Math.abs(dx) > 20) {
      if (dx > 0) {
        actions.push(39); // Right arrow
      } else {
        actions.push(37); // Left arrow
      }
      
      // Use dash if available and we need to cross a gap
      if (gs.dashUnlocked && player.dashCooldown === 0 && Math.abs(dx) > 80 && !player.grounded) {
        actions.push(16); // Shift
      }
    }
    
    // Jump if we need to go up and we're on ground
    if (dy < -30 && player.grounded && Math.abs(dx) < 50) {
      actions.push(32); // Space
    }
    
    // Jump if stuck
    if (stuckCounter > 20 && player.grounded) {
      actions.push(32);
      stuckCounter = 0;
    }
  }
  
  // Attack nearby enemies
  for (let enemy of gs.enemies) {
    if (enemy.alive) {
      let distToEnemy = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
      if (distToEnemy < 60 && player.attackTimer === 0) {
        actions.push(90); // Z key
      }
    }
  }
  
  lastAction = actions.length > 0 ? actions : null;
  return actions.length > 0 ? actions : null;
}

function getBasicTestAction(gs) {
  const player = gs.player;
  if (!player) return null;
  
  let actions = [];
  
  // Simple behavior: move right, jump occasionally, attack
  if (Math.random() < 0.7) {
    actions.push(39); // Move right
  }
  
  if (player.grounded && Math.random() < 0.1) {
    actions.push(32); // Jump
  }
  
  // Attack if enemies nearby
  for (let enemy of gs.enemies) {
    if (enemy.alive) {
      let dist = Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
      if (dist < 50) {
        actions.push(90); // Z
        break;
      }
    }
  }
  
  return actions.length > 0 ? actions : null;
}

export function get_automated_testing_action(gs) {
  switch (gs.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;