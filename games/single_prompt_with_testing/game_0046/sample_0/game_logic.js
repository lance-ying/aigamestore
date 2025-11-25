// game_logic.js
import { gameState, GAME_PHASES, CANVAS_WIDTH } from './globals.js';
import { Particle } from './particle.js';
import { Projectile } from './projectile.js';

export function updateGameLogic(p, inputHandler) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Update player
  if (gameState.player) {
    gameState.player.update(inputHandler.keys);
    
    // Player actions
    if (inputHandler.keysPressedThisFrame.attack) {
      const attackData = gameState.player.attack();
      if (attackData) {
        checkPlayerAttack(p, attackData);
      }
    }
    
    if (inputHandler.keysPressedThisFrame.special) {
      gameState.player.dash();
    }
    
    if (inputHandler.keysPressedThisFrame.switch) {
      gameState.player.switchSkull();
    }
    
    // Check player death
    if (gameState.player.health <= 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, reason: 'player_death' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Update camera
    gameState.cameraX = Math.max(0, Math.min(gameState.player.x - CANVAS_WIDTH / 3, gameState.worldWidth - CANVAS_WIDTH));
  }
  
  // Update enemies
  for (const enemy of gameState.enemies) {
    if (!enemy.dead) {
      enemy.update();
      
      // Enemy attacks player
      const attackHitbox = enemy.getAttackHitbox();
      if (attackHitbox && gameState.player) {
        if (checkCollision(gameState.player, attackHitbox)) {
          if (gameState.player.takeDamage(attackHitbox.damage)) {
            spawnHitParticles(p, gameState.player.x + gameState.player.width / 2, gameState.player.y + gameState.player.height / 2, [255, 100, 100]);
          }
        }
      }
    }
  }
  
  // Update boss
  if (gameState.boss && !gameState.boss.dead) {
    gameState.boss.update();
    
    // Boss attacks
    const bossAttack = gameState.boss.getAttackData();
    if (bossAttack) {
      if (bossAttack.type === 'melee') {
        if (gameState.player && checkCollision(gameState.player, bossAttack)) {
          if (gameState.player.takeDamage(bossAttack.damage)) {
            spawnHitParticles(p, gameState.player.x + gameState.player.width / 2, gameState.player.y + gameState.player.height / 2, [255, 100, 100]);
          }
        }
      } else if (bossAttack.type === 'projectile') {
        const proj = new Projectile(p, bossAttack.x, bossAttack.y, bossAttack.vx, bossAttack.vy, 'boss');
        gameState.projectiles.push(proj);
      } else if (bossAttack.type === 'aoe') {
        if (gameState.player && checkCollision(gameState.player, bossAttack)) {
          if (gameState.player.takeDamage(bossAttack.damage)) {
            spawnHitParticles(p, gameState.player.x + gameState.player.width / 2, gameState.player.y + gameState.player.height / 2, [255, 100, 100]);
          }
        }
        // Visual effect
        for (let i = 0; i < 20; i++) {
          spawnParticle(p, bossAttack.x + p.random(bossAttack.width), bossAttack.y, p.random(-2, 2), p.random(-5, -2), [150, 50, 200], p.random(4, 8), 30);
        }
      }
    }
    
    // Check boss defeated
    if (gameState.boss.dead && !gameState.bossDefeated) {
      gameState.bossDefeated = true;
      gameState.score += 500;
      spawnDeathParticles(p, gameState.boss.x + gameState.boss.width / 2, gameState.boss.y + gameState.boss.height / 2);
      
      // Win condition
      setTimeout(() => {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, reason: 'boss_defeated' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }, 1000);
    }
  }
  
  // Update projectiles
  for (const proj of gameState.projectiles) {
    proj.update();
    
    if (!proj.dead && gameState.player && proj.owner !== 'player') {
      if (checkCollision(gameState.player, proj)) {
        if (gameState.player.takeDamage(proj.damage)) {
          spawnHitParticles(p, gameState.player.x + gameState.player.width / 2, gameState.player.y + gameState.player.height / 2, [255, 100, 100]);
        }
        proj.dead = true;
      }
    }
  }
  
  // Update pickups
  for (const pickup of gameState.pickups) {
    if (!pickup.collected) {
      pickup.update();
      
      if (gameState.player && checkCollision(gameState.player, pickup)) {
        pickup.collected = true;
        
        if (pickup.type === 'health') {
          gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + 50);
          gameState.score += 50;
        } else {
          if (gameState.player.addSkull(pickup.type)) {
            gameState.score += 100;
          }
        }
        
        spawnCollectParticles(p, pickup.x, pickup.y);
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
  gameState.particles = gameState.particles.filter(p => !p.dead);
  
  // Log player info periodically
  if (p.frameCount % 30 === 0 && gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.x - gameState.cameraX,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

function checkCollision(obj1, obj2) {
  return obj1.x < obj2.x + obj2.width &&
         obj1.x + obj1.width > obj2.x &&
         obj1.y < obj2.y + obj2.height &&
         obj1.y + obj1.height > obj2.y;
}

function checkPlayerAttack(p, attackData) {
  // Check against enemies
  for (const enemy of gameState.enemies) {
    if (!enemy.dead && checkCollision(enemy, attackData)) {
      if (enemy.takeDamage(attackData.damage)) {
        gameState.score += enemy.type === 'elite' ? 50 : 25;
        gameState.enemiesDefeated++;
        spawnDeathParticles(p, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
      } else {
        spawnHitParticles(p, enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, [255, 200, 100]);
      }
    }
  }
  
  // Check against boss
  if (gameState.boss && !gameState.boss.dead && checkCollision(gameState.boss, attackData)) {
    if (gameState.boss.takeDamage(attackData.damage)) {
      gameState.score += 500;
      spawnDeathParticles(p, gameState.boss.x + gameState.boss.width / 2, gameState.boss.y + gameState.boss.height / 2);
    } else {
      spawnHitParticles(p, gameState.boss.x + gameState.boss.width / 2, gameState.boss.y + gameState.boss.height / 2, [255, 200, 100]);
    }
  }
}

function spawnParticle(p, x, y, vx, vy, color, size, lifetime) {
  const particle = new Particle(p, x, y, vx, vy, color, size, lifetime);
  gameState.particles.push(particle);
}

function spawnHitParticles(p, x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const speed = 3;
    spawnParticle(p, x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 4, 20);
  }
}

function spawnDeathParticles(p, x, y) {
  for (let i = 0; i < 15; i++) {
    spawnParticle(p, x, y, p.random(-4, 4), p.random(-6, -2), [200, 200, 200], p.random(3, 7), 40);
  }
}

function spawnCollectParticles(p, x, y) {
  for (let i = 0; i < 10; i++) {
    spawnParticle(p, x, y, p.random(-3, 3), p.random(-5, -1), [255, 255, 150], p.random(2, 5), 30);
  }
}