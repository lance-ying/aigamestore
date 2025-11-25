// automated_testing_controller.js - Automated testing

import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Clear all enemies, collect items, progress through floors
  
  const player = gameState.player;
  if (!player) {
    return getNoAction();
  }
  
  const actions = {
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    shoot: false,
    bomb: false,
    special: false
  };
  
  // Priority 1: Collect hearts if health is low
  if (gameState.playerHealth < gameState.playerMaxHealth - 2 && gameState.hearts.length > 0) {
    const nearestHeart = findNearest(player, gameState.hearts);
    if (nearestHeart) {
      moveTowards(player, nearestHeart, actions);
      return actions;
    }
  }
  
  // Priority 2: Collect items
  if (gameState.items.length > 0) {
    const nearestItem = findNearest(player, gameState.items);
    if (nearestItem) {
      const dist = distance(player, nearestItem);
      if (dist > 30) {
        moveTowards(player, nearestItem, actions);
        return actions;
      }
    }
  }
  
  // Priority 3: Fight enemies
  if (gameState.enemies.length > 0) {
    const nearestEnemy = findNearest(player, gameState.enemies);
    if (nearestEnemy) {
      const dist = distance(player, nearestEnemy);
      
      // Maintain optimal distance and shoot
      const optimalDist = 120;
      
      if (dist > optimalDist + 20) {
        moveTowards(player, nearestEnemy, actions);
      } else if (dist < optimalDist - 20) {
        moveAway(player, nearestEnemy, actions);
      }
      
      // Face and shoot at enemy
      faceTarget(player, nearestEnemy, actions);
      actions.shoot = true;
      
      // Use bomb if surrounded
      if (dist < 60 && gameState.enemies.length >= 3 && gameState.playerBombCount > 0) {
        actions.bomb = true;
      }
      
      return actions;
    }
  }
  
  // Priority 4: Go to exit portal
  if (gameState.roomCleared && gameState.exitPortal && gameState.exitPortal.active) {
    moveTowards(player, gameState.exitPortal, actions);
    return actions;
  }
  
  // Default: Move around
  return getExplorationAction(gameState);
}

function getBasicTestAction(gameState) {
  // Test basic movement and mechanics
  const player = gameState.player;
  if (!player) {
    return getNoAction();
  }
  
  const actions = {
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    shoot: false,
    bomb: false,
    special: false
  };
  
  // Move in a circular pattern
  const time = (gameState.frameCount || 0) * 0.02;
  const targetX = 300 + Math.cos(time) * 100;
  const targetY = 220 + Math.sin(time) * 80;
  
  moveTowards(player, { x: targetX, y: targetY }, actions);
  
  // Shoot occasionally
  if (Math.floor(time * 10) % 20 < 10) {
    actions.shoot = true;
  }
  
  return actions;
}

function getExplorationAction(gameState) {
  const player = gameState.player;
  if (!player) {
    return getNoAction();
  }
  
  const actions = {
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    shoot: false,
    bomb: false,
    special: false
  };
  
  // Move towards center if near edges
  const roomCenterX = 300;
  const roomCenterY = 210;
  
  if (Math.abs(player.x - roomCenterX) > 200 || Math.abs(player.y - roomCenterY) > 120) {
    moveTowards(player, { x: roomCenterX, y: roomCenterY }, actions);
  } else {
    // Random exploration
    const rand = Math.random();
    if (rand < 0.25) actions.moveLeft = true;
    else if (rand < 0.5) actions.moveRight = true;
    else if (rand < 0.75) actions.moveUp = true;
    else actions.moveDown = true;
  }
  
  return actions;
}

function getItemCollectionTestAction(gameState) {
  const player = gameState.player;
  if (!player) {
    return getNoAction();
  }
  
  const actions = {
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    shoot: false,
    bomb: false,
    special: false
  };
  
  // Prioritize collecting all items
  if (gameState.items.length > 0) {
    const nearestItem = findNearest(player, gameState.items);
    moveTowards(player, nearestItem, actions);
    return actions;
  }
  
  if (gameState.hearts.length > 0) {
    const nearestHeart = findNearest(player, gameState.hearts);
    moveTowards(player, nearestHeart, actions);
    return actions;
  }
  
  // If no items, clear enemies to progress
  return getTestWinAction(gameState);
}

