// game_logic.js - Core game logic
import { gameState, playerStats } from './globals.js';
import { 
  PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  CANVAS_WIDTH, CANVAS_HEIGHT, XP_ORB_PICKUP_RANGE, STAGE_CONFIG
} from './globals.js';
import { Player, Enemy, Bullet, XPOrb, Particle } from './entities.js';
import { getRandomUpgrades } from './upgrades.js';

export function initGame(p) {
  // Reset Global Game State
  gameState.score = 0;
  gameState.kills = 0;
  gameState.stage = 1;
  gameState.gameStartTime = Date.now();
  gameState.positionHistory = [];
  
  // Initialize the first stage
  resetForStage(p);

  // Log game start
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, message: "Game Started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetForStage(p) {
  // Reset entities
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  gameState.entities = [gameState.player];
  gameState.bullets = [];
  gameState.enemies = [];
  gameState.xpOrbs = [];
  gameState.particles = [];
  
  // Reset Level/XP (Start at level 0/1 for each stage)
  gameState.level = 1;
  gameState.experience = 0;
  gameState.experienceToNextLevel = 10;
  gameState.upgradeChoices = [];
  gameState.showingUpgradeScreen = false;
  
  // Reset Stage Progress
  gameState.stageKills = 0;
  gameState.stageMessageTimer = 120; // Show stage name for 2 seconds
  
  // Reset Timers
  gameState.elapsedTime = 0;
  gameState.enemySpawnTimer = 0;
  const config = STAGE_CONFIG[gameState.stage - 1];
  gameState.enemySpawnRate = config.spawnRate;
  gameState.lastFireTime = 0;
  
  // Reset Player Stats to base
  playerStats.fireRate = 15;
  playerStats.damage = 10;
  playerStats.bulletSpeed = 8;
  playerStats.moveSpeed = 3;
  playerStats.maxHealth = 100;
  playerStats.healthRegen = 0;
  playerStats.pierce = 0;
  playerStats.multishot = 1;
  playerStats.areaDamage = 0;
  playerStats.hasLightning = false;
  playerStats.lightningCooldown = 0;
  playerStats.hasShield = false;
  playerStats.shieldHealth = 0;
}

export function updateGame(p) {
  if (gameState.showingUpgradeScreen) {
    return; // Pause game during upgrade selection
  }

  // Update elapsed time (per stage)
  gameState.elapsedTime += 1/60;
  
  if (gameState.stageMessageTimer > 0) {
    gameState.stageMessageTimer--;
  }

  // Check Stage Progression
  const config = STAGE_CONFIG[gameState.stage - 1];
  if (gameState.stageKills >= config.killsRequired) {
    if (gameState.stage < STAGE_CONFIG.length) {
      // Proceed to next stage
      gameState.stage++;
      resetForStage(p);
      p.logs.game_info.push({
        data: { event: "stage_complete", stage: gameState.stage },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return; // Skip rest of update for this frame
    } else {
      // Game Win
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_WIN, score: gameState.score, kills: gameState.kills },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
  }

  // Update player
  gameState.player.update(p);

  // Track player position for automated testing
  if (p.frameCount % 10 === 0) {
    gameState.positionHistory.push({ x: gameState.player.x, y: gameState.player.y, frame: p.frameCount });
    if (gameState.positionHistory.length > 30) {
      gameState.positionHistory.shift();
    }
  }

  // Log player info
  if (p.frameCount % 60 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }

  // Spawn enemies
  spawnEnemies(p);

  // Update bullets
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const bullet = gameState.bullets[i];
    if (bullet.update()) {
      gameState.bullets.splice(i, 1);
    }
  }

  // Update enemies
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i];
    enemy.update(p, gameState.player);

    // Check collision with player
    const dist = Math.sqrt(
      Math.pow(enemy.x - gameState.player.x, 2) + 
      Math.pow(enemy.y - gameState.player.y, 2)
    );
    if (dist < (enemy.size + gameState.player.size) / 2) {
      if (gameState.player.takeDamage(enemy.damage)) {
        createHitParticles(p, gameState.player.x, gameState.player.y, [255, 100, 100]);
      }
      
      if (gameState.player.health <= 0) {
        gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { phase: PHASE_GAME_OVER_LOSE, score: gameState.score, kills: gameState.kills },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return;
      }
    }
  }

  // Check bullet-enemy collisions
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const bullet = gameState.bullets[i];
    let bulletRemoved = false;

    for (let j = gameState.enemies.length - 1; j >= 0; j--) {
      const enemy = gameState.enemies[j];
      
      const dist = Math.sqrt(
        Math.pow(bullet.x - enemy.x, 2) + 
        Math.pow(bullet.y - enemy.y, 2)
      );

      if (dist < (bullet.size + enemy.size) / 2) {
        // Apply damage
        const killed = enemy.takeDamage(bullet.damage);
        
        // Area damage
        if (playerStats.areaDamage > 0) {
          applyAreaDamage(p, bullet.x, bullet.y, playerStats.areaDamage, bullet.damage * 0.5);
        }

        createHitParticles(p, enemy.x, enemy.y, [255, 200, 100]);

        if (killed) {
          // Enemy died
          spawnXPOrb(enemy.x, enemy.y, enemy.xpValue);
          gameState.enemies.splice(j, 1);
          gameState.score += enemy.xpValue * 10;
          gameState.kills++;
          gameState.stageKills++;
        }

        bullet.onHit();
        if (!bullet.canPierce()) {
          gameState.bullets.splice(i, 1);
          bulletRemoved = true;
          break;
        }
      }
    }

    if (bulletRemoved) break;
  }

  // Update XP orbs
  for (let i = gameState.xpOrbs.length - 1; i >= 0; i--) {
    const orb = gameState.xpOrbs[i];
    if (orb.update(p, gameState.player)) {
      gameState.xpOrbs.splice(i, 1);
      continue;
    }

    // Check pickup
    const dist = Math.sqrt(
      Math.pow(orb.x - gameState.player.x, 2) + 
      Math.pow(orb.y - gameState.player.y, 2)
    );
    if (dist < XP_ORB_PICKUP_RANGE) {
      gameState.experience += orb.value;
      gameState.xpOrbs.splice(i, 1);
      createPickupParticles(p, orb.x, orb.y);

      // Check level up
      if (gameState.experience >= gameState.experienceToNextLevel) {
        levelUp(p);
      }
    }
  }

  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    if (gameState.particles[i].update()) {
      gameState.particles.splice(i, 1);
    }
  }

  // Lightning ability
  if (playerStats.hasLightning) {
    if (playerStats.lightningCooldown <= 0 && gameState.enemies.length > 0) {
      triggerLightning(p);
      playerStats.lightningCooldown = 180; // 3 seconds
    } else {
      playerStats.lightningCooldown--;
    }
  }
}

