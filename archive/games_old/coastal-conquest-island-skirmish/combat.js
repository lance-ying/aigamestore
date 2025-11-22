// combat.js - Combat and movement logic

import { gameState, UNIT_CONFIGS } from './globals.js';
import { getGridDistance, isValidPosition } from './map.js';
import { Projectile } from './entities.js';
import { Unit } from './entities.js';

export function startCombatPhase() {
  gameState.combatPhase = true;
  gameState.turnCount++;
  
  // Reset unit actions
  gameState.playerUnits.forEach(unit => {
    unit.hasMoved = false;
    unit.hasAttacked = false;
  });
  
  gameState.enemyUnits.forEach(unit => {
    unit.hasMoved = false;
    unit.hasAttacked = false;
  });
  
  // Execute combat in phases
  setTimeout(() => moveUnits(), 100);
}

function moveUnits() {
  // Move player units
  gameState.playerUnits.forEach(unit => {
    if (!unit.hasMoved) {
      moveUnitTowardsTarget(unit);
      unit.hasMoved = true;
    }
  });
  
  // Move enemy units
  gameState.enemyUnits.forEach(unit => {
    if (!unit.hasMoved) {
      moveUnitTowardsTarget(unit);
      unit.hasMoved = true;
    }
  });
  
  setTimeout(() => executeAttacks(), 300);
}

function moveUnitTowardsTarget(unit) {
  const target = findClosestTarget(unit);
  
  if (!target) return;
  
  const dx = target.gridX - unit.gridX;
  const dy = target.gridY - unit.gridY;
  
  let newX = unit.gridX;
  let newY = unit.gridY;
  
  // Move towards target (one cell at a time)
  if (Math.abs(dx) > Math.abs(dy)) {
    newX = unit.gridX + (dx > 0 ? 1 : -1);
  } else if (dy !== 0) {
    newY = unit.gridY + (dy > 0 ? 1 : -1);
  }
  
  // Check if new position is valid and empty
  if (isValidPosition(newX, newY)) {
    const cell = gameState.mapGrid[newY][newX];
    if (!cell.entity && !cell.building) {
      // Clear old cell
      gameState.mapGrid[unit.gridY][unit.gridX].entity = null;
      
      // Move to new cell
      unit.gridX = newX;
      unit.gridY = newY;
      gameState.mapGrid[newY][newX].entity = unit;
    }
  }
}

function findClosestTarget(unit) {
  let closestTarget = null;
  let closestDistance = Infinity;
  
  const targets = unit.isEnemy ? 
    [...gameState.playerUnits, gameState.playerHQ] :
    [...gameState.enemyUnits, gameState.enemyHQ];
  
  targets.forEach(target => {
    if (target && target.health > 0) {
      const distance = getGridDistance(unit.gridX, unit.gridY, target.gridX, target.gridY);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestTarget = target;
      }
    }
  });
  
  return closestTarget;
}

function executeAttacks() {
  // Player units attack
  gameState.playerUnits.forEach(unit => {
    if (!unit.hasAttacked) {
      executeUnitAttack(unit);
      unit.hasAttacked = true;
    }
  });
  
  // Enemy units attack
  gameState.enemyUnits.forEach(unit => {
    if (!unit.hasAttacked) {
      executeUnitAttack(unit);
      unit.hasAttacked = true;
    }
  });
  
  // Turrets attack
  gameState.buildings.forEach(building => {
    if (building.damage > 0 && building.health > 0) {
      executeBuildingAttack(building);
    }
  });
  
  setTimeout(() => endCombatPhase(), 500);
}

function executeUnitAttack(unit) {
  const target = findClosestTargetInRange(unit);
  
  if (target) {
    // Create projectile
    const projectile = new Projectile(
      unit.x, unit.y,
      target.x, target.y
    );
    gameState.projectiles.push(projectile);
    
    // Deal damage after projectile arrives
    setTimeout(() => {
      target.takeDamage(unit.damage);
      checkUnitDestruction(target);
    }, 200);
  }
}

function executeBuildingAttack(building) {
  const target = findClosestTargetInRange(building);
  
  if (target) {
    // Create projectile
    const projectile = new Projectile(
      building.x, building.y,
      target.x, target.y
    );
    gameState.projectiles.push(projectile);
    
    // Deal damage
    setTimeout(() => {
      target.takeDamage(building.damage);
      checkUnitDestruction(target);
    }, 200);
  }
}

