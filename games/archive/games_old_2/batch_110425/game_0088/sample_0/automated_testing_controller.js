// automated_testing_controller.js - Automated testing AI
import { KEY_SPACE, KEY_SHIFT, KEY_Z, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN } from './globals.js';

function getTestWinAction(gameState) {
  const keys = [];
  
  // Strategy: Target closest zombird to ground (highest threat)
  if (gameState.zombirds.length > 0) {
    // Find zombird closest to ground
    let closestZombird = null;
    let maxY = -1;
    
    for (const zombird of gameState.zombirds) {
      if (zombird.y > maxY) {
        maxY = zombird.y;
        closestZombird = zombird;
      }
    }
    
    if (closestZombird) {
      const player = gameState.player;
      const dx = closestZombird.x - player.x;
      const dy = closestZombird.y - player.y;
      
      // Determine best aim direction
      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal aim
        if (dx > 0) {
          keys.push(KEY_RIGHT);
        } else {
          keys.push(KEY_LEFT);
        }
      } else {
        // Vertical aim
        if (dy > 0) {
          keys.push(KEY_DOWN);
        } else {
          keys.push(KEY_UP);
        }
      }
      
      // Fire!
      keys.push(KEY_SPACE);
      
      // Use powers when available and many zombirds
      if (gameState.zombirds.length > 5) {
        if (gameState.upgrades.multiShotUnlocked && gameState.multiShotCooldown === 0) {
          keys.push(KEY_SHIFT);
        }
      }
      
      // Use shield when pumpkins are damaged and wave is tough
      const totalPumpkinHealth = gameState.pumpkins.reduce((sum, p) => sum + p.health, 0);
      if (totalPumpkinHealth < 10 && gameState.zombirds.length > 3) {
        if (gameState.upgrades.shieldUnlocked && gameState.shieldCooldown === 0) {
          keys.push(KEY_Z);
        }
      }
    }
  }
  
  return keys;
}

function getTestBasicAction(gameState) {
  const keys = [];
  
  // Simple testing: rotate aim and shoot
  const directions = [KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_LEFT];
  const currentFrame = gameState.player ? Math.floor(Date.now() / 500) % 4 : 0;
  
  keys.push(directions[currentFrame]);
  
  // Fire occasionally
  if (Math.random() < 0.3) {
    keys.push(KEY_SPACE);
  }
  
  return keys;
}

function getTestUpgradeAction(gameState) {
  const keys = [];
  
  // Focus on earning coins and testing upgrades
  if (gameState.zombirds.length > 0) {
    const zombird = gameState.zombirds[0];
    const player = gameState.player;
    
    const dx = zombird.x - player.x;
    const dy = zombird.y - player.y;
    
    // Simple aiming
    if (Math.abs(dx) > Math.abs(dy)) {
      keys.push(dx > 0 ? KEY_RIGHT : KEY_LEFT);
    } else {
      keys.push(dy > 0 ? KEY_DOWN : KEY_UP);
    }
    
    keys.push(KEY_SPACE);
  }
  
  return keys;
}

function getTestPowerAction(gameState) {
  const keys = [];
  
  // Test power-ups
  if (gameState.zombirds.length > 0) {
    const zombird = gameState.zombirds[0];
    const player = gameState.player;
    
    const dx = zombird.x - player.x;
    const dy = zombird.y - player.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      keys.push(dx > 0 ? KEY_RIGHT : KEY_LEFT);
    } else {
      keys.push(dy > 0 ? KEY_DOWN : KEY_UP);
    }
    
    keys.push(KEY_SPACE);
    
    // Spam powers when available
    if (gameState.upgrades.multiShotUnlocked && gameState.multiShotCooldown === 0) {
      keys.push(KEY_SHIFT);
    }
    if (gameState.upgrades.shieldUnlocked && gameState.shieldCooldown === 0) {
      keys.push(KEY_Z);
    }
  }
  
  return keys;
}

function getRandomAction(gameState) {
  const keys = [];
  const rand = Math.random();
  
  if (rand < 0.2) {
    keys.push(KEY_UP);
  } else if (rand < 0.4) {
    keys.push(KEY_RIGHT);
  } else if (rand < 0.6) {
    keys.push(KEY_DOWN);
  } else if (rand < 0.8) {
    keys.push(KEY_LEFT);
  }
  
  if (Math.random() < 0.4) {
    keys.push(KEY_SPACE);
  }
  
  return keys;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestUpgradeAction(gameState);
    case "TEST_4":
      return getTestPowerAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;