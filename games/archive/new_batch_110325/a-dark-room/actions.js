// actions.js - Game actions

import { gameState, ACTIONS } from './globals.js';
import { canAfford, spendResources, addResource } from './resources.js';

export function executeAction(action, p) {
  if (!canAfford(action)) return false;
  
  spendResources(action);
  
  switch (action) {
    case 'lightFire':
      gameState.fireTemp = Math.min(gameState.maxFireTemp, gameState.fireTemp + 30);
      if (gameState.narrativeStage === 0) {
        gameState.narrativeStage = 1;
      }
      break;
      
    case 'collectWood':
      const woodGained = 5 + Math.floor(Math.random() * 6); // 5-10 wood
      addResource('wood', woodGained);
      break;
      
    case 'buildHut':
      gameState.huts++;
      gameState.maxPopulation += 2;
      unlockNewActions();
      if (gameState.narrativeStage === 1) {
        gameState.narrativeStage = 2;
      }
      break;
      
    case 'buildWorkshop':
      gameState.workshops++;
      unlockNewActions();
      break;
      
    case 'hunt':
      const foodGained = 10 + Math.floor(Math.random() * 11); // 10-20 food
      addResource('food', foodGained);
      break;
      
    case 'trap':
      const trapFood = 5 + Math.floor(Math.random() * 6); // 5-10 food
      const trapFur = 2 + Math.floor(Math.random() * 4); // 2-5 fur
      addResource('food', trapFood);
      addResource('fur', trapFur);
      break;
      
    case 'embark':
      startExpedition();
      break;
  }
  
  return true;
}

function unlockNewActions() {
  // Unlock hunting/trapping with population
  if (gameState.population >= 3) {
    gameState.unlockedActions.add('hunt');
    gameState.unlockedActions.add('trap');
  }
  
  // Unlock building workshop with huts
  if (gameState.huts >= 1) {
    gameState.unlockedActions.add('buildWorkshop');
  }
  
  // Unlock expeditions with village development
  if (gameState.huts >= 2 && gameState.population >= 5) {
    gameState.unlockedActions.add('embark');
  }
}

function startExpedition() {
  gameState.inExpedition = true;
  gameState.expeditionLocation = 'village';
  gameState.expeditionProgress = 0;
  gameState.playerHealth = gameState.maxHealth;
  gameState.supplies = 20;
  gameState.inCombat = false;
  gameState.combatLog = ['You set out on an expedition...'];
  gameState.locationsVisited.add('village');
}

export function getAvailableActions() {
  const available = [];
  
  for (const [key, action] of Object.entries(ACTIONS)) {
    if (gameState.unlockedActions.has(key)) {
      available.push({
        key,
        name: action.name,
        description: action.description,
        canAfford: canAfford(key),
        cost: action.cost
      });
    }
  }
  
  return available;
}