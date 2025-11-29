// transmutation.js
import { gameState } from './globals.js';

export function openTransmutationMenu() {
  gameState.transmutationMenu = true;
  gameState.kilnItems = [];
}

export function closeTransmutationMenu() {
  gameState.transmutationMenu = false;
}

export function addItemToKiln(itemIndex) {
  if (gameState.kilnItems.length < 2 && itemIndex < gameState.inventory.length) {
    const item = gameState.inventory.splice(itemIndex, 1)[0];
    gameState.kilnItems.push(item);
  }
}

export function startTransmutation() {
  if (gameState.kilnItems.length !== 2) return false;
  
  const TRANSMUTATION_RECIPES = [
    { input: [1, 1], output: 2 },
    { input: [2, 2], output: 3 },
    { input: [1, 2], output: 4 },
    { input: [2, 1], output: 4 },
    { input: [3, 3], output: 1 },
    { input: [1, 3], output: 2 }
  ];
  
  const ITEM_DATABASE = [
    { id: 1, name: "Health Potion", type: "consumable", effect: "heal", value: 50 },
    { id: 2, name: "Iron Sword", type: "weapon", effect: "attack", value: 15 },
    { id: 3, name: "Steel Shield", type: "armor", effect: "defense", value: 12 },
    { id: 4, name: "Magic Ring", type: "accessory", effect: "magic", value: 10 }
  ];
  
  const inputIds = gameState.kilnItems.map(item => item.id).sort();
  const recipe = TRANSMUTATION_RECIPES.find(r => {
    const recipeIds = [...r.input].sort();
    return recipeIds[0] === inputIds[0] && recipeIds[1] === inputIds[1];
  });
  
  if (recipe) {
    const outputItem = ITEM_DATABASE.find(i => i.id === recipe.output);
    if (outputItem) {
      gameState.inventory.push({...outputItem});
    }
  } else {
    // Failed transmutation returns a random low-level item
    const failItem = ITEM_DATABASE[0];
    gameState.inventory.push({...failItem});
  }
  
  gameState.kilnItems = [];
  gameState.transmutationMenu = false;
  return true;
}