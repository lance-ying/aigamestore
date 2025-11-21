// resources.js - Resource management

import { gameState, ACTIONS } from './globals.js';

export function canAfford(action) {
  const actionDef = ACTIONS[action];
  if (!actionDef || !actionDef.cost) return true;
  
  for (const [resource, amount] of Object.entries(actionDef.cost)) {
    if (gameState[resource] < amount) return false;
  }
  return true;
}

export function spendResources(action) {
  const actionDef = ACTIONS[action];
  if (!actionDef || !actionDef.cost) return;
  
  for (const [resource, amount] of Object.entries(actionDef.cost)) {
    gameState[resource] -= amount;
  }
}

export function addResource(resource, amount) {
  gameState[resource] = Math.max(0, gameState[resource] + amount);
}

export function updateAutomatedResources(p) {
  // Workshops generate wood
  if (gameState.workshops > 0) {
    const woodPerSecond = gameState.workshops * 1;
    const framesPerWood = 60 / woodPerSecond;
    
    if (p.frameCount - gameState.lastWoodGatherFrame >= framesPerWood) {
      addResource('wood', 1);
      gameState.lastWoodGatherFrame = p.frameCount;
    }
  }
}

export function updateFire(p) {
  // Fire decays over time
  if (p.frameCount - gameState.lastFireDecayFrame >= 60) {
    gameState.fireTemp = Math.max(0, gameState.fireTemp - 1);
    gameState.lastFireDecayFrame = p.frameCount;
  }
  
  // Check for new wanderers
  if (p.frameCount - gameState.lastPopulationCheckFrame >= 120) {
    if (gameState.fireTemp > 50 && gameState.population < gameState.maxPopulation) {
      if (Math.random() < 0.3) {
        gameState.population++;
      }
    }
    gameState.lastPopulationCheckFrame = p.frameCount;
  }
}