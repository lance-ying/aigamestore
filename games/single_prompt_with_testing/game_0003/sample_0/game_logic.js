// game_logic.js - Core game logic and update loops
import { gameState, PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, DAWN_TIME, ENEMY_SPAWN_RATE, MAX_ENEMIES, PLAYER_SIZE } from './globals.js';
import { spawnEnemy } from './enemies.js';
import { createPickup } from './pickups.js';
import { createDeathParticles, createHitParticles } from './particles.js';
import { generateUpgradeChoices, applyUpgrade } from './upgrades.js';

export function updateGame(p, inputs) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Handle level up pending state
  if (gameState.levelUpPending) {
    handleLevelUpInput(inputs);
    return; // Don't update game during level up
  }
  
  const player = gameState.player;
  if (!player) return;
  
  // Update player
  player.update(p, inputs);
  
  // Update camera to follow player
  gameState.camera.x = player.x;
  gameState.camera.y = player.y;
  
  // Update elapsed time
  gameState.elapsedTime++;
  
  // Check win condition
  if (gameState.elapsedTime >= DAWN_TIME) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    gameState.persistentGold += gameState.gold;
    logGameInfo(p, { phase: PHASE_GAME_OVER_WIN, result: 'win' });
    return;
  }
  
  // Update difficulty
  const progress = gameState.elapsedTime / DAWN_TIME;
  gameState.difficultyMultiplier = 1.0 + progress * 2.0; // Scales from 1.0 to 3.0
  
  // Spawn enemies
  gameState.enemySpawnTimer++;
  const spawnRate = Math.max(10, ENEMY_SPAWN_RATE - Math.floor(progress * 40));
  if (gameState.enemySpawnTimer >= spawnRate && gameState.enemies.length < MAX_ENEMIES) {
    const enemy = spawnEnemy(p, player, gameState.difficultyMultiplier);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
    gameState.enemySpawnTimer = 0;
  }
  
  // Update enemies
  for (const enemy of gameState.enemies) {
    enemy.update(p, player, gameState.difficultyMultiplier);
    
    // Check collision with player
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < (player.size + enemy.size) / 2 && enemy.canAttack()) {
      if (player.takeDamage(enemy.damage)) {
        enemy.attack();
        const particles = createHitParticles(player.x, player.y, [255, 100, 100]);
        gameState.particles.push(...particles);
      }
    }
  }
  
  // Check lose condition
  if (player.health <= 0) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    gameState.persistentGold += gameState.gold;
    logGameInfo(p, { phase: PHASE_GAME_OVER_LOSE, result: 'lose' });
    return;
  }
  
  // Update weapons and create projectiles
  for (const weapon of player.weapons) {
    weapon.update();
    
    if (weapon.type === 'garlic') {
      // Garlic passive damage
      for (const enemy of gameState.enemies) {
        if (enemy.dead) continue;
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < weapon.range * player.range * 40) {
          if (p.frameCount % 15 === 0) {
            const killed = enemy.takeDamage(weapon.damage * player.damage);
            if (killed) {
              handleEnemyDeath(p, enemy);
            }
          }
        }
      }
    } else if (weapon.canFire()) {
      const newProjectiles = weapon.fire(p, player, gameState.enemies);
      gameState.projectiles.push(...newProjectiles);
    }
  }
  
  // Update projectiles
  for (const proj of gameState.projectiles) {
    if (proj.dead) continue;
    
    proj.update();
    
    // Check collision with enemies
    if (proj.type === 'orbiting') {
      const pos = proj.getPosition();
      for (const enemy of gameState.enemies) {
        if (enemy.dead) continue;
        const dx = pos.x - enemy.x;
        const dy = pos.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < (proj.size + enemy.size) / 2) {
          if (proj.canHitEnemy(enemy)) {
            const killed = enemy.takeDamage(proj.damage);
            proj.hitEnemy(enemy);
            const particles = createHitParticles(enemy.x, enemy.y, [255, 150, 150]);
            gameState.particles.push(...particles);
            
            if (killed) {
              handleEnemyDeath(p, enemy);
            }
          }
        }
      }
    } else if (proj.constructor.name === 'HolyWaterProjectile') {
      // Area damage
      for (const enemy of gameState.enemies) {
        if (enemy.dead) continue;
        const dx = proj.x - enemy.x;
        const dy = proj.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < proj.areaSize / 2 && proj.canDamage()) {
          const killed = enemy.takeDamage(proj.damage);
          proj.dealDamage();
          const particles = createHitParticles(enemy.x, enemy.y, [100, 200, 255]);
          gameState.particles.push(...particles);
          
          if (killed) {
            handleEnemyDeath(p, enemy);
          }
        }
      }
    } else {
      // Regular projectile collision
      for (const enemy of gameState.enemies) {
        if (enemy.dead) continue;
        const dx = proj.x - enemy.x;
        const dy = proj.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < (proj.size + enemy.size) / 2) {
          const killed = enemy.takeDamage(proj.damage);
          proj.hitEnemy();
          const particles = createHitParticles(enemy.x, enemy.y, [150, 150, 255]);
          gameState.particles.push(...particles);
          
          if (killed) {
            handleEnemyDeath(p, enemy);
          }
        }
      }
    }
  }
  
  // Update pickups
  for (const pickup of gameState.pickups) {
    pickup.update(p, player);
    
    // Check collision with player
    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < (PLAYER_SIZE + 10) / 2) {
      const rewards = pickup.collect(player);
      if (rewards.xp > 0) {
        const leveledUp = player.gainXP(rewards.xp);
        if (leveledUp) {
          handleLevelUp(p);
        }
      }
      if (rewards.gold > 0) {
        gameState.gold += rewards.gold;
      }
    }
  }
  
  // Update particles
  for (const particle of gameState.particles) {
    particle.update();
  }
  
  // Clean up dead entities
  gameState.enemies = gameState.enemies.filter(e => !e.dead);
  gameState.projectiles = gameState.projectiles.filter(p => !p.dead);
  gameState.pickups = gameState.pickups.filter(p => !p.dead);
  gameState.particles = gameState.particles.filter(p => !p.dead);
  
  // Log player info periodically
  if (p.frameCount % 60 === 0) {
    logPlayerInfo(p, player);
  }
}

