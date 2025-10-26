// progression.js - Level and progression management

import { gameState, LEVEL_CONFIG, XP_PER_LEVEL, GAME_PHASES } from './globals.js';

export function initializeLevel(gameState, levelNum) {
  const config = LEVEL_CONFIG[levelNum];
  if (!config) return;
  
  gameState.currentLevel = levelNum;
  gameState.levelObjectives = JSON.parse(JSON.stringify(config.objectives));
  gameState.completedObjectives = [];
}

export function checkObjectives(gameState) {
  let allCompleted = true;
  
  for (const objective of gameState.levelObjectives) {
    if (!objective.completed) {
      let completed = false;
      
      switch (objective.type) {
        case 'harvest':
        case 'collect':
          if (gameState.resources[objective.resource] >= objective.amount) {
            completed = true;
          }
          break;
        case 'produce':
          // Check if we've produced enough
          // This is simplified - in reality we'd track production separately
          if (gameState.resources[objective.resource] >= objective.amount) {
            completed = true;
          }
          break;
        case 'build':
          // Check if building exists
          const hasBuilding = gameState.buildings.some(b => b.type === objective.building);
          if (hasBuilding) {
            completed = true;
          }
          break;
        case 'score':
          if (gameState.score >= objective.amount) {
            completed = true;
          }
          break;
      }
      
      if (completed && !objective.completed) {
        objective.completed = true;
        gameState.playerGold += objective.reward;
        gameState.score += objective.reward;
        addXP(gameState, 50);
      }
      
      if (!completed) {
        allCompleted = false;
      }
    }
  }
  
  return allCompleted;
}

export function advanceLevel(gameState) {
  // Award level completion bonus
  gameState.score += 1000;
  addXP(gameState, 100);
  
  if (gameState.currentLevel >= 5) {
    // Win!
    return 'WIN';
  } else {
    // Next level
    initializeLevel(gameState, gameState.currentLevel + 1);
    return 'CONTINUE';
  }
}

export function addXP(gameState, amount) {
  gameState.playerXP += amount;
  
  // Check for level up
  if (gameState.playerLevel < XP_PER_LEVEL.length - 1) {
    const nextLevelXP = XP_PER_LEVEL[gameState.playerLevel];
    if (gameState.playerXP >= nextLevelXP) {
      gameState.playerLevel++;
      gameState.score += 250; // Level up bonus
    }
  }
}

export function addScore(gameState, points) {
  gameState.score += points;
}