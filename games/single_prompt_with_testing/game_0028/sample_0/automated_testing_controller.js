// automated_testing_controller.js - Automated testing functions

import { gameState, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SPACE, KEY_Z, KEY_SHIFT } from './globals.js';

function getTestWinAction(gameState) {
  const player = gameState.player;
  const opponent = gameState.opponent;
  
  if (!player || !opponent || !player.isAlive || !opponent.isAlive) {
    return [];
  }
  
  const actions = [];
  
  // Calculate relative position
  const dx = opponent.x - player.x;
  const dy = opponent.y - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Strategy: Approach and attack aggressively
  
  // Move toward opponent
  if (Math.abs(dx) > 60) {
    if (dx > 0) {
      actions.push(KEY_RIGHT);
    } else {
      actions.push(KEY_LEFT);
    }
  }
  
  // Jump to reach opponent if they're above
  if (dy < -30 && player.grounded) {
    actions.push(KEY_UP);
  }
  
  // Attack when in range
  if (distance < 100) {
    // Use strong attacks when damage is high for KO
    if (opponent.damage > 80 && Math.random() < 0.4) {
      actions.push(KEY_Z);
    } else if (Math.random() < 0.5) {
      actions.push(KEY_SPACE);
    }
    
    // Occasionally use specials
    if (Math.random() < 0.2) {
      actions.push(KEY_SHIFT);
      // Add directional input for special
      if (dy < 0) {
        actions.push(KEY_UP);
      }
    }
  }
  
  // Use projectiles/specials from medium range
  if (distance > 100 && distance < 250 && Math.random() < 0.15) {
    actions.push(KEY_SHIFT);
  }
  
  return actions;
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  
  if (!player || !player.isAlive) {
    return [];
  }
  
  const actions = [];
  const frame = gameState.frameCount;
  
  // Cycle through basic movements and actions
  const cycle = Math.floor(frame / 60) % 8;
  
  switch(cycle) {
    case 0:
      actions.push(KEY_RIGHT);
      break;
    case 1:
      actions.push(KEY_LEFT);
      break;
    case 2:
      if (player.grounded) actions.push(KEY_UP);
      break;
    case 3:
      actions.push(KEY_SPACE);
      break;
    case 4:
      actions.push(KEY_Z);
      break;
    case 5:
      actions.push(KEY_SHIFT);
      break;
    case 6:
      actions.push(KEY_RIGHT);
      actions.push(KEY_SPACE);
      break;
    case 7:
      actions.push(KEY_LEFT);
      actions.push(KEY_Z);
      break;
  }
  
  return actions;
}

function getSpecialTestAction(gameState) {
  const player = gameState.player;
  const opponent = gameState.opponent;
  
  if (!player || !opponent || !player.isAlive || !opponent.isAlive) {
    return [];
  }
  
  const actions = [];
  const frame = gameState.frameCount;
  
  // Test special attacks in different directions
  const cycle = Math.floor(frame / 90) % 4;
  
  // Always move toward opponent first
  const dx = opponent.x - player.x;
  if (Math.abs(dx) > 100) {
    actions.push(dx > 0 ? KEY_RIGHT : KEY_LEFT);
  }
  
  // Use specials with different directions
  if (frame % 60 === 0) {
    actions.push(KEY_SHIFT);
    switch(cycle) {
      case 0:
        actions.push(KEY_UP);
        break;
      case 1:
        actions.push(KEY_DOWN);
        break;
      case 2:
        actions.push(KEY_LEFT);
        break;
      case 3:
        actions.push(KEY_RIGHT);
        break;
    }
  }
  
  return actions;
}

function getDefensiveTestAction(gameState) {
  const player = gameState.player;
  const opponent = gameState.opponent;
  
  if (!player || !opponent || !player.isAlive || !opponent.isAlive) {
    return [];
  }
  
  const actions = [];
  
  // Stay at medium distance and test damage accumulation
  const dx = opponent.x - player.x;
  const distance = Math.abs(dx);
  
  if (distance < 80) {
    // Move away
    actions.push(dx > 0 ? KEY_LEFT : KEY_RIGHT);
  } else if (distance > 200) {
    // Move closer
    actions.push(dx > 0 ? KEY_RIGHT : KEY_LEFT);
  }
  
  // Attack occasionally
  if (Math.random() < 0.2) {
    actions.push(KEY_SPACE);
  }
  
  return actions;
}

function getPlatformTestAction(gameState) {
  const player = gameState.player;
  
  if (!player || !player.isAlive) {
    return [];
  }
  
  const actions = [];
  const frame = gameState.frameCount;
  const cycle = Math.floor(frame / 120) % 5;
  
  // Navigate between platforms
  switch(cycle) {
    case 0:
      // Move to left platform
      if (player.x > 150) {
        actions.push(KEY_LEFT);
      } else if (player.grounded) {
        actions.push(KEY_UP);
      }
      break;
    case 1:
      // Move to right platform
      if (player.x < 450) {
        actions.push(KEY_RIGHT);
      } else if (player.grounded) {
        actions.push(KEY_UP);
      }
      break;
    case 2:
      // Move to center top platform
      if (player.x < 280) {
        actions.push(KEY_RIGHT);
      } else if (player.x > 320) {
        actions.push(KEY_LEFT);
      }
      if (player.y > 200 && player.grounded) {
        actions.push(KEY_UP);
      }
      break;
    case 3:
      // Test drop through platform
      if (!player.grounded && player.y < 300) {
        actions.push(KEY_DOWN);
      }
      break;
    case 4:
      // Return to ground
      if (player.y < 340) {
        actions.push(KEY_DOWN);
      }
      break;
  }
  
  return actions;
}

function getRandomAction(gameState) {
  const actions = [];
  const keys = [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_SPACE, KEY_Z, KEY_SHIFT];
  
  if (Math.random() < 0.3) {
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    actions.push(randomKey);
  }
  
  return actions;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getSpecialTestAction(gameState);
    case "TEST_4":
      return getDefensiveTestAction(gameState);
    case "TEST_5":
      return getPlatformTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;