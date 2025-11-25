// brewing.js - Brewing system

import { gameState, PLAY_PHASES, INGREDIENT_TYPES } from './globals.js';
import { Potion } from './entities.js';

export function startBrewing() {
  gameState.playPhase = PLAY_PHASES.BREWING;
  gameState.brewingSlots = [null, null, null];
  gameState.selectedSlot = 0;
  gameState.selectedIngredientType = null;
}

export function selectIngredientForSlot(ingredientType) {
  const ingredient = gameState.ingredients.find(i => i.type === ingredientType && i.count > 0);
  if (!ingredient) return false;
  
  const currentSlot = gameState.brewingSlots[gameState.selectedSlot];
  if (currentSlot) {
    // Return ingredient to inventory
    const invIng = gameState.ingredients.find(i => i.type === currentSlot.type && i.level === currentSlot.level);
    if (invIng) invIng.count++;
  }
  
  // Place new ingredient
  gameState.brewingSlots[gameState.selectedSlot] = {
    type: ingredient.type,
    level: ingredient.level
  };
  ingredient.count--;
  
  return true;
}

export function canBrewPotion() {
  return gameState.brewingSlots.every(slot => slot !== null);
}

export function brewPotion() {
  if (!canBrewPotion()) return null;
  
  const ingredients = gameState.brewingSlots.map(slot => {
    const ing = gameState.ingredients.find(i => i.type === slot.type && i.level === slot.level);
    return { type: slot.type, level: slot.level, baseValue: INGREDIENT_TYPES[slot.type].baseValue, getColor: () => INGREDIENT_TYPES[slot.type].color, getValue: () => INGREDIENT_TYPES[slot.type].baseValue * slot.level, getName: () => `${INGREDIENT_TYPES[slot.type].name} Lv${slot.level}` };
  });
  
  const potion = new Potion(ingredients);
  gameState.potions.push(potion);
  gameState.brewingSlots = [null, null, null];
  gameState.selectedSlot = 0;
  gameState.potionsBrewed++;
  
  return potion;
}

export function cancelBrewing() {
  // Return all ingredients to inventory
  for (const slot of gameState.brewingSlots) {
    if (slot) {
      const ing = gameState.ingredients.find(i => i.type === slot.type && i.level === slot.level);
      if (ing) ing.count++;
    }
  }
  gameState.brewingSlots = [null, null, null];
  gameState.playPhase = PLAY_PHASES.SHOP_MENU;
}

export function upgradeIngredient(ingredientType) {
  const ing = gameState.ingredients.find(i => i.type === ingredientType);
  if (!ing) return false;
  
  const upgradeCost = ing.level * 30;
  if (gameState.gold < upgradeCost) return false;
  
  gameState.gold -= upgradeCost;
  ing.level++;
  return true;
}

export function buyIngredients(ingredientType, count) {
  const ing = gameState.ingredients.find(i => i.type === ingredientType);
  if (!ing) return false;
  
  const cost = INGREDIENT_TYPES[ingredientType].baseValue * count;
  if (gameState.gold < cost) return false;
  
  gameState.gold -= cost;
  ing.count += count;
  return true;
}