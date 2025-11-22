// game_logic.js - Core game logic and updates

import { GAME_PHASES, gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Unit, EnemyUnit } from './entities.js';

export function fireUnit(cannon) {
  const spawnPoint = cannon.getSpawnPoint();
  const direction = cannon.getDirection();
  
  const speed = 4.5;
  const unit = new Unit(
    spawnPoint.x,
    spawnPoint.y,
    direction.x * speed,
    direction.y * speed
  );
  
  gameState.units.push(unit);
  gameState.totalUnitsSpawned++;
}

export function spawnEnemyUnit() {
  if (!gameState.enemyBase) return;
  
  const enemyBase = gameState.enemyBase;
  const spawnX = enemyBase.x - enemyBase.width / 2 - 10;
  const spawnY = enemyBase.y + (Math.random() - 0.5) * 60;
  
  const enemy = new EnemyUnit(spawnX, spawnY);
  gameState.enemyUnits.push(enemy);
  gameState.totalEnemiesSpawned++;
}

export function updateEnemySpawning() {
  gameState.enemySpawnTimer++;
  
  // Adjust spawn rate based on level
  const adjustedInterval = Math.max(60, gameState.enemySpawnInterval - (gameState.currentLevel - 1) * 10);
  
  if (gameState.enemySpawnTimer >= adjustedInterval) {
    spawnEnemyUnit();
    gameState.enemySpawnTimer = 0;
    
    // Wave system - spawn bursts
    if (gameState.totalEnemiesSpawned % 10 === 0) {
      gameState.enemyWaveCount++;
      // Spawn bonus enemies in wave
      for (let i = 0; i < Math.min(gameState.currentLevel, 3); i++) {
        setTimeout(() => spawnEnemyUnit(), i * 100);
      }
    }
  }
}

export function updateEnemyUnits() {
  for (let i = gameState.enemyUnits.length - 1; i >= 0; i--) {
    const enemy = gameState.enemyUnits[i];
    
    if (!enemy.alive) {
      gameState.enemyUnits.splice(i, 1);
      continue;
    }
    
    enemy.update();
    
    // Check collision with player units
    for (const unit of gameState.units) {
      if (unit.alive) {
        const dist = Math.hypot(unit.x - enemy.x, unit.y - enemy.y);
        if (dist < 10) {
          unit.alive = false;
          enemy.alive = false;
          gameState.enemiesKilled++;
          gameState.score += 5;
          break;
        }
      }
    }
  }
}

export function updateUnits(frameCount) {
  const speedMult = gameState.slowMotionActive ? 0.5 : 1.0;
  
  for (let i = gameState.units.length - 1; i >= 0; i--) {
    const unit = gameState.units[i];
    
    if (!unit.alive) {
      gameState.units.splice(i, 1);
      continue;
    }
    
    // Check speed pads
    let onSpeedPad = false;
    for (const pad of gameState.speedPads) {
      if (pad.checkCollision(unit)) {
        onSpeedPad = true;
        unit.update(speedMult * pad.speedBoost);
        break;
      }
    }
    
    if (!onSpeedPad) {
      unit.update(speedMult);
    }
    
    // Check gate collisions
    for (const gate of gameState.gates) {
      if (gate.checkCollision(unit)) {
        if (!unit.hasPassedGate) {
          unit.hasPassedGate = true;
          handleGateCollision(gate, unit);
        }
      }
    }
    
    // Check obstacle collisions
    for (const obstacle of gameState.obstacles) {
      if (obstacle.alive && obstacle.checkCollision(unit)) {
        unit.alive = false;
        obstacle.takeDamage(1);
        gameState.unitsLost++;
        break;
      }
    }
    
    // Check base collision
    if (gameState.enemyBase && !gameState.enemyBase.isDestroyed()) {
      const base = gameState.enemyBase;
      const inX = unit.x > base.x - base.width / 2 && unit.x < base.x + base.width / 2;
      const inY = unit.y > base.y - base.height / 2 && unit.y < base.y + base.height / 2;
      
      if (inX && inY) {
        unit.alive = false;
        base.takeDamage(1);
        gameState.unitsReachedBase++;
        gameState.score += 1; // Survivor bonus
      }
    }
  }
}

