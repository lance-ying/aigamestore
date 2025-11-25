// game_logic.js - Core game logic and mechanics

import { 
  gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT,
  WEAPONS, LEVEL_ENEMY_COUNTS, LEVEL_INNOCENT_COUNTS,
  resetGameState
} from './globals.js';
import { Player, Enemy, Innocent, Bullet, Particle } from './entities.js';

export function initializeGame(p) {
  resetGameState();
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  // Create player
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  gameState.entities.push(gameState.player);
  
  // Set up level
  setupLevel(p, gameState.level);
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function setupLevel(p, level) {
  // Clear existing entities
  gameState.enemies = [];
  gameState.innocents = [];
  gameState.bullets = [];
  gameState.particles = [];
  gameState.entities = [gameState.player];
  
  const levelIndex = Math.min(level - 1, LEVEL_ENEMY_COUNTS.length - 1);
  const enemyCount = LEVEL_ENEMY_COUNTS[levelIndex];
  const innocentCount = LEVEL_INNOCENT_COUNTS[levelIndex];
  
  gameState.totalEnemies = enemyCount;
  gameState.enemiesKilled = 0;
  
  // Spawn enemies
  for (let i = 0; i < enemyCount; i++) {
    let x, y;
    do {
      x = p.random(50, CANVAS_WIDTH - 50);
      y = p.random(50, CANVAS_HEIGHT - 50);
    } while (p.dist(x, y, gameState.player.x, gameState.player.y) < 150);
    
    const enemy = new Enemy(x, y);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
  
  // Spawn innocents
  for (let i = 0; i < innocentCount; i++) {
    let x, y;
    do {
      x = p.random(50, CANVAS_WIDTH - 50);
      y = p.random(50, CANVAS_HEIGHT - 50);
    } while (p.dist(x, y, gameState.player.x, gameState.player.y) < 100);
    
    const gender = p.random() > 0.5 ? 'woman' : 'child';
    const innocent = new Innocent(x, y, gender);
    gameState.innocents.push(innocent);
    gameState.entities.push(innocent);
  }
  
  // Unlock weapons based on level
  if (level >= 2) gameState.weaponUnlocks[1] = true; // Shotgun at level 2
  if (level >= 4) gameState.weaponUnlocks[2] = true; // Rifle at level 4
}

export function updateGame(p, inputs) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Update player
  gameState.player.update(p, inputs);
  
  // Handle shooting
  if (inputs.shoot && gameState.player.shootCooldown <= 0) {
    shoot(p, gameState.player, inputs);
  }
  
  // Handle weapon switching
  if (inputs.switchWeapon) {
    switchWeapon();
  }
  
  // Update enemies
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    const enemy = gameState.enemies[i];
    const action = enemy.update(p, gameState.player);
    
    if (action.shoot) {
      enemyShoot(p, enemy, action.angle);
    }
  }
  
  // Update innocents
  for (let innocent of gameState.innocents) {
    innocent.update(p, gameState.player, gameState.bullets);
  }
  
  // Update bullets
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const bullet = gameState.bullets[i];
    const shouldRemove = bullet.update();
    
    if (shouldRemove) {
      gameState.bullets.splice(i, 1);
    }
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    const shouldRemove = particle.update();
    
    if (shouldRemove) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Check collisions
  checkCollisions(p);
  
  // Check win/lose conditions
  checkWinLoseConditions(p);
  
  // Log player info periodically
  if (p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

function shoot(p, player, inputs) {
  const weapon = WEAPONS[gameState.currentWeapon];
  
  // Check ammo
  if (weapon.ammo !== Infinity && weapon.ammo <= 0) {
    return;
  }
  
  player.shootCooldown = weapon.fireRate;
  
  // Calculate shooting direction (toward nearest enemy)
  let targetAngle = 0;
  if (gameState.enemies.length > 0) {
    let nearestEnemy = gameState.enemies[0];
    let minDist = p.dist(player.x, player.y, nearestEnemy.x, nearestEnemy.y);
    
    for (let enemy of gameState.enemies) {
      const dist = p.dist(player.x, player.y, enemy.x, enemy.y);
      if (dist < minDist) {
        minDist = dist;
        nearestEnemy = enemy;
      }
    }
    
    targetAngle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
  } else {
    targetAngle = 0; // Default direction
  }
  
  // Create bullet(s)
  const pellets = weapon.pellets || 1;
  for (let i = 0; i < pellets; i++) {
    const spread = weapon.spread || 0;
    const angle = targetAngle + (Math.random() - 0.5) * spread;
    const bullet = new Bullet(
      player.x + Math.cos(angle) * 15,
      player.y + Math.sin(angle) * 15,
      angle,
      weapon.bulletSpeed,
      weapon.damage,
      'player',
      weapon.color
    );
    gameState.bullets.push(bullet);
  }
  
  // Consume ammo
  if (weapon.ammo !== Infinity) {
    weapon.ammo--;
  }
  
  // Muzzle flash particles
  for (let i = 0; i < 3; i++) {
    const angle = targetAngle + (Math.random() - 0.5) * 0.5;
    const particle = new Particle(
      player.x + Math.cos(angle) * 15,
      player.y + Math.sin(angle) * 15,
      Math.cos(angle) * 3,
      Math.sin(angle) * 3,
      [255, 200, 100],
      4
    );
    gameState.particles.push(particle);
  }
}

function enemyShoot(p, enemy, angle) {
  const bullet = new Bullet(
    enemy.x + Math.cos(angle) * 12,
    enemy.y + Math.sin(angle) * 12,
    angle,
    6,
    5,
    'enemy',
    [255, 100, 100]
  );
  gameState.bullets.push(bullet);
  
  // Muzzle flash
  for (let i = 0; i < 2; i++) {
    const particleAngle = angle + (Math.random() - 0.5) * 0.3;
    const particle = new Particle(
      enemy.x + Math.cos(angle) * 12,
      enemy.y + Math.sin(angle) * 12,
      Math.cos(particleAngle) * 2,
      Math.sin(particleAngle) * 2,
      [255, 150, 100],
      3
    );
    gameState.particles.push(particle);
  }
}

function switchWeapon() {
  // Find next available weapon
  let nextWeapon = (gameState.currentWeapon + 1) % WEAPONS.length;
  let attempts = 0;
  
  while (!gameState.weaponUnlocks[nextWeapon] && attempts < WEAPONS.length) {
    nextWeapon = (nextWeapon + 1) % WEAPONS.length;
    attempts++;
  }
  
  if (gameState.weaponUnlocks[nextWeapon]) {
    gameState.currentWeapon = nextWeapon;
  }
}

function checkCollisions(p) {
  // Bullet collisions
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const bullet = gameState.bullets[i];
    let hitSomething = false;
    
    if (bullet.owner === 'player') {
      // Check enemy hits
      for (let j = gameState.enemies.length - 1; j >= 0; j--) {
        const enemy = gameState.enemies[j];
        if (p.collideCircleCircle(bullet.x, bullet.y, bullet.size, enemy.x, enemy.y, enemy.size)) {
          const died = enemy.takeDamage(bullet.damage);
          hitSomething = true;
          
          if (died) {
            // Enemy killed
            gameState.enemiesKilled++;
            gameState.score += 100;
            gameState.enemies.splice(j, 1);
            
            // Remove from entities
            const entityIndex = gameState.entities.indexOf(enemy);
            if (entityIndex > -1) {
              gameState.entities.splice(entityIndex, 1);
            }
            
            // Blood particles
            createBloodParticles(p, enemy.x, enemy.y);
          }
          break;
        }
      }
      
      // Check innocent hits - CRITICAL
      if (!hitSomething) {
        for (let innocent of gameState.innocents) {
          if (p.collideCircleCircle(bullet.x, bullet.y, bullet.size, innocent.x, innocent.y, innocent.size)) {
            // GAME OVER - killed an innocent
            gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
            p.logs.game_info.push({
              data: { phase: "GAME_OVER_LOSE", reason: "innocent_killed" },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
            hitSomething = true;
            break;
          }
        }
      }
    } else if (bullet.owner === 'enemy') {
      // Check player hit
      if (p.collideCircleCircle(bullet.x, bullet.y, bullet.size, 
          gameState.player.x, gameState.player.y, gameState.player.size)) {
        gameState.player.takeDamage(bullet.damage);
        hitSomething = true;
        
        // Hit particles
        for (let k = 0; k < 5; k++) {
          const particle = new Particle(
            bullet.x,
            bullet.y,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            [255, 100, 100],
            3
          );
          gameState.particles.push(particle);
        }
      }
    }
    
    if (hitSomething) {
      gameState.bullets.splice(i, 1);
    }
  }
  
  // Enemy-player collision (melee damage)
  for (let enemy of gameState.enemies) {
    if (p.collideCircleCircle(gameState.player.x, gameState.player.y, gameState.player.size,
        enemy.x, enemy.y, enemy.size)) {
      gameState.player.takeDamage(1);
    }
  }
}

function createBloodParticles(p, x, y) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const particle = new Particle(
      x,
      y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      [200, 0, 0],
      Math.random() * 3 + 2
    );
    gameState.particles.push(particle);
  }
}

function checkWinLoseConditions(p) {
  // Check if player died
  if (gameState.player.health <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", reason: "player_died" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Check if all enemies killed
  if (gameState.enemiesKilled >= gameState.totalEnemies) {
    // Level complete
    gameState.level++;
    gameState.score += 500;
    
    // Check if game won (completed multiple levels)
    if (gameState.level > 3) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", final_score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else {
      // Continue to next level
      setupLevel(p, gameState.level);
      p.logs.game_info.push({
        data: { phase: "LEVEL_COMPLETE", level: gameState.level - 1 },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}