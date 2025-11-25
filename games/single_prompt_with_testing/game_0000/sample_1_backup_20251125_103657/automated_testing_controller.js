// automated_testing_controller.js - AI controller for automated testing

import { gameState, KEYS } from './globals.js';

function getTestWinAction() {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  
  // Priority 1: Move towards relic if visible
  if (gameState.relic && !gameState.relicCollected) {
    const dx = gameState.relic.x - player.x;
    const dy = gameState.relic.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Close to relic, just move towards it
    if (distance < 200) {
      if (Math.abs(dx) > 20) {
        return { keyCode: dx > 0 ? KEYS.RIGHT : KEYS.LEFT };
      }
      if (dy < -20 && player.onGround) {
        return { keyCode: KEYS.UP };
      }
      return { keyCode: KEYS.RIGHT };
    }
  }
  
  // Priority 2: Attack nearby enemies
  const nearestEnemy = findNearestEnemy(player);
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    const dy = nearestEnemy.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Attack if in range
    if (distance < 40) {
      return { keyCode: KEYS.Z };
    }
    
    // Move towards enemy if reasonably close
    if (distance < 150) {
      if (Math.abs(dx) > 20) {
        return { keyCode: dx > 0 ? KEYS.RIGHT : KEYS.LEFT };
      }
      if (dy < -20 && player.onGround) {
        return { keyCode: KEYS.UP };
      }
    }
  }
  
  // Priority 3: Move right (towards goal)
  if (player.x < gameState.worldWidth - 500) {
    // Jump over gaps or obstacles
    if (player.onGround && Math.random() > 0.7) {
      return { keyCode: KEYS.UP };
    }
    
    // Dash occasionally for speed
    if (player.canDash && Math.random() > 0.9) {
      return { keyCode: KEYS.SPACE };
    }
    
    return { keyCode: KEYS.RIGHT };
  }
  
  // Priority 4: Navigate to relic area
  return { keyCode: KEYS.RIGHT };
}

function getTestBasicAction() {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  const actions = [];
  
  // Basic movement testing
  if (Math.random() > 0.7) {
    actions.push(KEYS.LEFT, KEYS.RIGHT);
  }
  
  // Jump testing
  if (player.onGround && Math.random() > 0.8) {
    actions.push(KEYS.UP);
  }
  
  // Attack testing
  if (Math.random() > 0.85) {
    actions.push(KEYS.Z);
  }
  
  // Dash testing
  if (player.canDash && Math.random() > 0.9) {
    actions.push(KEYS.SPACE);
  }
  
  if (actions.length > 0) {
    return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
  }
  
  return null;
}

function findNearestEnemy(player) {
  let nearest = null;
  let minDistance = Infinity;
  
  for (const enemy of gameState.enemies) {
    const dx = enemy.x - player.x;
    const dy = enemy.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = enemy;
    }
  }
  
  return nearest;
}

export function get_automated_testing_action(state) {
  switch (state.controlMode) {
    case "TEST_1":
      return getTestBasicAction();
    case "TEST_2":
      return getTestWinAction();
    default:
      return null;
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;