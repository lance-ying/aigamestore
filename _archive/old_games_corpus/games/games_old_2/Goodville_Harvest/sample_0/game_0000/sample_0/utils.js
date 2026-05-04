import { gameState } from './globals.js';

export function addToInventory(item, quantity = 1) {
  if (!gameState.inventory[item]) {
    gameState.inventory[item] = 0;
  }
  gameState.inventory[item] += quantity;
}

export function removeFromInventory(item, quantity = 1) {
  if (gameState.inventory[item] && gameState.inventory[item] >= quantity) {
    gameState.inventory[item] -= quantity;
    return true;
  }
  return false;
}

export function hasItems(requirements) {
  for (const [item, quantity] of Object.entries(requirements)) {
    if (item === 'coins') {
      if (gameState.coins < quantity) return false;
    } else if (item === 'totalValue') {
      const totalValue = gameState.coins + Object.entries(gameState.inventory).reduce((sum, [k, v]) => sum + v * 5, 0);
      if (totalValue < quantity) return false;
    } else {
      if (!gameState.inventory[item] || gameState.inventory[item] < quantity) return false;
    }
  }
  return true;
}

export function consumeItems(requirements) {
  for (const [item, quantity] of Object.entries(requirements)) {
    if (item === 'coins') {
      gameState.coins -= quantity;
    } else if (item !== 'totalValue') {
      removeFromInventory(item, quantity);
    }
  }
}

export function addScore(points) {
  gameState.score += points;
}

export function addCoins(amount) {
  gameState.coins += amount;
  gameState.lastEarningAction = gameState.actionCount;
}

export function addXP(amount) {
  gameState.xp += amount;
  checkLevelUp();
}

export function checkLevelUp() {
  const xpNeeded = gameState.level * 1000;
  if (gameState.xp >= xpNeeded && gameState.level < 5) {
    gameState.level++;
    gameState.xp = 0;
  }
}

export function getSpeedModifier() {
  const modifiers = [1.0, 0.9, 0.8, 0.7, 0.6];
  return modifiers[gameState.level - 1] || 0.6;
}