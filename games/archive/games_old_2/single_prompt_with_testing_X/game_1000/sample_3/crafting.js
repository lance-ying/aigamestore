import { gameState, CRAFTING_RECIPES } from './globals.js';

export function canCraft(recipe) {
  if (!gameState.unlockedRecipes.includes(recipe)) {
    return false;
  }
  
  const requirements = CRAFTING_RECIPES[recipe];
  if (!requirements) return false;
  
  for (const [item, amount] of Object.entries(requirements)) {
    if (!gameState.playerInventory[item] || gameState.playerInventory[item] < amount) {
      return false;
    }
  }
  
  return true;
}

export function craftItem(recipe) {
  if (!canCraft(recipe)) return false;
  
  const requirements = CRAFTING_RECIPES[recipe];
  
  // Remove materials
  for (const [item, amount] of Object.entries(requirements)) {
    gameState.playerInventory[item] -= amount;
  }
  
  // Add crafted item
  if (!gameState.playerInventory[recipe]) {
    gameState.playerInventory[recipe] = 0;
  }
  gameState.playerInventory[recipe]++;
  
  // Equip if tool/weapon/armor
  if (recipe.includes("pickaxe")) {
    gameState.player.equippedTool = recipe;
  } else if (recipe.includes("sword")) {
    gameState.player.equippedWeapon = recipe;
  } else if (recipe.includes("armor")) {
    gameState.player.equippedArmor = recipe;
  }
  
  gameState.score += 50;
  
  return true;
}

export function getAvailableRecipes() {
  return gameState.unlockedRecipes.filter(recipe => CRAFTING_RECIPES[recipe]);
}