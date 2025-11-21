// collision_manager.js - Handles all collision detection

import { gameState } from './globals.js';
import { Particle } from './particle.js';
import { Pickup } from './pickup.js';

export class CollisionManager {
  constructor(p) {
    this.p = p;
  }
  
  checkCollisions() {
    this.checkPlayerBullets();
    this.checkEnemyBullets();
  }
  
  checkPlayerBullets() {
    const p = this.p;
    
    for (let bullet of gameState.bullets) {
      if (bullet.isDead) continue;
      
      for (let enemy of gameState.enemies) {
        if (enemy.isDead) continue;
        
        const dist = p.dist(bullet.x, bullet.y, enemy.x, enemy.y);
        if (dist < bullet.radius + enemy.width / 2) {
          bullet.isDead = true;
          
          const killed = enemy.takeDamage(bullet.damage);
          
          // Create hit particles
          this.createHitEffect(enemy.x, enemy.y);
          
          if (killed) {
            gameState.enemiesDefeated++;
            gameState.score += enemy.score;
            
            // Create explosion
            this.createExplosion(enemy.x, enemy.y);
            
            // Spawn pickup (30% chance)
            if (p.random(100) < 30) {
              this.spawnPickup(enemy.x, enemy.y);
            }
          }
          
          break;
        }
      }
    }
  }
  
  checkEnemyBullets() {
    const p = this.p;
    
    if (!gameState.player || gameState.player.isDead) return;
    
    for (let bullet of gameState.enemyBullets) {
      if (bullet.isDead) continue;
      
      const dist = p.dist(bullet.x, bullet.y, gameState.player.x, gameState.player.y);
      if (dist < bullet.radius + 15) {
        bullet.isDead = true;
        gameState.player.takeDamage(bullet.damage);
        
        if (!gameState.player.isDashing && !gameState.player.isShielded) {
          this.createHitEffect(gameState.player.x, gameState.player.y);
        }
      }
    }
  }
  
  createExplosion(x, y) {
    for (let i = 0; i < 15; i++) {
      const particle = new Particle(this.p, x, y, 'explosion');
      gameState.particles.push(particle);
    }
  }
  
  createHitEffect(x, y) {
    for (let i = 0; i < 5; i++) {
      const particle = new Particle(this.p, x, y, 'hit');
      gameState.particles.push(particle);
    }
  }
  
  spawnPickup(x, y) {
    const types = ['damage', 'fireRate', 'speed', 'health'];
    const type = this.p.random(types);
    const pickup = new Pickup(this.p, x, y, type);
    gameState.pickups.push(pickup);
  }
}