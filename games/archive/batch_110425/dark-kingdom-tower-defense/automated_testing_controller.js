// automated_testing_controller.js - Automated testing strategies

import { gameState, TOWER_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player) return { move: {} };
  
  const player = gameState.player;
  
  // Priority 1: Upgrade existing towers if we have gold
  if (gameState.selectedTower && gameState.gold >= 100) {
    const upgradeCost = gameState.selectedTower.getUpgradeCost();
    if (upgradeCost && gameState.gold >= upgradeCost) {
      return { upgradeTower: true };
    }
  }
  
  // Priority 2: Place towers at strategic locations
  if (gameState.towers.length < 8 && gameState.gold >= 70) {
    // Find best placement location (closest to path middle)
    let bestLocation = null;
    let bestScore = -Infinity;
    
    for (const loc of gameState.validPlacementLocations) {
      // Check if occupied
      let occupied = false;
      for (const tower of gameState.towers) {
        if (Math.hypot(tower.x - loc.x, tower.y - loc.y) < 10) {
          occupied = true;
          break;
        }
      }
      
      if (!occupied) {
        // Score based on distance from player and path coverage
        const distToPlayer = Math.hypot(loc.x - player.x, loc.y - player.y);
        const pathCoverage = calculatePathCoverage(loc, gameState.path);
        const score = pathCoverage * 100 - distToPlayer;
        
        if (score > bestScore) {
          bestScore = score;
          bestLocation = loc;
        }
      }
    }
    
    if (bestLocation) {
      const distToLocation = Math.hypot(player.x - bestLocation.x, player.y - bestLocation.y);
      
      if (distToLocation < 35) {
        // We're close enough - place tower
        gameState.selectedTowerType = selectBestTowerType(gameState);
        return { placeOrSelectTower: true };
      } else {
        // Move towards location
        return {
          move: {
            left: player.x > bestLocation.x,
            right: player.x < bestLocation.x,
            up: player.y > bestLocation.y,
            down: player.y < bestLocation.y
          }
        };
      }
    }
  }
  
  // Priority 3: Select towers near us for upgrades
  if (!gameState.selectedTower) {
    for (const tower of gameState.towers) {
      const dist = Math.hypot(tower.x - player.x, tower.y - player.y);
      if (dist < 35 && tower.tier < 3 && gameState.gold >= 80) {
        return { placeOrSelectTower: true };
      }
    }
  }
  
  // Priority 4: Use hero ability when enemies are near
  if (gameState.player.abilityReady && gameState.enemies.length > 5) {
    let enemiesNearby = 0;
    for (const enemy of gameState.enemies) {
      if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < 120) {
        enemiesNearby++;
      }
    }
    if (enemiesNearby >= 3) {
      return { upgradeTower: true }; // Z key also triggers hero ability
    }
  }
  
  // Priority 5: Move towards center of action
  const targetX = CANVAS_WIDTH / 2;
  const targetY = CANVAS_HEIGHT / 2;
  
  return {
    move: {
      left: player.x > targetX + 20,
      right: player.x < targetX - 20,
      up: player.y > targetY + 20,
      down: player.y < targetY - 20
    }
  };
}

function getTestBasicAction(gameState) {
  if (!gameState.player) return { move: {} };
  
  const player = gameState.player;
  
  // Simple strategy: place a few towers and let them do the work
  if (gameState.towers.length < 4 && gameState.gold >= 70) {
    // Find nearest valid location
    let nearest = null;
    let nearestDist = Infinity;
    
    for (const loc of gameState.validPlacementLocations) {
      let occupied = false;
      for (const tower of gameState.towers) {
        if (Math.hypot(tower.x - loc.x, tower.y - loc.y) < 10) {
          occupied = true;
          break;
        }
      }
      
      if (!occupied) {
        const dist = Math.hypot(loc.x - player.x, loc.y - player.y);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = loc;
        }
      }
    }
    
    if (nearest) {
      if (nearestDist < 35) {
        return { placeOrSelectTower: true };
      } else {
        return {
          move: {
            left: player.x > nearest.x,
            right: player.x < nearest.x,
            up: player.y > nearest.y,
            down: player.y < nearest.y
          }
        };
      }
    }
  }
  
  // Random movement
  const angle = Math.random() * Math.PI * 2;
  return {
    move: {
      left: Math.cos(angle) < -0.3,
      right: Math.cos(angle) > 0.3,
      up: Math.sin(angle) < -0.3,
      down: Math.sin(angle) > 0.3
    }
  };
}

