// level.js - Level management

import { LEVELS, gameState, FRUIT_TIERS } from './globals.js';

export class LevelManager {
  constructor(p) {
    this.p = p;
    this.currentLevelData = null;
  }

  startLevel(levelIndex) {
    gameState.currentLevel = levelIndex;
    this.currentLevelData = LEVELS[levelIndex];
    gameState.fusionCount = 0;
    
    // Set target fusion tier for level-specific goals
    if (levelIndex === 1) {
      gameState.targetFusionTier = 3; // Orange
    } else if (levelIndex === 2) {
      gameState.targetFusionTier = 6; // Pineapple
    } else if (levelIndex === 3) {
      gameState.targetFusionTier = 7; // Watermelon
    }
  }

  getLevelData() {
    return this.currentLevelData;
  }

  getRandomFruitTier() {
    const availableFruits = this.currentLevelData.availableFruits;
    
    // Special case for level 4 - 5% chance for watermelon helper
    if (gameState.currentLevel === 3 && this.p.random() < 0.05) {
      return 7; // Watermelon
    }
    
    // Weight towards larger fruits in later levels
    if (gameState.currentLevel >= 2) {
      const weights = availableFruits.map((tier, i) => i + 1);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let random = this.p.random(totalWeight);
      
      for (let i = 0; i < availableFruits.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          return availableFruits[i];
        }
      }
    }
    
    return this.p.random(availableFruits);
  }

  checkLevelComplete() {
    const levelData = this.currentLevelData;
    
    // Check for Watermelon creation (ultimate win)
    if (gameState.currentLevel === 3) {
      const hasWatermelon = gameState.fruits.some(f => f.tier === 7);
      if (hasWatermelon) {
        return 'WIN';
      }
    }
    
    // Check score goal
    if (gameState.score >= levelData.scoreGoal) {
      return 'LEVEL_COMPLETE';
    }
    
    // Check fusion goal (level-specific)
    if (gameState.currentLevel === 1 && gameState.fusionCount >= levelData.fusionGoal) {
      return 'LEVEL_COMPLETE';
    }
    
    if (gameState.currentLevel === 2) {
      // Count Orange fusions
      const orangeFusions = gameState.entities.filter(e => 
        e.type === 'fusion' && e.tier === 3
      ).length;
      if (orangeFusions >= levelData.fusionGoal) {
        return 'LEVEL_COMPLETE';
      }
    }
    
    if (gameState.currentLevel === 3) {
      // Count Pineapple fusions
      const pineappleFusions = gameState.entities.filter(e => 
        e.type === 'fusion' && e.tier === 6
      ).length;
      if (pineappleFusions >= levelData.fusionGoal) {
        return 'LEVEL_COMPLETE';
      }
    }
    
    return null;
  }

  getLoseLineY() {
    return this.currentLevelData.loseLineY;
  }
}