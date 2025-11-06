// particles.js - Particle system
import { gameState } from './globals.js';

export function updateParticles() {
  gameState.particles = gameState.particles.filter(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.3; // Gravity
    particle.life--;
    return particle.life > 0;
  });
}

export function renderParticles(p) {
  gameState.particles.forEach(particle => {
    p.push();
    const alpha = p.map(particle.life, 0, 30, 0, 255);
    p.fill(...particle.color.slice(0, 3), alpha);
    p.noStroke();
    p.ellipse(particle.x, particle.y, particle.size, particle.size);
    p.pop();
  });
}

export function updateDrops(p) {
  gameState.drops = gameState.drops.filter(drop => {
    if (drop.collected) return false;
    
    // Bob animation
    drop.bobOffset += 0.05;
    
    // Check collision with player
    if (gameState.player) {
      const dist = p.dist(drop.x, drop.y, gameState.player.x, gameState.player.y);
      if (dist < 30) {
        // Collect
        if (drop.type === "health") {
          gameState.player.health = p.min(gameState.player.maxHealth, gameState.player.health + 20);
        } else if (drop.type === "mana") {
          gameState.player.mana = p.min(gameState.player.maxMana, gameState.player.mana + 30);
        }
        
        // Collection particles
        for (let i = 0; i < 10; i++) {
          const angle = p.random(p.TWO_PI);
          const speed = p.random(2, 5);
          gameState.particles.push({
            x: drop.x,
            y: drop.y,
            vx: p.cos(angle) * speed,
            vy: p.sin(angle) * speed - 2,
            life: 20,
            color: drop.type === "health" ? [100, 255, 100] : [100, 150, 255],
            size: 4
          });
        }
        
        drop.collected = true;
      }
    }
    
    return !drop.collected;
  });
}

export function renderDrops(p) {
  gameState.drops.forEach(drop => {
    const bobY = drop.y + p.sin(drop.bobOffset) * 5;
    
    p.push();
    p.translate(drop.x, bobY);
    
    if (drop.type === "health") {
      p.fill(100, 255, 100);
      p.noStroke();
      p.rect(-drop.size / 2, -drop.size / 4, drop.size, drop.size / 2);
      p.rect(-drop.size / 4, -drop.size / 2, drop.size / 2, drop.size);
    } else if (drop.type === "mana") {
      p.fill(100, 150, 255);
      p.noStroke();
      p.ellipse(0, 0, drop.size, drop.size);
      p.fill(150, 200, 255);
      p.ellipse(-2, -2, drop.size / 3, drop.size / 3);
    }
    
    p.pop();
  });
}