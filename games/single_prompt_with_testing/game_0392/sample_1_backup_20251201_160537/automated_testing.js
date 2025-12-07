// automated_testing.js - Automated testing controller

import { gameState, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_SPACE, KEY_Z } from './globals.js';

function getTestBasicAction(gameState) {
  if (!gameState.player) return null;
  
  // Test basic movement and shooting
  const actions = [
    { keyCode: KEY_LEFT },
    { keyCode: KEY_RIGHT },
    { keyCode: KEY_UP },
    { keyCode: KEY_DOWN },
    { keyCode: KEY_Z }
  ];
  
  // Cycle through actions
  const actionIndex = Math.floor(gameState.frameCount / 30) % actions.length;
  return actions[actionIndex];
}

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  // Priority 1: Dodge bullets
  let closestBullet = null;
  let closestDist = Infinity;
  
  gameState.bullets.forEach(bullet => {
    const dist = Math.sqrt(
      Math.pow(gameState.player.x - bullet.x, 2) +
      Math.pow(gameState.player.y - bullet.y, 2)
    );
    if (dist < closestDist) {
      closestDist = dist;
      closestBullet = bullet;
    }
  });
  
  // If bullet is close, dodge
  if (closestBullet && closestDist < 50) {
    const dx = gameState.player.x - closestBullet.x;
    const dy = gameState.player.y - closestBullet.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
    } else {
      return dy > 0 ? { keyCode: KEY_DOWN } : { keyCode: KEY_UP };
    }
  }
  
  // Priority 2: Collect bentler items
  if (gameState.bentlerItems.length > 0) {
    const nearest = gameState.bentlerItems.reduce((closest, item) => {
      const dist1 = Math.sqrt(
        Math.pow(gameState.player.x - closest.x, 2) +
        Math.pow(gameState.player.y - closest.y, 2)
      );
      const dist2 = Math.sqrt(
        Math.pow(gameState.player.x - item.x, 2) +
        Math.pow(gameState.player.y - item.y, 2)
      );
      return dist1 < dist2 ? closest : item;
    });
    
    const dx = nearest.x - gameState.player.x;
    const dy = nearest.y - gameState.player.y;
    
    if (Math.abs(dx) > 20) {
      return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
    } else if (Math.abs(dy) > 20) {
      return dy > 0 ? { keyCode: KEY_DOWN } : { keyCode: KEY_UP };
    }
  }
  
  // Priority 3: Collect power items
  if (gameState.collectibles.length > 0) {
    const nearest = gameState.collectibles[0];
    const dx = nearest.x - gameState.player.x;
    const dy = nearest.y - gameState.player.y;
    
    if (Math.abs(dx) > 20) {
      return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
    } else if (Math.abs(dy) > 20) {
      return dy > 0 ? { keyCode: KEY_DOWN } : { keyCode: KEY_UP };
    }
  }
  
  // Always shoot
  if (gameState.frameCount % 2 === 0) {
    return { keyCode: KEY_Z };
  }
  
  // Default: move up
  return { keyCode: KEY_UP };
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

window.get_automated_testing_action = get_automated_testing_action;