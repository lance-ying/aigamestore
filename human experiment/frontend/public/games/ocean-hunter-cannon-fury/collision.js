import { gameState, PROJECTILE_DAMAGE, UPGRADES } from './globals.js';
import { Particle, FloatingText } from './entities.js';

export function checkCollisions(p) {
  // Check projectile-fish collisions
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const projectile = gameState.projectiles[i];
    if (!projectile.active) continue;
    
    let hitAnyFish = false;
    
    for (let j = gameState.fish.length - 1; j >= 0; j--) {
      const fish = gameState.fish[j];
      if (!fish.active) continue;
      
      const distance = p.dist(projectile.x, projectile.y, fish.x, fish.y);
      
      if (distance < projectile.radius + fish.radius) {
        // Collision detected
        hitAnyFish = true;
        
        // Only deactivate if not piercing or hit max targets
        if (!projectile.piercing) {
          projectile.active = false;
        } else {
          projectile.hitCount++;
          if (projectile.hitCount >= 3) {
            projectile.active = false;
          }
        }
        
        const damageMultiplier = UPGRADES.DAMAGE.levels[gameState.upgrades.damage];
        const totalDamage = PROJECTILE_DAMAGE * damageMultiplier;
        
        const destroyed = fish.takeDamage(totalDamage);
        
        if (destroyed) {
          // Create particles
          for (let k = 0; k < 10; k++) {
            gameState.particles.push(new Particle(fish.x, fish.y, p));
          }
          
          // Add score
          gameState.score += fish.points;
          gameState.totalGameScore += fish.points;
          
          // Create floating text
          gameState.floatingTexts.push(
            new FloatingText(`+${fish.points}`, fish.x, fish.y, p)
          );
          
          // Remove fish
          fish.active = false;
        }
        
        if (!projectile.piercing) {
          break;
        }
      }
    }
  }
  
  // Remove inactive projectiles
  gameState.projectiles = gameState.projectiles.filter(p => p.active);
  
  // Remove inactive fish
  gameState.fish = gameState.fish.filter(f => f.active);
  gameState.entities = gameState.entities.filter(e => e === gameState.player || e.active);
}