function getCombatTestAction(gameState) {
  const player = gameState.player;
  if (!player) {
    return getNoAction();
  }
  
  const actions = {
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    shoot: false,
    bomb: false,
    special: false
  };
  
  // Aggressive combat strategy
  if (gameState.enemies.length > 0) {
    const nearestEnemy = findNearest(player, gameState.enemies);
    const dist = distance(player, nearestEnemy);
    
    // Get closer and shoot aggressively
    if (dist > 80) {
      moveTowards(player, nearestEnemy, actions);
    } else if (dist < 40) {
      moveAway(player, nearestEnemy, actions);
    }
    
    actions.shoot = true;
    
    // Use bombs when multiple enemies nearby
    const nearbyEnemies = gameState.enemies.filter(e => distance(player, e) < 100);
    if (nearbyEnemies.length >= 2 && gameState.playerBombCount > 0) {
      actions.bomb = true;
    }
  }
  
  return actions;
}

function getHealthTestAction(gameState) {
  const player = gameState.player;
  if (!player) {
    return getNoAction();
  }
  
  const actions = {
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    shoot: false,
    bomb: false,
    special: false
  };
  
  // Strategy: Intentionally take damage, then collect hearts
  if (gameState.playerHealth > 2 && gameState.enemies.length > 0) {
    // Move towards enemies to take damage
    const nearestEnemy = findNearest(player, gameState.enemies);
    moveTowards(player, nearestEnemy, actions);
  } else if (gameState.hearts.length > 0) {
    // Collect hearts to heal
    const nearestHeart = findNearest(player, gameState.hearts);
    moveTowards(player, nearestHeart, actions);
  } else {
    // Normal gameplay
    return getTestWinAction(gameState);
  }
  
  return actions;
}

// Helper functions
function findNearest(player, entities) {
  if (entities.length === 0) return null;
  
  let nearest = entities[0];
  let minDist = distance(player, nearest);
  
  for (let i = 1; i < entities.length; i++) {
    const dist = distance(player, entities[i]);
    if (dist < minDist) {
      minDist = dist;
      nearest = entities[i];
    }
  }
  
  return nearest;
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function moveTowards(player, target, actions) {
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 5) actions.moveRight = true;
    else if (dx < -5) actions.moveLeft = true;
  } else {
    if (dy > 5) actions.moveDown = true;
    else if (dy < -5) actions.moveUp = true;
  }
  
  faceTarget(player, target, actions);
}

function moveAway(player, target, actions) {
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) actions.moveLeft = true;
    else actions.moveRight = true;
  } else {
    if (dy > 0) actions.moveUp = true;
    else actions.moveDown = true;
  }
}

function faceTarget(player, target, actions) {
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  
  // Determine which direction to face based on larger difference
  if (Math.abs(dx) > Math.abs(dy)) {
    // Face horizontally
    if (dx > 0) {
      player.facingDirection = 'right';
    } else {
      player.facingDirection = 'left';
    }
  } else {
    // Face vertically
    if (dy > 0) {
      player.facingDirection = 'down';
    } else {
      player.facingDirection = 'up';
    }
  }
}

function getNoAction() {
  return {
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false,
    shoot: false,
    bomb: false,
    special: false
  };
}

function getRandomAction() {
  return {
    moveLeft: Math.random() < 0.2,
    moveRight: Math.random() < 0.2,
    moveUp: Math.random() < 0.2,
    moveDown: Math.random() < 0.2,
    shoot: Math.random() < 0.3,
    bomb: Math.random() < 0.05,
    special: false
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case 'TEST_1':
      return getBasicTestAction(gameState);
    case 'TEST_2':
      return getTestWinAction(gameState);
    case 'TEST_3':
      return getItemCollectionTestAction(gameState);
    case 'TEST_4':
      return getCombatTestAction(gameState);
    case 'TEST_5':
      return getHealthTestAction(gameState);
    default:
      return getRandomAction();
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;