function findClosestTargetInRange(attacker) {
  let closestTarget = null;
  let closestDistance = Infinity;
  
  const targets = attacker.isEnemy ? 
    [...gameState.playerUnits, gameState.playerHQ] :
    [...gameState.enemyUnits, gameState.enemyHQ];
  
  targets.forEach(target => {
    if (target && target.health > 0) {
      const distance = getGridDistance(attacker.gridX, attacker.gridY, target.gridX, target.gridY);
      if (distance <= attacker.range && distance < closestDistance) {
        closestDistance = distance;
        closestTarget = target;
      }
    }
  });
  
  return closestTarget;
}

function checkUnitDestruction(target) {
  if (target.health <= 0) {
    // Award score
    if (target.isEnemy && !target.type) {
      // It's a building
      if (target === gameState.enemyHQ) {
        gameState.score += 500;
      } else {
        gameState.score += 100;
      }
    } else if (target.isEnemy && target.type) {
      // It's an enemy unit
      const scores = {
        INFANTRY: 10,
        ARTILLERY: 25,
        TANK: 50
      };
      gameState.score += scores[target.type] || 10;
    }
  }
}

function endCombatPhase() {
  // Clean up dead entities
  gameState.playerUnits = gameState.playerUnits.filter(unit => !unit.isDead());
  gameState.enemyUnits = gameState.enemyUnits.filter(unit => !unit.isDead());
  gameState.buildings = gameState.buildings.filter(building => !building.isDead());
  
  // Update map grid
  for (let row = 0; row < gameState.mapGrid.length; row++) {
    for (let col = 0; col < gameState.mapGrid[row].length; col++) {
      gameState.mapGrid[row][col].entity = null;
      gameState.mapGrid[row][col].building = null;
    }
  }
  
  gameState.playerUnits.forEach(unit => {
    if (unit.health > 0) {
      gameState.mapGrid[unit.gridY][unit.gridX].entity = unit;
    }
  });
  
  gameState.enemyUnits.forEach(unit => {
    if (unit.health > 0) {
      gameState.mapGrid[unit.gridY][unit.gridX].entity = unit;
    }
  });
  
  gameState.buildings.forEach(building => {
    if (building.health > 0) {
      gameState.mapGrid[building.gridY][building.gridX].building = building;
    }
  });
  
  // Check win/lose conditions
  if (gameState.enemyHQ && gameState.enemyHQ.health <= 0) {
    handleLevelComplete();
  } else if (gameState.playerHQ && gameState.playerHQ.health <= 0) {
    handleGameOver();
  } else {
    // Enemy turn
    enemyTurn();
  }
  
  gameState.combatPhase = false;
}

function enemyTurn() {
  const levelConfig = gameState.levelConfig;
  
  // Simplified enemy AI: deploy units based on wave
  if (gameState.turnCount <= levelConfig.enemyUnits.length) {
    const wave = levelConfig.enemyUnits[gameState.turnCount - 1];
    if (wave) {
      deployEnemyUnits(wave.type, wave.count);
    }
  }
  
  // Give player resources for next turn
  gameState.playerResources += levelConfig.resourcePerTurn;
}

function deployEnemyUnits(type, count) {
  const ENEMY_DEPLOY_COLS = [16, 17, 18, 19];
  
  for (let i = 0; i < count; i++) {
    // Find empty spot in enemy deployment zone
    let placed = false;
    for (let row = 0; row < gameState.mapGrid.length && !placed; row++) {
      for (let col of ENEMY_DEPLOY_COLS) {
        const cell = gameState.mapGrid[row][col];
        if (!cell.entity && !cell.building && cell.terrain !== 'IMPASSABLE') {
          const unit = new Unit(col, row, type, true);
          gameState.enemyUnits.push(unit);
          gameState.entities.push(unit);
          cell.entity = unit;
          placed = true;
          break;
        }
      }
    }
  }
}

function handleLevelComplete() {
  // Bonus points
  const hqHealthPercent = gameState.playerHQ.health / gameState.playerHQ.maxHealth;
  if (hqHealthPercent > 0.75) {
    gameState.score += 200;
  } else if (hqHealthPercent > 0.5) {
    gameState.score += 100;
  }
  
  if (gameState.currentLevel >= 4) {
    gameState.gamePhase = 'GAME_OVER_WIN';
  } else {
    gameState.currentLevel++;
    // We'll handle level transition in the UI
  }
}

function handleGameOver() {
  gameState.gamePhase = 'GAME_OVER_LOSE';
}

export { handleLevelComplete, handleGameOver };