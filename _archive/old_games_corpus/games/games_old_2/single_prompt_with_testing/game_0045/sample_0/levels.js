// levels.js - Level definitions and management

import { gameState } from './globals.js';
import { Cup, ColorFilter } from './entities.js';

export function initializeLevel(p, levelNumber) {
  // Clear existing level objects
  gameState.cups.forEach(cup => cup.destroy());
  gameState.colorFilters.forEach(filter => filter.destroy());
  gameState.cups = [];
  gameState.colorFilters = [];
  
  // Level configurations
  const levelConfigs = {
    1: {
      cups: [
        { x: 300, y: 350, width: 80, height: 60, target: 30, color: null }
      ],
      filters: [],
      maxSugar: 50,
      linesBudget: 200
    },
    2: {
      cups: [
        { x: 200, y: 350, width: 70, height: 60, target: 25, color: null },
        { x: 400, y: 350, width: 70, height: 60, target: 25, color: null }
      ],
      filters: [],
      maxSugar: 80,
      linesBudget: 250
    },
    3: {
      cups: [
        { x: 150, y: 350, width: 60, height: 50, target: 20, color: [255, 100, 100] },
        { x: 450, y: 350, width: 60, height: 50, target: 20, color: [100, 100, 255] }
      ],
      filters: [
        { x: 200, y: 200, width: 60, height: 80, color: [255, 100, 100] },
        { x: 400, y: 200, width: 60, height: 80, color: [100, 100, 255] }
      ],
      maxSugar: 70,
      linesBudget: 300
    },
    4: {
      cups: [
        { x: 100, y: 350, width: 60, height: 60, target: 15, color: null },
        { x: 300, y: 350, width: 60, height: 60, target: 20, color: [100, 255, 100] },
        { x: 500, y: 350, width: 60, height: 60, target: 15, color: null }
      ],
      filters: [
        { x: 300, y: 180, width: 70, height: 90, color: [100, 255, 100] }
      ],
      maxSugar: 90,
      linesBudget: 350
    }
  };
  
  // Get config for current level (cycle through levels)
  const configKey = ((levelNumber - 1) % 4) + 1;
  const config = levelConfigs[configKey];
  
  // Create cups
  config.cups.forEach(cupData => {
    const cup = new Cup(
      p,
      cupData.x,
      cupData.y,
      cupData.width,
      cupData.height,
      cupData.target,
      cupData.color
    );
    gameState.cups.push(cup);
    gameState.entities.push(cup);
  });
  
  // Create color filters
  config.filters.forEach(filterData => {
    const filter = new ColorFilter(
      p,
      filterData.x,
      filterData.y,
      filterData.width,
      filterData.height,
      filterData.color
    );
    gameState.colorFilters.push(filter);
    gameState.entities.push(filter);
  });
  
  // Set level parameters
  gameState.maxSugarPerLevel = config.maxSugar;
  gameState.lineDrawingBudget = config.linesBudget;
}

export function checkLevelComplete() {
  // Check if all cups are filled
  const allFilled = gameState.cups.every(cup => cup.isFilled());
  
  if (allFilled) {
    return 'win';
  }
  
  // Check if sugar is depleted and cups not filled
  if (!gameState.sugarSource.active && gameState.totalSugarProduced >= gameState.maxSugarPerLevel) {
    // Wait for all particles to settle or be collected
    const activeParticles = gameState.sugarParticles.filter(p => p.active).length;
    if (activeParticles === 0) {
      return 'lose';
    }
  }
  
  return 'playing';
}