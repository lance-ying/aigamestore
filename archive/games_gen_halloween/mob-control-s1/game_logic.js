// game_logic.js - Core game logic
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, NUM_LANES, LANE_WIDTH, FIRE_RATE, ENEMY_SPAWN_RATE, FPS, CHAMPION_COST, SPEED_BOOST_COST, UNIT_SPEED } from './globals.js';
import { Unit, Gate } from './entities.js';

export function initializeGates(p) {
  gameState.gates = [];
  
  // Create gates in middle section of screen
  const gateYPositions = [120, 200, 280];
  const gateTypes = [
    { type: 'multiply', value: 2 },
    { type: 'multiply', value: 3 },
    { type: 'add', value: 50 },
    { type: 'add', value: 25 }
  ];
  
  // Use p.random for gate placement
  for (let i = 0; i < 12 + gameState.level * 2; i++) {
    const yPos = gateYPositions[Math.floor(p.random(gateYPositions.length))];
    const xPos = p.random(40, CANVAS_WIDTH - 40);
    const gateType = gateTypes[Math.floor(p.random(gateTypes.length))];
    
    gameState.gates.push(new Gate(xPos, yPos, gateType.type, gateType.value));
  }
}

export function fireUnit(p) {
  if (!gameState.player) return;
  
  const firePos = gameState.player.getFirePosition();
  const fireDir = gameState.player.getFireDirection();
  
  const unit = new Unit(
    firePos.x, 
    firePos.y, 
    fireDir.x * UNIT_SPEED, 
    fireDir.y * UNIT_SPEED, 
    'player',
    false,
    gameState.speedBoostActive
  );
  
  gameState.entities.push(unit);
  gameState.unitCount++;
  gameState.totalUnitsSpawned++;
}

export function fireChampion(p) {
  if (gameState.unitCount < CHAMPION_COST) return;
  if (!gameState.player) return;
  
  const firePos = gameState.player.getFirePosition();
  const fireDir = gameState.player.getFireDirection();
  
  const champion = new Unit(
    firePos.x, 
    firePos.y, 
    fireDir.x * UNIT_SPEED, 
    fireDir.y * UNIT_SPEED, 
    'player',
    true,
    gameState.speedBoostActive
  );
  
  gameState.entities.push(champion);
  gameState.unitCount -= CHAMPION_COST;
}

export function activateSpeedBoost() {
  if (gameState.unitCount < SPEED_BOOST_COST) return;
  
  gameState.speedBoostActive = true;
  gameState.speedBoostFrames = FPS * 3; // 3 seconds
  gameState.unitCount -= SPEED_BOOST_COST;
}

export function spawnEnemyUnit(p) {
  const lane = Math.floor(p.random(NUM_LANES));
  const x = lane * LANE_WIDTH + LANE_WIDTH / 2 + p.random(-20, 20);
  const y = 0;
  
  const spawnRate = ENEMY_SPAWN_RATE + gameState.level * 0.5;
  const enemyUnit = new Unit(x, y, 0, UNIT_SPEED * 0.8, 'enemy', false, false);
  
  gameState.entities.push(enemyUnit);
}

export function updateUnits(p) {
  const playerUnits = [];
  const enemyUnits = [];
  
  // Update all units
  for (let unit of gameState.entities) {
    if (!unit.active) continue;
    
    unit.update(p);
    
    if (unit.team === 'player') {
      playerUnits.push(unit);
    } else {
      enemyUnits.push(unit);
    }
  }
  
  // Check gate collisions for player units
  for (let unit of playerUnits) {
    for (let gate of gameState.gates) {
      if (gate.checkCollision(unit, p)) {
        applyGateEffect(unit, gate, p);
      }
    }
  }
  
  // Check unit collisions
  checkCombat(playerUnits, enemyUnits);
  
  // Check base collisions
  checkBaseCollisions(playerUnits, enemyUnits);
  
  // Remove inactive units
  gameState.entities = gameState.entities.filter(e => e.active);
}

