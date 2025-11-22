// particles.js - Particle effects and gold drops
import { GROUND_Y, GRAVITY } from './globals.js';

export function updateParticles(particles) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3;
    p.life--;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

export function renderParticles(p, particles) {
  p.push();
  p.noStroke();
  
  for (const particle of particles) {
    const alpha = (particle.life / 60) * 255;
    p.fill(...particle.color, alpha);
    p.circle(particle.x, particle.y, particle.size);
  }
  
  p.pop();
}

export function updateGoldDrops(goldDrops, player) {
  for (let i = goldDrops.length - 1; i >= 0; i--) {
    const gold = goldDrops[i];
    
    // Physics
    gold.x += gold.vx;
    gold.y += gold.vy;
    gold.vy += GRAVITY * 0.5;
    
    if (gold.y > GROUND_Y - 10) {
      gold.y = GROUND_Y - 10;
      gold.vy *= -0.4;
      gold.vx *= 0.8;
    }
    
    gold.vx *= 0.95;
    gold.lifetime--;
    
    // Collection check
    if (player) {
      const dx = gold.x - (player.x + player.width / 2);
      const dy = gold.y - (player.y + player.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 30) {
        goldDrops.splice(i, 1);
        return gold.value;
      }
    }
    
    if (gold.lifetime <= 0) {
      goldDrops.splice(i, 1);
    }
  }
  
  return 0;
}

export function renderGoldDrops(p, goldDrops) {
  p.push();
  
  for (const gold of goldDrops) {
    p.fill(255, 220, 0);
    p.stroke(200, 150, 0);
    p.strokeWeight(2);
    p.circle(gold.x, gold.y, 12);
    
    p.fill(255, 240, 100);
    p.noStroke();
    p.circle(gold.x - 2, gold.y - 2, 4);
  }
  
  p.pop();
}

export function createHitEffect(particles, x, y) {
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * -4 - 2,
      size: Math.random() * 6 + 3,
      life: 30,
      color: [255, 200, 100]
    });
  }
}

export function createSkillEffect(particles, x, y, skillType) {
  const count = skillType === 'fury' ? 15 : 8;
  const color = skillType === 'fury' ? [255, 100, 200] : [150, 150, 255];
  
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 10,
      vy: Math.random() * -8,
      size: Math.random() * 10 + 5,
      life: 45,
      color: color
    });
  }
}