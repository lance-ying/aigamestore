// collision.js - Collision detection and handling
import { gameState, GAME_PHASES } from './globals.js';
import { Particle } from './entities.js';

export function checkCollisions(p) {
  const player = gameState.player;
  if (!player) return;
  
  // Projectile collisions
  for (const proj of gameState.projectiles) {
    if (!proj.active) continue;
    
    if (proj.source === 'player') {
      // Check wild pals
      for (const pal of gameState.wildPals) {
        if (!pal.active) continue;
        if (p.collideCircleCircle(proj.x, proj.y, proj.radius * 2, pal.x, pal.y, pal.radius * 2)) {
          pal.takeDamage(proj.damage);
          proj.active = false;
          createHitParticles(p, pal.x, pal.y, pal.palData.color);
          
          if (pal.health <= 0) {
            pal.active = false;
            gameState.score += 10;
            createDeathParticles(p, pal.x, pal.y, pal.palData.color);
          }
          break;
        }
      }
      
      // Check poachers
      for (const poacher of gameState.poachers) {
        if (!poacher.active) continue;
        if (p.collideCircleCircle(proj.x, proj.y, proj.radius * 2, poacher.x, poacher.y, poacher.radius * 2)) {
          poacher.takeDamage(proj.damage);
          proj.active = false;
          createHitParticles(p, poacher.x, poacher.y, [200, 50, 50]);
          
          if (poacher.health <= 0) {
            poacher.active = false;
            gameState.score += 25;
            gameState.resources.food += 5;
            createDeathParticles(p, poacher.x, poacher.y, [200, 50, 50]);
          }
          break;
        }
      }
    } else if (proj.source === 'poacher') {
      if (p.collideCircleCircle(proj.x, proj.y, proj.radius * 2, player.x, player.y, player.radius * 2)) {
        player.takeDamage(proj.damage);
        proj.active = false;
        createHitParticles(p, player.x, player.y, [255, 200, 200]);
      }
    }
  }
  
  // Poacher melee attacks
  for (const poacher of gameState.poachers) {
    if (!poacher.active) continue;
    
    const dx = player.x - poacher.x;
    const dy = player.y - poacher.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < player.radius + poacher.radius + 5) {
      if (poacher.canAttack()) {
        player.takeDamage(10);
        poacher.attack();
        createHitParticles(p, player.x, player.y, [255, 100, 100]);
      }
    }
    
    // Check if poacher steals pals
    for (const pal of gameState.capturedPals) {
      if (!pal.assignedStation) {
        const pdx = pal.x - poacher.x;
        const pdy = pal.y - poacher.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        
        if (pdist < pal.radius + poacher.radius + 5) {
          // Steal the pal
          pal.active = false;
          poacher.active = false;
          createDeathParticles(p, pal.x, pal.y, [255, 255, 0]);
          gameState.score -= 20;
          break;
        }
      }
    }
  }
}

export function createHitParticles(p, x, y, color) {
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    const particle = new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color,
      3,
      20
    );
    gameState.particles.push(particle);
    gameState.entities.push(particle);
  }
}

export function createDeathParticles(p, x, y, color) {
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    const particle = new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      color,
      4,
      30
    );
    gameState.particles.push(particle);
    gameState.entities.push(particle);
  }
}

export function createCaptureParticles(p, x, y) {
  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    const particle = new Particle(
      x, y,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      [255, 255, 100],
      5,
      40
    );
    gameState.particles.push(particle);
    gameState.entities.push(particle);
  }
}