// castle_manager.js
import { gameState, EQUIPMENT_RECIPES, JOB_TYPES, MATERIAL_TYPES } from './globals.js';
import { Adventurer, CraftingJob } from './entities.js';

export function updateCastleResources(deltaTime) {
  for (let material of MATERIAL_TYPES) {
    gameState.materials[material] += gameState.materialGenerationRate[material] * deltaTime;
  }
}

export function updateCrafting(deltaTime) {
  for (let i = gameState.craftingQueue.length - 1; i >= 0; i--) {
    const job = gameState.craftingQueue[i];
    if (job.update(deltaTime)) {
      // Crafting complete
      const item = {
        name: job.recipe.name,
        atk: job.recipe.atk,
        def: job.recipe.def
      };
      gameState.inventory.push(item);
      gameState.craftingQueue.splice(i, 1);
      gameState.score += 10;
    }
  }
}

export function canCraftRecipe(recipe) {
  for (let material in recipe.cost) {
    if (gameState.materials[material] < recipe.cost[material]) {
      return false;
    }
  }
  return true;
}

export function startCrafting(recipe, instant = false) {
  if (!canCraftRecipe(recipe)) return false;
  
  // Consume materials
  for (let material in recipe.cost) {
    gameState.materials[material] -= recipe.cost[material];
  }
  
  if (instant) {
    const item = {
      name: recipe.name,
      atk: recipe.atk,
      def: recipe.def
    };
    gameState.inventory.push(item);
    gameState.score += 10;
  } else {
    gameState.craftingQueue.push(new CraftingJob(recipe));
  }
  
  return true;
}

export function canRecruitAdventurer(jobType) {
  return gameState.materials.iron >= jobType.cost && 
         gameState.adventurers.length < gameState.maxTeamSize;
}

export function recruitAdventurer(jobType) {
  if (!canRecruitAdventurer(jobType)) return false;
  
  gameState.materials.iron -= jobType.cost;
  const id = gameState.adventurers.length;
  const adventurer = new Adventurer(jobType, id);
  gameState.adventurers.push(adventurer);
  gameState.score += 20;
  
  return true;
}

export function equipItemToAdventurer(adventurerIndex, itemIndex) {
  if (adventurerIndex >= gameState.adventurers.length || 
      itemIndex >= gameState.inventory.length) return false;
  
  const adventurer = gameState.adventurers[adventurerIndex];
  const item = gameState.inventory[itemIndex];
  
  adventurer.equipItem(item);
  gameState.inventory.splice(itemIndex, 1);
  
  return true;
}