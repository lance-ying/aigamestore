// automated_testing_controller.js - Automated testing AI

import { gameState, TOWER_TYPES, TOWER_TYPE_ARRAY } from './globals.js';

function getTestWinAction(gameState) {
  // Optimal strategy to win
  const hero = gameState.heroes[0];
  
  // Priority 1: Place archer towers at strategic positions early
  if (gameState.towers.length < 4 && gameState.gold >= 70) {
    const bestPlots = [0, 1, 2, 3]; // Front positions
    
    for (let plotIndex of bestPlots) {
      const plot = gameState.towerPlots[plotIndex];
      if (!plot.occupied && gameState.gold >= 70) {
        // Select archer tower (index 0)
        return { keyCode: 49, key: "1", plotIndex: plotIndex, action: "place_archer" };
      }
    }
  }

  // Priority 2: Upgrade existing towers to level 2
  if (gameState.towers.length >= 3) {
    for (let tower of gameState.towers) {
      if (tower.level === 1 && gameState.gold >= 50) {
        gameState.selectedTower = tower;
        return { keyCode: 90, key: "z", action: "upgrade_tower" };
      }
    }
  }

  // Priority 3: Add mage towers for area damage
  if (gameState.towers.length >= 4 && gameState.gold >= 120) {
    for (let i = 4; i < 8; i++) {
      const plot = gameState.towerPlots[i];
      if (!plot.occupied) {
        // Select mage tower (index 1)
        return { keyCode: 50, key: "2", plotIndex: i, action: "place_mage" };
      }
    }
  }

  // Priority 4: Use hero ability when ready and enemies present
  if (gameState.heroAbilityCooldown === 0 && gameState.enemies.length >= 3) {
    return { keyCode: 32, key: " ", action: "hero_ability" };
  }

  // Priority 5: Move hero to defend weak points
  if (gameState.enemies.length > 0 && Math.random() < 0.05) {
    // Move hero toward furthest enemy along path
    let furthestEnemy = null;
    let maxProgress = -1;
    
    for (let enemy of gameState.enemies) {
      if (enemy.pathProgress > maxProgress) {
        furthestEnemy = enemy;
        maxProgress = enemy.pathProgress;
      }
    }
    
    if (furthestEnemy) {
      return { 
        heroTarget: { x: furthestEnemy.x, y: furthestEnemy.y },
        action: "move_hero"
      };
    }
  }

  // Priority 6: Continue upgrading towers
  if (gameState.gold >= 100) {
    for (let tower of gameState.towers) {
      if (tower.level < 3) {
        const cost = tower.getUpgradeCost();
        if (cost && gameState.gold >= cost) {
          gameState.selectedTower = tower;
          return { keyCode: 90, key: "z", action: "upgrade_tower_advanced" };
        }
      }
    }
  }

  return null;
}

function getBasicTestAction(gameState) {
  // Random testing for basic functionality
  const actions = [
    { keyCode: 37, key: "ArrowLeft", weight: 1 },
    { keyCode: 39, key: "ArrowRight", weight: 1 },
    { keyCode: 49, key: "1", weight: 2 },
    { keyCode: 50, key: "2", weight: 2 },
    { keyCode: 32, key: " ", weight: 3 },
    { keyCode: 90, key: "z", weight: 1 },
    { keyCode: 16, key: "Shift", weight: 2 }
  ];

  // Random plot selection for placement
  if (Math.random() < 0.3) {
    const emptyPlots = gameState.towerPlots.filter(p => !p.occupied);
    if (emptyPlots.length > 0) {
      const randomPlot = emptyPlots[Math.floor(Math.random() * emptyPlots.length)];
      const plotIndex = gameState.towerPlots.indexOf(randomPlot);
      return { 
        keyCode: 16, 
        key: "Shift", 
        plotIndex: plotIndex,
        action: "random_place"
      };
    }
  }

  const totalWeight = actions.reduce((sum, a) => sum + a.weight, 0);
  let rand = Math.random() * totalWeight;
  
  for (let action of actions) {
    rand -= action.weight;
    if (rand <= 0) {
      return { keyCode: action.keyCode, key: action.key, action: "random" };
    }
  }

  return null;
}

function getHeroTestAction(gameState) {
  // Focus on hero mechanics
  if (gameState.heroAbilityCooldown === 0 && Math.random() < 0.3) {
    return { keyCode: 32, key: " ", action: "test_hero_ability" };
  }

  if (Math.random() < 0.2 && gameState.path.length > 0) {
    const randomWaypoint = gameState.path[Math.floor(Math.random() * gameState.path.length)];
    return {
      heroTarget: { x: randomWaypoint.x, y: randomWaypoint.y },
      action: "test_hero_movement"
    };
  }

  // Occasionally place towers
  if (gameState.towers.length < 2 && gameState.gold >= 70 && Math.random() < 0.1) {
    const emptyPlots = gameState.towerPlots.filter(p => !p.occupied);
    if (emptyPlots.length > 0) {
      const randomPlot = emptyPlots[Math.floor(Math.random() * emptyPlots.length)];
      const plotIndex = gameState.towerPlots.indexOf(randomPlot);
      return { 
        keyCode: 16, 
        key: "Shift", 
        plotIndex: plotIndex,
        action: "minimal_tower"
      };
    }
  }

  return null;
}

function getUpgradeTestAction(gameState) {
  // Focus on upgrades
  if (gameState.towers.length < 3 && gameState.gold >= 70) {
    const emptyPlots = gameState.towerPlots.filter(p => !p.occupied);
    if (emptyPlots.length > 0) {
      const plotIndex = gameState.towerPlots.indexOf(emptyPlots[0]);
      return { 
        keyCode: 16, 
        key: "Shift", 
        plotIndex: plotIndex,
        action: "place_for_upgrade"
      };
    }
  }

  // Upgrade all towers
  for (let tower of gameState.towers) {
    if (tower.level < 3) {
      const cost = tower.getUpgradeCost();
      if (cost && gameState.gold >= cost) {
        gameState.selectedTower = tower;
        return { keyCode: 90, key: "z", action: "test_upgrade" };
      }
    }
  }

  return null;
}

function getEconomyTestAction(gameState) {
  // Test different spending strategies
  if (gameState.currentWave % 2 === 0) {
    // Even waves: Many cheap towers
    if (gameState.gold >= 70) {
      const emptyPlots = gameState.towerPlots.filter(p => !p.occupied);
      if (emptyPlots.length > 0) {
        const plotIndex = gameState.towerPlots.indexOf(emptyPlots[0]);
        return { 
          keyCode: 16, 
          key: "Shift", 
          plotIndex: plotIndex,
          action: "quantity_strategy"
        };
      }
    }
  } else {
    // Odd waves: Few expensive towers
    if (gameState.towers.length < 3 && gameState.gold >= 160) {
      const emptyPlots = gameState.towerPlots.filter(p => !p.occupied);
      if (emptyPlots.length > 0) {
        // Select cannon (index 2)
        return { 
          keyCode: 51, 
          key: "3", 
          plotIndex: gameState.towerPlots.indexOf(emptyPlots[0]),
          action: "quality_strategy"
        };
      }
    }
  }

  return null;
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== "PLAYING") return null;

  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getHeroTestAction(gameState);
    case "TEST_4":
      return getUpgradeTestAction(gameState);
    case "TEST_5":
      return getEconomyTestAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;