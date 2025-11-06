// automated_testing_controller.js - Automated testing AI

import { gameState } from './globals.js';

function getTestBasicAction(gameState) {
  if (!gameState.player || gameState.enemies.length === 0) {
    return { keyCode: 39 }; // Move right
  }
  
  const player = gameState.player;
  const nearestEnemy = findNearestEnemy(player);
  
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    
    if (Math.abs(dx) > 50) {
      return dx > 0 ? { keyCode: 39 } : { keyCode: 37 }; // Move towards enemy
    } else {
      return { keyCode: 0 }; // Stay and attack
    }
  }
  
  return { keyCode: 39 }; // Default: move right
}

function getTestWinAction(gameState) {
  if (!gameState.player) {
    return { keyCode: 0 };
  }
  
  const player = gameState.player;
  
  // Check for merchant interaction
  if (gameState.merchant && gameState.merchant.isPlayerNearby() && !gameState.shopOpen) {
    return { keyCode: 32 }; // Open shop
  }
  
  // Shop logic
  if (gameState.shopOpen) {
    return handleShopPurchase(gameState);
  }
  
  // Combat strategy
  if (gameState.enemies.length > 0) {
    return getOptimalCombatPosition(gameState);
  }
  
  // Default: patrol center-left area
  if (player.x < 200) {
    return { keyCode: 39 }; // Move right
  } else if (player.x > 250) {
    return { keyCode: 37 }; // Move left
  }
  
  return { keyCode: 0 };
}

function handleShopPurchase(gameState) {
  const SHOP_ITEMS = [
    { name: "Health Potion", cost: 30 },
    { name: "Sword +1", cost: 50 },
    { name: "Armor +1", cost: 50 },
    { name: "Speed Boots", cost: 40 },
    { name: "Max Health +1", cost: 60 }
  ];
  
  // Priority: Health if low, then damage, then armor
  const player = gameState.player;
  const healthPercent = player.health / player.maxHealth;
  
  if (healthPercent < 0.5 && gameState.coins >= 30) {
    gameState.selectedShopItem = 0; // Health potion
    return { keyCode: 32 }; // Purchase
  } else if (gameState.coins >= 50) {
    gameState.selectedShopItem = 1; // Sword
    return { keyCode: 32 }; // Purchase
  } else if (gameState.coins >= 50) {
    gameState.selectedShopItem = 2; // Armor
    return { keyCode: 32 }; // Purchase
  }
  
  return { keyCode: 27 }; // Close shop if can't afford anything
}

function getOptimalCombatPosition(gameState) {
  const player = gameState.player;
  const enemies = gameState.enemies;
  
  // Find weakest enemy in range
  const weakestEnemy = findWeakestEnemy(player, 100);
  
  if (weakestEnemy) {
    const dx = weakestEnemy.x - player.x;
    const distance = Math.abs(dx);
    
    // Maintain optimal distance for attacking
    if (distance < 30) {
      return dx > 0 ? { keyCode: 37 } : { keyCode: 39 }; // Back away slightly
    } else if (distance > 50) {
      return dx > 0 ? { keyCode: 39 } : { keyCode: 37 }; // Move closer
    } else {
      return { keyCode: 0 }; // Perfect range, let auto-attack work
    }
  }
  
  // If overwhelmed, retreat to center
  const enemiesNearby = enemies.filter(e => Math.abs(e.x - player.x) < 100).length;
  
  if (enemiesNearby > 3) {
    // Retreat towards center
    if (player.x < 250) {
      return { keyCode: 39 };
    } else if (player.x > 350) {
      return { keyCode: 37 };
    }
  }
  
  // Default: move towards nearest enemy
  const nearestEnemy = findNearestEnemy(player);
  if (nearestEnemy) {
    const dx = nearestEnemy.x - player.x;
    return dx > 0 ? { keyCode: 39 } : { keyCode: 37 };
  }
  
  return { keyCode: 0 };
}

function getTestMerchantAction(gameState) {
  if (!gameState.player) {
    return { keyCode: 0 };
  }
  
  const player = gameState.player;
  
  // Move towards merchant if present
  if (gameState.merchant) {
    const dx = gameState.merchant.x - player.x;
    
    if (Math.abs(dx) > 40) {
      return dx > 0 ? { keyCode: 39 } : { keyCode: 37 };
    } else {
      return { keyCode: 32 }; // Interact with merchant
    }
  }
  
  // Otherwise, fight enemies to earn coins
  if (gameState.enemies.length > 0) {
    return getOptimalCombatPosition(gameState);
  }
  
  // Wait in center
  if (player.x < 280) {
    return { keyCode: 39 };
  } else if (player.x > 320) {
    return { keyCode: 37 };
  }
  
  return { keyCode: 0 };
}

function findNearestEnemy(player) {
  if (!gameState.enemies || gameState.enemies.length === 0) return null;
  
  let nearest = null;
  let minDistance = Infinity;
  
  gameState.enemies.forEach(enemy => {
    const distance = Math.abs(enemy.x - player.x);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = enemy;
    }
  });
  
  return nearest;
}

function findWeakestEnemy(player, maxDistance) {
  if (!gameState.enemies || gameState.enemies.length === 0) return null;
  
  let weakest = null;
  let minHealth = Infinity;
  
  gameState.enemies.forEach(enemy => {
    const distance = Math.abs(enemy.x - player.x);
    if (distance < maxDistance && enemy.health < minHealth) {
      minHealth = enemy.health;
      weakest = enemy;
    }
  });
  
  return weakest;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestMerchantAction(gameState);
    default:
      return { keyCode: 0 };
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;