function spawnEnemies(p) {
  gameState.enemySpawnTimer--;
  if (gameState.enemySpawnTimer <= 0) {
    const config = STAGE_CONFIG[gameState.stage - 1];
    
    // Set spawn rate from config
    gameState.enemySpawnRate = config.spawnRate;
    gameState.enemySpawnTimer = gameState.enemySpawnRate;

    // Determine enemy type from config
    const allowedTypes = config.enemyTypes;
    const type = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];

    // Spawn from random edge
    let x, y;
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: // top
        x = Math.random() * CANVAS_WIDTH;
        y = -20;
        break;
      case 1: // right
        x = CANVAS_WIDTH + 20;
        y = Math.random() * CANVAS_HEIGHT;
        break;
      case 2: // bottom
        x = Math.random() * CANVAS_WIDTH;
        y = CANVAS_HEIGHT + 20;
        break;
      case 3: // left
        x = -20;
        y = Math.random() * CANVAS_HEIGHT;
        break;
    }

    const enemy = new Enemy(x, y, type);
    gameState.enemies.push(enemy);
  }
}

function spawnXPOrb(x, y, value) {
  const orb = new XPOrb(x, y, value);
  gameState.xpOrbs.push(orb);
}

function levelUp(p) {
  gameState.level++;
  gameState.experience -= gameState.experienceToNextLevel;
  gameState.experienceToNextLevel = Math.floor(gameState.experienceToNextLevel * 1.3);

  // Show upgrade choices
  gameState.upgradeChoices = getRandomUpgrades(3);
  gameState.showingUpgradeScreen = true;

  // Heal player on level up
  gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 20);

  p.logs.game_info.push({
    data: { event: "level_up", level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function fireBullet(p) {
  const currentTime = p.frameCount;
  if (currentTime - gameState.lastFireTime < playerStats.fireRate) {
    return;
  }

  gameState.lastFireTime = currentTime;

  const player = gameState.player;
  const spreadAngle = 0.15;

  for (let i = 0; i < playerStats.multishot; i++) {
    let angle = player.facingAngle;
    
    if (playerStats.multishot > 1) {
      const offset = (i - (playerStats.multishot - 1) / 2) * spreadAngle;
      angle += offset;
    }

    const bullet = new Bullet(
      player.x,
      player.y,
      angle,
      playerStats.bulletSpeed,
      playerStats.damage,
      playerStats.pierce
    );
    gameState.bullets.push(bullet);
  }
}

function applyAreaDamage(p, x, y, radius, damage) {
  for (let enemy of gameState.enemies) {
    const dist = Math.sqrt(
      Math.pow(enemy.x - x, 2) + 
      Math.pow(enemy.y - y, 2)
    );
    if (dist < radius) {
      enemy.takeDamage(damage);
    }
  }
}

function triggerLightning(p) {
  // Strike up to 3 closest enemies
  const targets = gameState.enemies
    .map(e => ({
      enemy: e,
      dist: Math.sqrt(
        Math.pow(e.x - gameState.player.x, 2) + 
        Math.pow(e.y - gameState.player.y, 2)
      )
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3);

  for (let target of targets) {
    target.enemy.takeDamage(playerStats.damage * 2);
    createLightningParticles(p, target.enemy.x, target.enemy.y);
  }
}

function createHitParticles(p, x, y, color) {
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    gameState.particles.push(new Particle(x, y, vx, vy, color, 20));
  }
}

function createPickupParticles(p, x, y) {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const speed = 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    gameState.particles.push(new Particle(x, y, vx, vy, [100, 255, 200], 15));
  }
}

function createLightningParticles(p, x, y) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    gameState.particles.push(new Particle(x, y, vx, vy, [150, 200, 255], 25));
  }
}