function getTestHeroAction(gameState) {
  if (!gameState.player) return { move: {} };
  
  const player = gameState.player;
  
  // Move towards enemies
  if (gameState.enemies.length > 0) {
    const target = gameState.enemies[0];
    const dist = Math.hypot(target.x - player.x, target.y - player.y);
    
    if (dist > player.attackRange - 10) {
      return {
        move: {
          left: player.x > target.x,
          right: player.x < target.x,
          up: player.y > target.y,
          down: player.y < target.y
        }
      };
    }
  }
  
  // Patrol path
  const pathMid = Math.floor(gameState.path.length / 2);
  const target = gameState.path[pathMid];
  
  return {
    move: {
      left: player.x > target.x + 20,
      right: player.x < target.x - 20,
      up: player.y > target.y + 20,
      down: player.y < target.y - 20
    }
  };
}

function getTestUpgradeAction(gameState) {
  if (!gameState.player) return { move: {} };
  
  const player = gameState.player;
  
  // Place initial towers
  if (gameState.towers.length < 3 && gameState.gold >= 70) {
    return getTestBasicAction(gameState);
  }
  
  // Upgrade towers
  if (gameState.gold >= 100) {
    // Find tower to upgrade
    for (const tower of gameState.towers) {
      const dist = Math.hypot(tower.x - player.x, tower.y - player.y);
      
      if (tower.tier < 3) {
        if (dist < 35) {
          if (!gameState.selectedTower || gameState.selectedTower !== tower) {
            return { placeOrSelectTower: true };
          } else {
            return { upgradeTower: true };
          }
        } else {
          return {
            move: {
              left: player.x > tower.x,
              right: player.x < tower.x,
              up: player.y > tower.y,
              down: player.y < tower.y
            }
          };
        }
      }
    }
  }
  
  return { move: {} };
}

function getTestEconomyAction(gameState) {
  // Balance between placing towers and saving for upgrades
  const targetTowers = Math.min(6, Math.floor(gameState.currentWave * 1.5) + 2);
  
  if (gameState.towers.length < targetTowers && gameState.gold >= 70) {
    return getTestWinAction(gameState);
  }
  
  if (gameState.gold >= 150) {
    return getTestUpgradeAction(gameState);
  }
  
  return { move: {} };
}

function calculatePathCoverage(location, path) {
  let coverage = 0;
  const range = 100;
  
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    
    const dist = Math.hypot(midX - location.x, midY - location.y);
    if (dist < range) {
      coverage += (1 - dist / range);
    }
  }
  
  return coverage;
}

function selectBestTowerType(gameState) {
  const wave = gameState.currentWave;
  
  if (wave <= 3) {
    return "ARROW"; // Early game: cheap and effective
  } else if (wave <= 6) {
    // Mid game: mix of magic and cannon
    return gameState.towers.length % 2 === 0 ? "MAGIC" : "CANNON";
  } else {
    // Late game: frost and cannon for control
    return gameState.towers.length % 2 === 0 ? "FROST" : "CANNON";
  }
}

function getRandomAction(gameState) {
  const actions = ["move", "place", "upgrade", "nothing"];
  const choice = actions[Math.floor(Math.random() * actions.length)];
  
  switch (choice) {
    case "move":
      return {
        move: {
          left: Math.random() > 0.5,
          right: Math.random() > 0.5,
          up: Math.random() > 0.5,
          down: Math.random() > 0.5
        }
      };
    case "place":
      return { placeOrSelectTower: Math.random() > 0.5 };
    case "upgrade":
      return { upgradeTower: Math.random() > 0.5 };
    default:
      return { move: {} };
  }
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestHeroAction(gameState);
    case "TEST_4":
      return getTestUpgradeAction(gameState);
    case "TEST_5":
      return getTestEconomyAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;