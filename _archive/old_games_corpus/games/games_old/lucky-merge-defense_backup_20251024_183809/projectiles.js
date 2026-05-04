// projectiles.js - Projectile management
import { gameState } from './globals.js';

export function updateProjectiles(p) {
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    
    if (proj.isDead || !proj.target || proj.target.isDead) {
      gameState.projectiles.splice(i, 1);
      continue;
    }
    
    // Move towards target
    proj.targetX = proj.target.x;
    proj.targetY = proj.target.y;
    
    const dx = proj.targetX - proj.x;
    const dy = proj.targetY - proj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < proj.speed) {
      // Hit target
      proj.target.takeDamage(proj.damage);
      gameState.projectiles.splice(i, 1);
    } else {
      proj.x += (dx / dist) * proj.speed;
      proj.y += (dy / dist) * proj.speed;
    }
  }
}

export function drawProjectiles(p) {
  for (const proj of gameState.projectiles) {
    p.push();
    p.noStroke();
    
    if (proj.type === 'Archer') {
      p.fill(139, 69, 19);
      p.ellipse(proj.x, proj.y, 8, 3);
    } else if (proj.type === 'Mage') {
      p.fill(200, 100, 255);
      p.circle(proj.x, proj.y, 6);
      // Glow
      p.fill(200, 100, 255, 100);
      p.circle(proj.x, proj.y, 10);
    } else if (proj.type === 'Cannon') {
      p.fill(80, 80, 80);
      p.circle(proj.x, proj.y, 10);
    }
    
    p.pop();
  }
}