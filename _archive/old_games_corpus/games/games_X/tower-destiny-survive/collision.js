// collision.js - Collision detection and handling
import { gameState } from './globals.js';
import { Particle } from './entities.js';

export function checkCollisions(p) {
  // Bullet-Zombie collisions
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    const bullet = gameState.bullets[i];
    if (!bullet.active) continue;
    
    for (let j = gameState.zombies.length - 1; j >= 0; j--) {
      const zombie = gameState.zombies[j];
      if (!zombie.active) continue;
      
      const distance = Math.sqrt(
        Math.pow(bullet.x - zombie.x, 2) + 
        Math.pow(bullet.y - zombie.y, 2)
      );
      
      if (distance < bullet.radius + zombie.width / 2) {
        bullet.active = false;
        const killed = zombie.takeDamage(bullet.damage);
        
        // Create hit particles
        createHitParticles(p, bullet.x, bullet.y, killed ? [255, 200, 100] : [255, 255, 255]);
        
        break;
      }
    }
  }
  
  // Update combo timer
  if (gameState.comboTimer > 0) {
    gameState.comboTimer--;
    if (gameState.comboTimer === 0) {
      gameState.comboCount = 0;
      gameState.comboMultiplier = 1;
    }
  }
  
  // Remove inactive entities
  gameState.bullets = gameState.bullets.filter(b => b.active);
  gameState.zombies = gameState.zombies.filter(z => z.active);
  gameState.blocks = gameState.blocks.filter(b => b.active);
  gameState.particles = gameState.particles.filter(p => p.active);
  gameState.powerups = gameState.powerups.filter(p => p.active);
}

function createHitParticles(p, x, y, color) {
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5;
    const speed = 1 + Math.random() * 2;
    const particle = new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color,
      15 + Math.floor(Math.random() * 10)
    );
    gameState.particles.push(particle);
  }
}