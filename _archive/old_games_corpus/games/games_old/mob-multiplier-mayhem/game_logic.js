import { gameState, GAME_PHASES, CANNON_CONFIG, LEVEL_CONFIGS } from './globals.js';
import { Projectile, MobUnit, Champion, EnemyBase, Gate } from './entities.js';

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

  gameState.totalFrames++;

  // Update timer
  const elapsed = (Date.now() - gameState.levelStartTime) / 1000;
  gameState.levelTimer = Math.max(0, gameState.levelConfig.timeLimit - elapsed);

  // Update cooldowns
  if (gameState.championCooldowns.tank > 0) {
    gameState.championCooldowns.tank -= 1 / 60;
  }
  if (gameState.championCooldowns.speed > 0) {
    gameState.championCooldowns.speed -= 1 / 60;
  }

  // Update entities
  gameState.enemyBase.update();

  for (const gate of gameState.gates) {
    gate.update();
  }

  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    proj.update();

    // Check gate collisions
    for (const gate of gameState.gates) {
      if (!proj.passedGates.has(gate) && 
          p.collideCircleCircle(proj.x, proj.y, proj.radius * 2,
            gate.x + gate.width / 2, gate.y + gate.height / 2,
            Math.max(gate.width, gate.height))) {
        
        proj.passedGates.add(gate);
        gate.activate();
        
        // Spawn mob units
        for (let j = 0; j < gate.multiplier; j++) {
          const mob = new MobUnit(p, 
            gate.x + gate.width / 2 + p.random(-10, 10),
            gate.y + gate.height
          );
          gameState.mobUnits.push(mob);
          gameState.entities.push(mob);
          gameState.score += 5;
        }
      }
    }

    if (!proj.active) {
      gameState.projectiles.splice(i, 1);
    }
  }

  for (let i = gameState.mobUnits.length - 1; i >= 0; i--) {
    gameState.mobUnits[i].update();
    if (!gameState.mobUnits[i].active) {
      gameState.mobUnits.splice(i, 1);
    }
  }

  for (let i = gameState.champions.length - 1; i >= 0; i--) {
    gameState.champions[i].update();
    if (!gameState.champions[i].active) {
      gameState.champions.splice(i, 1);
    }
  }

  // Log player info periodically
  if (gameState.totalFrames % 10 === 0) {
    p.logs.player_info.push({
      screen_x: CANNON_CONFIG.x,
      screen_y: CANNON_CONFIG.y,
      game_x: CANNON_CONFIG.x,
      game_y: CANNON_CONFIG.y,
      framecount: p.frameCount
    });
  }

  // Check win condition
  if (gameState.enemyBase.health <= 0) {
    handleLevelComplete(p);
  }

  // Check lose condition
  if (gameState.levelTimer <= 0 && gameState.enemyBase.health > 0) {
    handleGameOver(p, false);
  }
}

export function fireCannon(p) {
  const angle = gameState.cannonAngle;
  const x = CANNON_CONFIG.x + Math.cos(angle) * CANNON_CONFIG.length;
  const y = CANNON_CONFIG.y + Math.sin(angle) * CANNON_CONFIG.length;
  
  const projectile = new Projectile(p, x, y, angle);
  gameState.projectiles.push(projectile);
  gameState.entities.push(projectile);
}

export function deployChampion(p, type) {
  const config = gameState.levelConfig;
  
  // Check if champion is available
  if (!config || !config.championAvailable[type]) return;
  
  // Check cooldown
  if (gameState.championCooldowns[type] > 0) return;
  
  const champion = new Champion(p, CANNON_CONFIG.x, CANNON_CONFIG.y, type);
  gameState.champions.push(champion);
  gameState.entities.push(champion);
  gameState.championCooldowns[type] = config.championCooldowns[type];
  gameState.score += 50;
}

function handleLevelComplete(p) {
  const timeBonus = Math.max(0, gameState.levelTimer * 2);
  gameState.score += 500 + Math.floor(timeBonus);
  
  if (gameState.currentLevel < 3) {
    gameState.currentLevel++;
    initializeLevel(p);
  } else {
    handleGameOver(p, true);
  }
}

function handleGameOver(p, isWin) {
  gameState.gamePhase = isWin ? GAME_PHASES.GAME_OVER_WIN : GAME_PHASES.GAME_OVER_LOSE;
  
  p.logs.game_info.push({
    data: { 
      phase: gameState.gamePhase, 
      finalScore: gameState.score,
      level: gameState.currentLevel
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function initializeLevel(p) {
  gameState.levelConfig = LEVEL_CONFIGS[gameState.currentLevel - 1];
  gameState.levelTimer = gameState.levelConfig.timeLimit;
  gameState.levelStartTime = Date.now();
  gameState.projectiles = [];
  gameState.mobUnits = [];
  gameState.champions = [];
  gameState.championCooldowns = { tank: 0, speed: 0 };
  
  gameState.enemyBase = new EnemyBase(p);
  
  gameState.gates = gameState.levelConfig.gates.map(g => 
    new Gate(p, g.x, g.y, g.width, g.height, g.multiplier)
  );
  
  gameState.obstacles = gameState.levelConfig.obstacles.map(o => ({...o}));
  gameState.speedBoostZones = gameState.levelConfig.speedBoostZones.map(z => ({...z}));
}