export function applyGateEffect(unit, gate, p) {
  if (gate.used) return;
  
  gate.used = true;
  
  if (gate.type === 'multiply') {
    // Spawn additional units
    for (let i = 0; i < gate.value - 1; i++) {
      const newUnit = new Unit(
        unit.x + p.random(-10, 10),
        unit.y + p.random(-10, 10),
        unit.vx,
        unit.vy,
        unit.team,
        unit.isChampion,
        unit.speedBoost
      );
      gameState.entities.push(newUnit);
      gameState.unitCount++;
    }
    gameState.score += gate.value * 5;
  } else if (gate.type === 'add') {
    // Spawn fixed number of units
    for (let i = 0; i < gate.value; i++) {
      const newUnit = new Unit(
        unit.x + p.random(-15, 15),
        unit.y + p.random(-15, 15),
        unit.vx,
        unit.vy,
        unit.team,
        false,
        unit.speedBoost
      );
      gameState.entities.push(newUnit);
      gameState.unitCount++;
    }
    gameState.score += gate.value * 2;
  }
}

export function checkCombat(playerUnits, enemyUnits) {
  for (let pUnit of playerUnits) {
    for (let eUnit of enemyUnits) {
      const dist = Math.sqrt((pUnit.x - eUnit.x) ** 2 + (pUnit.y - eUnit.y) ** 2);
      
      if (dist < (pUnit.size + eUnit.size) / 2 + 5) {
        // Units engage in combat
        pUnit.attack(eUnit);
        eUnit.attack(pUnit);
      }
    }
  }
}

export function checkBaseCollisions(playerUnits, enemyUnits) {
  // Player units reaching enemy base (top)
  for (let unit of playerUnits) {
    if (unit.y < 20) {
      gameState.enemyBaseHP -= unit.damage;
      gameState.score += unit.isChampion ? 20 : 5;
      unit.active = false;
    }
  }
  
  // Enemy units reaching player base (bottom)
  for (let unit of enemyUnits) {
    if (unit.y > CANVAS_HEIGHT - 40) {
      gameState.playerBaseHP -= unit.damage;
      unit.active = false;
    }
  }
}

export function checkGameOver() {
  if (gameState.enemyBaseHP <= 0) {
    gameState.gamePhase = "GAME_OVER_WIN";
    gameState.championStars += 3;
    return true;
  }
  
  if (gameState.playerBaseHP <= 0) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    return true;
  }
  
  return false;
}

export function updateGameLogic(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  // Handle firing
  if (gameState.keys.space) {
    gameState.framesSinceLastFire++;
    const framesPerFire = Math.floor(FPS / FIRE_RATE);
    if (gameState.framesSinceLastFire >= framesPerFire) {
      fireUnit(p);
      gameState.framesSinceLastFire = 0;
    }
  } else {
    gameState.framesSinceLastFire = 0;
  }
  
  // Handle champion deployment
  if (gameState.keys.z) {
    fireChampion(p);
    gameState.keys.z = false; // Single shot
  }
  
  // Handle speed boost
  if (gameState.keys.shift) {
    activateSpeedBoost();
    gameState.keys.shift = false; // Single activation
  }
  
  // Update speed boost
  if (gameState.speedBoostActive) {
    gameState.speedBoostFrames--;
    if (gameState.speedBoostFrames <= 0) {
      gameState.speedBoostActive = false;
    }
  }
  
  // Spawn enemy units
  gameState.framesSinceLastEnemySpawn++;
  const enemySpawnRate = ENEMY_SPAWN_RATE + gameState.level * 0.5;
  const framesPerEnemySpawn = Math.floor(FPS / enemySpawnRate);
  if (gameState.framesSinceLastEnemySpawn >= framesPerEnemySpawn) {
    spawnEnemyUnit(p);
    gameState.framesSinceLastEnemySpawn = 0;
  }
  
  // Update units
  updateUnits(p);
  
  // Check game over
  checkGameOver();
}