function handleEnemyDeath(p, enemy) {
  gameState.enemiesKilled++;
  gameState.score += 10;
  
  // Death particles
  const particles = createDeathParticles(enemy.x, enemy.y, 8, [200, 50, 50]);
  gameState.particles.push(...particles);
  
  // Drop pickups
  const roll = p.random(0, 100);
  if (roll < 80) {
    gameState.pickups.push(createPickup(enemy.x, enemy.y, 'xp'));
  }
  if (roll < 15) {
    gameState.pickups.push(createPickup(enemy.x, enemy.y, 'gold'));
  }
  if (roll < 5) {
    gameState.pickups.push(createPickup(enemy.x, enemy.y, 'health'));
  }
  if (roll > 95) {
    gameState.pickups.push(createPickup(enemy.x, enemy.y, 'big_xp'));
  }
}

function handleLevelUp(p) {
  gameState.levelUpPending = true;
  gameState.upgradeChoices = generateUpgradeChoices(gameState.player);
  gameState.selectedUpgrade = 0;
  
  logGameInfo(p, { event: 'level_up', level: gameState.player.level });
}

function handleLevelUpInput(inputs) {
  // Arrow keys to select
  if (inputs.leftPressed) {
    gameState.selectedUpgrade = Math.max(0, gameState.selectedUpgrade - 1);
  }
  if (inputs.rightPressed) {
    gameState.selectedUpgrade = Math.min(gameState.upgradeChoices.length - 1, gameState.selectedUpgrade + 1);
  }
  
  // Number keys or space to confirm
  if (inputs.spacePressed) {
    applyUpgrade(gameState.player, gameState.upgradeChoices[gameState.selectedUpgrade]);
    gameState.levelUpPending = false;
  }
  
  // Direct number selection (1, 2, 3)
  if (inputs.key === '1' && gameState.upgradeChoices.length > 0) {
    applyUpgrade(gameState.player, gameState.upgradeChoices[0]);
    gameState.levelUpPending = false;
  }
  if (inputs.key === '2' && gameState.upgradeChoices.length > 1) {
    applyUpgrade(gameState.player, gameState.upgradeChoices[1]);
    gameState.levelUpPending = false;
  }
  if (inputs.key === '3' && gameState.upgradeChoices.length > 2) {
    applyUpgrade(gameState.player, gameState.upgradeChoices[2]);
    gameState.levelUpPending = false;
  }
}

function logGameInfo(p, data) {
  p.logs.game_info.push({
    data: data,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerInfo(p, player) {
  p.logs.player_info.push({
    screen_x: player.x - gameState.camera.x + 300,
    screen_y: player.y - gameState.camera.y + 200,
    game_x: player.x,
    game_y: player.y,
    framecount: p.frameCount
  });
}