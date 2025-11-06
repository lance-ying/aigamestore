// collision.js - Collision detection and handling

import { gameState } from './globals.js';
import { Particle } from './entities.js';

export function checkBulletCollisions(p) {
  for (let bullet of gameState.bullets) {
    if (!bullet.active) continue;
    
    // Check collision with cover
    for (let cover of gameState.cover) {
      if (p.collideCircleCircle(
        bullet.x, bullet.y, 4,
        cover.x, cover.y, cover.radius
      )) {
        bullet.active = false;
        createImpactParticles(p, bullet.x, bullet.y);
        break;
      }
    }
    
    if (!bullet.active) continue;
    
    if (bullet.friendly) {
      // Check collision with enemies
      for (let enemy of gameState.enemies) {
        const dist = Math.sqrt((bullet.x - enemy.x) ** 2 + (bullet.y - enemy.y) ** 2);
        if (dist < enemy.width / 2) {
          // Check for flanking
          const angleToEnemy = Math.atan2(enemy.y - bullet.y, enemy.x - bullet.x);
          let angleDiff = angleToEnemy - enemy.angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          
          const isFlanking = Math.abs(angleDiff) > Math.PI / 2;
          
          const killed = enemy.takeDamage(bullet.damage, isFlanking);
          bullet.active = false;
          
          if (killed) {
            gameState.enemiesKilled++;
            gameState.score += isFlanking ? 150 : 100;
            createDeathParticles(p, enemy.x, enemy.y);
          } else {
            createImpactParticles(p, bullet.x, bullet.y);
          }
          
          // Alert nearby enemies if not silenced
          if (!bullet.silenced) {
            alertNearbyEnemies(enemy.x, enemy.y, 200);
          }
          
          break;
        }
      }
    } else {
      // Check collision with player
      if (gameState.player) {
        const dist = Math.sqrt(
          (bullet.x - gameState.player.x) ** 2 + 
          (bullet.y - gameState.player.y) ** 2
        );
        if (dist < gameState.player.width / 2) {
          gameState.player.takeDamage(bullet.damage);
          bullet.active = false;
          createImpactParticles(p, bullet.x, bullet.y);
        }
      }
    }
  }
  
  // Remove inactive bullets
  gameState.bullets = gameState.bullets.filter(b => b.active);
}

export function checkBoundaries(entity, worldWidth, worldHeight) {
  entity.x = Math.max(entity.width / 2, Math.min(worldWidth - entity.width / 2, entity.x));
  entity.y = Math.max(entity.height / 2, Math.min(worldHeight - entity.height / 2, entity.y));
}

export function checkCoverCollision(entity, p) {
  for (let cover of gameState.cover) {
    const dist = Math.sqrt((entity.x - cover.x) ** 2 + (entity.y - cover.y) ** 2);
    const minDist = entity.width / 2 + cover.radius;
    
    if (dist < minDist) {
      // Push entity away from cover
      const angle = Math.atan2(entity.y - cover.y, entity.x - cover.x);
      const overlap = minDist - dist;
      entity.x += Math.cos(angle) * overlap;
      entity.y += Math.sin(angle) * overlap;
    }
  }
}

export function alertNearbyEnemies(x, y, radius) {
  for (let enemy of gameState.enemies) {
    const dist = Math.sqrt((enemy.x - x) ** 2 + (enemy.y - y) ** 2);
    if (dist < radius) {
      enemy.alertness = Math.min(100, enemy.alertness + 30);
      enemy.state = "alert";
      enemy.lastSeenPlayerX = x;
      enemy.lastSeenPlayerY = y;
    }
  }
}

function createImpactParticles(p, x, y) {
  for (let i = 0; i < 5; i++) {
    const angle = p.random(0, Math.PI * 2);
    const speed = p.random(1, 3);
    const particle = new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      [200, 200, 200],
      10
    );
    gameState.particles.push(particle);
  }
}

function createDeathParticles(p, x, y) {
  for (let i = 0; i < 10; i++) {
    const angle = p.random(0, Math.PI * 2);
    const speed = p.random(2, 4);
    const particle = new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      [255, 50, 50],
      20
    );
    gameState.particles.push(particle);
  }
}