function handleGateCollision(gate, unit) {
  if (gate.multiplier > 1) {
    // Blue gate - multiply units
    gameState.blueGatesPassed++;
    gameState.score += gate.multiplier * 10;
    
    // Spawn additional units
    const spawnCount = Math.floor(gate.multiplier) - 1;
    for (let i = 0; i < spawnCount; i++) {
      const offsetX = (Math.random() - 0.5) * 10;
      const offsetY = (Math.random() - 0.5) * 10;
      const newUnit = new Unit(
        unit.x + offsetX,
        unit.y + offsetY,
        unit.vx + (Math.random() - 0.5) * 0.5,
        unit.vy + (Math.random() - 0.5) * 0.5
      );
      newUnit.hasPassedGate = true;
      gameState.units.push(newUnit);
      gameState.totalUnitsSpawned++;
    }
  } else {
    // Red gate - penalty
    gameState.redGatesPassed++;
    gameState.perfectBlueChain = false;
    gameState.score = Math.max(0, gameState.score - 25);
    
    // Kill some nearby units
    const killRadius = 30;
    for (const u of gameState.units) {
      if (u !== unit && u.alive) {
        const dist = Math.hypot(u.x - unit.x, u.y - unit.y);
        if (dist < killRadius && Math.random() < 0.5) {
          u.alive = false;
          gameState.unitsLost++;
        }
      }
    }
  }
}

export function useChampionAbility() {
  if (!gameState.championAbilityReady) return;
  
  gameState.championAbilityReady = false;
  gameState.championAbilityCooldown = 180; // 3 seconds at 60fps
  
  // Destroy nearby obstacles and enemies
  let destroyedSomething = false;
  
  for (const obstacle of gameState.obstacles) {
    if (obstacle.alive) {
      const dist = Math.hypot(obstacle.x - 300, obstacle.y - 200);
      if (dist < 150) {
        obstacle.alive = false;
        gameState.obstaclesDestroyed++;
        gameState.score += obstacle.type === 'fortified' ? 25 : 1;
        destroyedSomething = true;
      }
    }
  }
  
  // Also damage nearby enemies
  for (const enemy of gameState.enemyUnits) {
    if (enemy.alive) {
      const dist = Math.hypot(enemy.x - 300, enemy.y - 200);
      if (dist < 150) {
        enemy.alive = false;
        gameState.enemiesKilled++;
        gameState.score += 5;
        destroyedSomething = true;
      }
    }
  }
  
  // Grant score bonus on first use
  if (gameState.championUsedCount === 0 && destroyedSomething) {
    gameState.score += 100;
  }
  
  gameState.championUsedCount++;
}

export function updateChampionCooldown() {
  if (!gameState.championAbilityReady && gameState.championAbilityCooldown > 0) {
    gameState.championAbilityCooldown--;
    if (gameState.championAbilityCooldown <= 0) {
      gameState.championAbilityReady = true;
    }
  }
}

export function checkWinCondition() {
  if (gameState.enemyBase && gameState.enemyBase.isDestroyed()) {
    return true;
  }
  return false;
}

export function checkLoseCondition() {
  if (gameState.cannon && gameState.cannon.isDestroyed()) {
    return true;
  }
  return false;
}

export function calculateFinalScore() {
  let finalScore = gameState.score;
  
  // Time bonus
  const elapsedTime = Date.now() - gameState.startTime;
  const timeDiff = gameState.levelParTime - elapsedTime;
  if (timeDiff > 0) {
    const timeBonus = Math.floor((timeDiff / gameState.levelParTime) * 400);
    finalScore += timeBonus;
  }
  
  // Enemy kill bonus
  finalScore += gameState.enemiesKilled * 5;
  
  // Survivor bonus (already added during gameplay)
  const survivorBonus = Math.min(gameState.unitsReachedBase, 500);
  
  // Perfect blue chain bonus
  if (gameState.perfectBlueChain && gameState.blueGatesPassed > 0) {
    finalScore += 50;
  }
  
  // Clean route multiplier
  if (gameState.redGatesPassed === 0 && gameState.blueGatesPassed > 0) {
    finalScore = Math.floor(finalScore * 1.10);
  }
  
  // Cap penalties
  const unitLossPenalty = Math.min(gameState.unitsLost, 300);
  finalScore = Math.max(0, finalScore - unitLossPenalty);
  
  gameState.score = finalScore;
  
  // Calculate rank
  if (finalScore >= 2400) {
    gameState.finalRank = "S";
  } else if (finalScore >= 1900) {
    gameState.finalRank = "A";
  } else if (finalScore >= 1400) {
    gameState.finalRank = "B";
  } else {
    gameState.finalRank = "C";
  }
  
  return finalScore;
}