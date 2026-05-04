// gameLogic.js - Core game logic and mechanics
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, ENEMY_CONFIG, BOSS_CONFIG, UPGRADE_POOL } from './globals.js';
import { Player, Enemy, Boss, Projectile, EnemyProjectile, ExperienceOrb, Particle } from './entities.js';

let p5Instance = null;

export function initializeGame(p) {
  p5Instance = p;
  
  // Create player
  gameState.player = new Player(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Reset game state
  gameState.entities = [gameState.player];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.experienceOrbs = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.levelUpPending = false;
  gameState.upgradeChoices = [];
  gameState.selectedUpgrade = null;
  gameState.waveLevel = 1;
  gameState.timeSurvived = 0;
  gameState.bossActive = false;
  gameState.currentBoss = null;
  gameState.framesSinceStart = 0;
  gameState.lastWaveIncrease = 0;
  gameState.lastBossSpawn = 0;
}

export function updateGame(inputs) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  gameState.framesSinceStart++;
  gameState.timeSurvived = Math.floor(gameState.framesSinceStart / 60);
  
  // Check for level up
  if (gameState.player.experience >= gameState.player.experienceToNextLevel && !gameState.levelUpPending) {
    gameState.player.levelUp();
    gameState.levelUpPending = true;
    generateUpgradeChoices();
  }
  
  // Handle upgrade selection
  if (gameState.levelUpPending) {
    if (inputs.space && gameState.upgradeChoices.length > 0) {
      applyUpgrade(gameState.upgradeChoices[0]);
      gameState.levelUpPending = false;
    } else if (inputs.shift && gameState.upgradeChoices.length > 1) {
      applyUpgrade(gameState.upgradeChoices[1]);
      gameState.levelUpPending = false;
    } else if (inputs.z && gameState.upgradeChoices.length > 2) {
      applyUpgrade(gameState.upgradeChoices[2]);
      gameState.levelUpPending = false;
    }
    return; // Pause game during upgrade selection
  }
  
  // Wave progression - every 30 seconds
  if (gameState.framesSinceStart - gameState.lastWaveIncrease >= 1800) {
    gameState.waveLevel++;
    gameState.lastWaveIncrease = gameState.framesSinceStart;
  }
  
  // Boss spawn - every 5 minutes
  if (gameState.framesSinceStart - gameState.lastBossSpawn >= BOSS_CONFIG.spawnInterval && !gameState.bossActive) {
    spawnBoss();
    gameState.lastBossSpawn = gameState.framesSinceStart;
  }
  
  // Update player
  gameState.player.update(inputs);
  
  // Auto-attack nearest enemy
  if (gameState.player.canAttack()) {
    const nearestEnemy = findNearestEnemy();
    if (nearestEnemy) {
      const dist = Math.sqrt(
        Math.pow(nearestEnemy.x - gameState.player.x, 2) +
        Math.pow(nearestEnemy.y - gameState.player.y, 2)
      );
      
      if (dist <= gameState.player.attackRange * gameState.player.upgrades.rangeMultiplier) {
        fireProjectile(gameState.player.x, gameState.player.y, nearestEnemy.x, nearestEnemy.y);
        gameState.player.resetAttackTimer();
      }
    }
  }
  
  // Spawn enemies
  if (gameState.framesSinceStart % Math.max(30, ENEMY_CONFIG.spawnRate - gameState.waveLevel * 5) === 0) {
    spawnEnemy();
  }
  
  // Update enemies
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i];
    enemy.update(gameState.player);
    
    // Check collision with player
    const dist = Math.sqrt(
      Math.pow(enemy.x - gameState.player.x, 2) +
      Math.pow(enemy.y - gameState.player.y, 2)
    );
    
    if (dist < (enemy.size + gameState.player.size) / 2) {
      if (gameState.player.takeDamage(enemy.damage)) {
        createHitParticles(gameState.player.x, gameState.player.y, [255, 100, 100]);
      }
    }
    
    // Boss attacks
    if (enemy.type === 'boss' && enemy.canAttack()) {
      fireBossProjectile(enemy);
      enemy.resetAttackTimer();
    }
    
    // Remove dead enemies
    if (enemy.isDead) {
      createDeathParticles(enemy.x, enemy.y);
      dropExperience(enemy.x, enemy.y, enemy.type === 'boss' ? BOSS_CONFIG.experienceValue : ENEMY_CONFIG.experienceValue);
      gameState.score += enemy.type === 'boss' ? 1000 : 100;
      gameState.enemies.splice(i, 1);
      
      if (enemy.type === 'boss') {
        gameState.bossActive = false;
        gameState.currentBoss = null;
        // Check win condition - defeated first boss
        if (gameState.timeSurvived >= 300) {
          gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
          logGameInfo('GAME_OVER_WIN', { score: gameState.score, time: gameState.timeSurvived });
        }
      }
    }
  }
  
  // Update projectiles
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    proj.update();
    
    // Check collision with enemies
    for (const enemy of gameState.enemies) {
      if (proj.piercing && proj.hitEnemies.has(enemy)) continue;
      
      const dist = Math.sqrt(
        Math.pow(enemy.x - proj.x, 2) +
        Math.pow(enemy.y - proj.y, 2)
      );
      
      if (dist < (enemy.size + proj.size) / 2) {
        const killed = enemy.takeDamage(proj.damage);
        createHitParticles(enemy.x, enemy.y, [255, 200, 100]);
        
        if (proj.piercing) {
          proj.hitEnemies.add(enemy);
        } else {
          proj.isDead = true;
        }
        break;
      }
    }
    
    if (proj.isDead) {
      gameState.projectiles.splice(i, 1);
    }
  }
  
  // Update enemy projectiles
  const enemyProjectiles = gameState.entities.filter(e => e instanceof EnemyProjectile);
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const proj = enemyProjectiles[i];
    proj.update();
    
    // Check collision with player
    const dist = Math.sqrt(
      Math.pow(gameState.player.x - proj.x, 2) +
      Math.pow(gameState.player.y - proj.y, 2)
    );
    
    if (dist < (gameState.player.size + proj.size) / 2) {
      if (gameState.player.takeDamage(proj.damage)) {
        createHitParticles(gameState.player.x, gameState.player.y, [255, 100, 100]);
      }
      proj.isDead = true;
    }
    
    if (proj.isDead) {
      const idx = gameState.entities.indexOf(proj);
      if (idx !== -1) gameState.entities.splice(idx, 1);
    }
  }
  
  // Update experience orbs
  for (let i = gameState.experienceOrbs.length - 1; i >= 0; i--) {
    const orb = gameState.experienceOrbs[i];
    orb.update(gameState.player);
    
    // Check collection
    const dist = Math.sqrt(
      Math.pow(gameState.player.x - orb.x, 2) +
      Math.pow(gameState.player.y - orb.y, 2)
    );
    
    if (dist < (gameState.player.size + orb.size) / 2) {
      gameState.player.gainExperience(orb.value);
      orb.isDead = true;
      createCollectParticles(orb.x, orb.y);
    }
    
    if (orb.isDead) {
      gameState.experienceOrbs.splice(i, 1);
    }
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update();
    if (particle.isDead) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Check game over
  if (gameState.player.health <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    logGameInfo('GAME_OVER_LOSE', { score: gameState.score, time: gameState.timeSurvived });
  }
}

