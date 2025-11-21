import { gameState } from './globals.js';

export function updateProjectiles(p) {
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    
    // Move
    proj.x += proj.vx;
    proj.y += proj.vy;
    proj.lifetime--;
    
    // Remove if expired or off-screen
    if (proj.lifetime <= 0 || proj.x < -50 || proj.x > 650 || proj.y < -50 || proj.y > 450) {
      gameState.projectiles.splice(i, 1);
      continue;
    }
    
    // Check collisions
    if (proj.owner === 'player') {
      // Hit enemies
      for (let j = gameState.enemies.length - 1; j >= 0; j--) {
        const enemy = gameState.enemies[j];
        
        // Skip if already hit by this projectile (for piercing)
        if (proj.piercing && proj.hitEnemies.has(enemy)) continue;
        
        const dist = p.dist(proj.x, proj.y, enemy.x, enemy.y);
        if (dist < proj.radius + enemy.radius) {
          // Apply damage with crit chance
          let damage = proj.damage;
          if (Math.random() < gameState.player.critChance) {
            damage *= gameState.player.critDamage;
          }
          
          const died = enemy.takeDamage(damage);
          
          if (died) {
            gameState.enemies.splice(j, 1);
            const entityIndex = gameState.entities.indexOf(enemy);
            if (entityIndex !== -1) gameState.entities.splice(entityIndex, 1);
            
            // Check if it was the boss
            if (enemy === gameState.currentBoss) {
              gameState.currentBoss = null;
            }
          }
          
          if (proj.piercing) {
            proj.hitEnemies.add(enemy);
          } else {
            gameState.projectiles.splice(i, 1);
            break;
          }
        }
      }
    } else if (proj.owner === 'enemy') {
      // Hit player
      if (gameState.player && !gameState.player.invulnerable) {
        const dist = p.dist(proj.x, proj.y, gameState.player.x, gameState.player.y);
        if (dist < proj.radius + gameState.player.radius) {
          gameState.player.takeDamage(proj.damage);
          gameState.projectiles.splice(i, 1);
          gameState.cameraShake = 5;
        }
      }
    }
  }
}

export function updateExperienceOrbs(p) {
  for (let i = gameState.experienceOrbs.length - 1; i >= 0; i--) {
    const orb = gameState.experienceOrbs[i];
    
    // Friction
    orb.vx *= 0.95;
    orb.vy *= 0.95;
    
    orb.x += orb.vx;
    orb.y += orb.vy;
    
    orb.life--;
    if (orb.life <= 0) {
      gameState.experienceOrbs.splice(i, 1);
    }
  }
}

export function updateParticles(p) {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.life--;
    
    // Fade and slow down
    particle.vx *= 0.95;
    particle.vy *= 0.95;
    
    if (particle.life <= 0) {
      gameState.particles.splice(i, 1);
    }
  }
}