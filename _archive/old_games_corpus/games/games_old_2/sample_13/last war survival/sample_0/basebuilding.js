// basebuilding.js - Base building management

import { gameState } from './globals.js';
import { STRUCTURE_UPGRADE_COST, STRUCTURE_BENEFITS } from './config.js';

export function initBaseBuilding() {
  gameState.selectedStructure = null;
  
  // Generate resources over time
  updateResourceGeneration();
}

export function updateResourceGeneration() {
  const level = gameState.structures.resourceGenerator.level;
  const goldPerSecond = STRUCTURE_BENEFITS.resourceGenerator.goldPerSecond[level];
  const suppliesPerSecond = STRUCTURE_BENEFITS.resourceGenerator.suppliesPerSecond[level];
  
  gameState.resourceTimer++;
  
  if (gameState.resourceTimer >= 60) { // Every second
    gameState.resourceTimer = 0;
    gameState.accumulatedGold += goldPerSecond;
    gameState.accumulatedSupplies += suppliesPerSecond;
  }
}

export function collectResources() {
  if (gameState.accumulatedGold > 0 || gameState.accumulatedSupplies > 0) {
    gameState.gold += Math.floor(gameState.accumulatedGold);
    gameState.supplies += Math.floor(gameState.accumulatedSupplies);
    
    gameState.score += Math.floor(gameState.accumulatedGold) * 5;
    gameState.score += Math.floor(gameState.accumulatedSupplies) * 5;
    
    gameState.accumulatedGold = 0;
    gameState.accumulatedSupplies = 0;
  }
}

export function upgradeStructure(structureName) {
  const structure = gameState.structures[structureName];
  
  if (!structure || structure.level >= structure.maxLevel) {
    return false;
  }
  
  const cost = STRUCTURE_UPGRADE_COST[structureName][structure.level];
  
  if (gameState.gold >= cost) {
    gameState.gold -= cost;
    structure.level++;
    
    // Apply benefits
    if (structureName === 'commandCenter') {
      gameState.maxBaseHP = STRUCTURE_BENEFITS.commandCenter.baseHP[structure.level];
      gameState.baseHP = gameState.maxBaseHP;
    } else if (structureName === 'trainingFacility' && structure.level === 2) {
      // Unlock Engineer
      if (!gameState.unlockedHeroes.includes('ENGINEER')) {
        gameState.unlockedHeroes.push('ENGINEER');
        gameState.heroLevels['ENGINEER'] = 1;
      }
    }
    
    return true;
  }
  
  return false;
}

export function upgradeHero(heroType) {
  const currentLevel = gameState.heroLevels[heroType] || 0;
  
  if (currentLevel === 0) return false;
  
  const cost = 50 + currentLevel * 30;
  
  if (gameState.supplies >= cost) {
    gameState.supplies -= cost;
    gameState.heroLevels[heroType]++;
    return true;
  }
  
  return false;
}