function findNearestEnemy() {
  let nearest = null;
  let minDist = Infinity;
  
  for (const enemy of gameState.enemies) {
    const dist = Math.sqrt(
      Math.pow(enemy.x - gameState.player.x, 2) +
      Math.pow(enemy.y - gameState.player.y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }
  
  return nearest;
}

function fireProjectile(x, y, targetX, targetY) {
  const damage = gameState.player.damage * gameState.player.upgrades.damageMultiplier;
  const piercing = gameState.player.upgrades.piercing;
  
  if (gameState.player.upgrades.multishot) {
    // Fire 3 projectiles in a spread
    const angles = [-0.3, 0, 0.3];
    for (const angleOffset of angles) {
      const dx = targetX - x;
      const dy = targetY - y;
      const angle = Math.atan2(dy, dx) + angleOffset;
      const newTargetX = x + Math.cos(angle) * 100;
      const newTargetY = y + Math.sin(angle) * 100;
      const proj = new Projectile(p5Instance, x, y, newTargetX, newTargetY, damage, piercing);
      gameState.projectiles.push(proj);
    }
  } else {
    const proj = new Projectile(p5Instance, x, y, targetX, targetY, damage, piercing);
    gameState.projectiles.push(proj);
  }
}

function fireBossProjectile(boss) {
  const proj = new EnemyProjectile(
    p5Instance,
    boss.x,
    boss.y,
    gameState.player.x,
    gameState.player.y,
    boss.damage
  );
  gameState.entities.push(proj);
}

function spawnEnemy() {
  const side = Math.floor(p5Instance.random(4));
  let x, y;
  
  switch (side) {
    case 0: // Top
      x = p5Instance.random(CANVAS_WIDTH);
      y = -20;
      break;
    case 1: // Right
      x = CANVAS_WIDTH + 20;
      y = p5Instance.random(CANVAS_HEIGHT);
      break;
    case 2: // Bottom
      x = p5Instance.random(CANVAS_WIDTH);
      y = CANVAS_HEIGHT + 20;
      break;
    case 3: // Left
      x = -20;
      y = p5Instance.random(CANVAS_HEIGHT);
      break;
  }
  
  const enemy = new Enemy(p5Instance, x, y, gameState.waveLevel);
  gameState.enemies.push(enemy);
  gameState.entities.push(enemy);
}

function spawnBoss() {
  const x = CANVAS_WIDTH / 2;
  const y = -50;
  const boss = new Boss(p5Instance, x, y);
  gameState.enemies.push(boss);
  gameState.entities.push(boss);
  gameState.bossActive = true;
  gameState.currentBoss = boss;
}

function dropExperience(x, y, value) {
  const orb = new ExperienceOrb(p5Instance, x, y, value);
  gameState.experienceOrbs.push(orb);
}

function generateUpgradeChoices() {
  const choices = [];
  const pool = [...UPGRADE_POOL];
  
  // Shuffle and pick 3
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const idx = Math.floor(p5Instance.random(pool.length));
    choices.push(pool[idx]);
    pool.splice(idx, 1);
  }
  
  gameState.upgradeChoices = choices;
}

function applyUpgrade(upgrade) {
  const player = gameState.player;
  
  switch (upgrade.id) {
    case 'damage':
      player.upgrades.damageMultiplier *= 1.2;
      break;
    case 'speed':
      player.upgrades.speedMultiplier *= 1.15;
      break;
    case 'health':
      player.maxHealth += 20;
      player.health = Math.min(player.health + 20, player.maxHealth);
      break;
    case 'attackSpeed':
      player.upgrades.attackSpeedMultiplier *= 1.25;
      break;
    case 'range':
      player.upgrades.rangeMultiplier *= 1.2;
      break;
    case 'piercing':
      player.upgrades.piercing = true;
      break;
    case 'multishot':
      player.upgrades.multishot = true;
      break;
    case 'heal':
      player.health = Math.min(player.health + 30, player.maxHealth);
      break;
  }
  
  gameState.upgradeChoices = [];
}

function createHitParticles(x, y, color) {
  for (let i = 0; i < 5; i++) {
    const particle = new Particle(p5Instance, x, y, color, 20);
    gameState.particles.push(particle);
  }
}

function createDeathParticles(x, y) {
  for (let i = 0; i < 10; i++) {
    const particle = new Particle(p5Instance, x, y, [100, 100, 100], 40);
    gameState.particles.push(particle);
  }
}

function createCollectParticles(x, y) {
  for (let i = 0; i < 3; i++) {
    const particle = new Particle(p5Instance, x, y, [50, 200, 255], 15);
    gameState.particles.push(particle);
  }
}

function logGameInfo(event, data) {
  if (!p5Instance || !p5Instance.logs) return;
  p5Instance.logs.game_info.push({
    event: event,
    data: data,
    framecount: p5Instance.frameCount,
    timestamp: Date.now()
  });
}

export { logGameInfo };