// automated_testing_controller.js - Automated testing AI

import { gameState, GAME_CONFIG } from './globals.js';
import { canStartNextWave } from './waves.js';

// Test mode behaviors
export function get_automated_testing_action(gs) {
  if (!gs) gs = gameState;
  
  switch (gs.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gs);
    case "TEST_2":
      return getWinTestAction(gs);
    default:
      return null;
  }
}

// TEST_1: Basic functionality test
function getBasicTestAction(gs) {
  // Build 2-3 towers and place Ruby gems
  if (gs.towers.length < 3) {
    // Try to build a tower
    if (gs.mana >= GAME_CONFIG.TOWER_COST) {
      // Find valid build location near path entrance
      const testLocations = [
        { x: 200, y: 240 },
        { x: 200, y: 160 },
        { x: 340, y: 140 }
      ];
      
      for (const loc of testLocations) {
        const gridX = Math.floor(loc.x / gs.gridSize);
        const gridY = Math.floor(loc.y / gs.gridSize);
        
        if (gridX >= 0 && gridX < gs.towerGrid.length &&
            gridY >= 0 && gridY < gs.towerGrid[0].length &&
            gs.towerGrid[gridX][gridY] === null) {
          gs.buildMode = true;
          gs.selectedGemType = 'RUBY';
          return { keyCode: 49 }; // Select Ruby
        }
      }
    }
  }
  
  // Place gems on towers without gems
  for (const tower of gs.towers) {
    if (!tower.gem && gs.mana >= GAME_CONFIG.GEM_BASE_COST) {
      gs.selectedTower = tower;
      gs.selectedGemType = 'RUBY';
      return { keyCode: 32 }; // Space to place gem
    }
  }
  
  // Start waves
  if (canStartNextWave() && gs.currentWave < 3) {
    return { keyCode: 13 }; // Enter to start wave
  }
  
  return null;
}

// TEST_2: Win condition test
function getWinTestAction(gs) {
  // Strategic tower placement
  const strategicLocations = [
    { x: 180, y: 240, priority: 1 },
    { x: 180, y: 160, priority: 2 },
    { x: 140, y: 140, priority: 3 },
    { x: 340, y: 140, priority: 4 },
    { x: 340, y: 260, priority: 5 },
    { x: 380, y: 300, priority: 6 },
    { x: 480, y: 340, priority: 7 },
    { x: 480, y: 260, priority: 8 }
  ];
  
  // Build towers at strategic locations
  if (gs.towers.length < 8 && gs.mana >= GAME_CONFIG.TOWER_COST) {
    for (const loc of strategicLocations) {
      const gridX = Math.floor(loc.x / gs.gridSize);
      const gridY = Math.floor(loc.y / gs.gridSize);
      
      if (gridX >= 0 && gridX < gs.towerGrid.length &&
          gridY >= 0 && gridY < gs.towerGrid[0].length &&
          gs.towerGrid[gridX][gridY] === null) {
        gs.buildMode = true;
        
        // Vary gem types
        if (gs.towers.length % 3 === 0) {
          gs.selectedGemType = 'EMERALD';
          return { keyCode: 51 };
        } else if (gs.towers.length % 3 === 1) {
          gs.selectedGemType = 'SAPPHIRE';
          return { keyCode: 50 };
        } else {
          gs.selectedGemType = 'RUBY';
          return { keyCode: 49 };
        }
      }
    }
  }
  
  // Place gems on empty towers
  for (const tower of gs.towers) {
    if (!tower.gem && gs.mana >= GAME_CONFIG.GEM_BASE_COST) {
      gs.selectedTower = tower;
      
      // Choose gem type based on tower position
      if (gs.towers.indexOf(tower) % 3 === 0) {
        gs.selectedGemType = 'EMERALD';
      } else if (gs.towers.indexOf(tower) % 3 === 1) {
        gs.selectedGemType = 'SAPPHIRE';
      } else {
        gs.selectedGemType = 'RUBY';
      }
      
      return { keyCode: 32 }; // Space
    }
  }
  
  // Upgrade towers with gems
  for (const tower of gs.towers) {
    if (tower.gem && gs.mana >= 20 && tower.level < 3) {
      gs.selectedTower = tower;
      return { keyCode: 16 }; // Shift to upgrade
    }
  }
  
  // Combine gems to create higher tiers
  const gemsWithTowers = gs.gems.filter(gem => gem.tower);
  const gemsByType = {};
  
  for (const gem of gemsWithTowers) {
    if (!gemsByType[gem.type]) {
      gemsByType[gem.type] = [];
    }
    gemsByType[gem.type].push(gem);
  }
  
  // Try to combine same-tier gems
  for (const type in gemsByType) {
    const gems = gemsByType[type];
    const gemsByTier = {};
    
    for (const gem of gems) {
      if (!gemsByTier[gem.tier]) {
        gemsByTier[gem.tier] = [];
      }
      gemsByTier[gem.tier].push(gem);
    }
    
    for (const tier in gemsByTier) {
      if (gemsByTier[tier].length >= 2 && gs.mana >= GAME_CONFIG.GEM_BASE_COST) {
        // Select first gem's tower
        gs.selectedTower = gemsByTier[tier][0].tower;
        return { keyCode: 32 }; // Space to attempt combine
      }
    }
  }
  
  // Send waves early for bonus mana
  if (canStartNextWave() && gs.towers.length >= 4) {
    return { keyCode: 13 }; // Enter
  }
  
  return null;
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;