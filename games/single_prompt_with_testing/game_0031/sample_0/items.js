// items.js - XP gems and particle effects

import { gameState } from './globals.js';

export class XPGem {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.size = 6 + value;
    this.pullRadius = 80;
    this.pullSpeed = 4;
    this.lifetime = 600; // 10 seconds
    this.age = 0;
    this.color = this.getColorForValue(value);
    this.floatOffset = Math.random() * Math.PI * 2;
  }
  
  getColorForValue(value) {
    if (value >= 8) return [200, 100, 255]; // Purple for high value
    if (value >= 5) return [100, 200, 255]; // Blue for medium
    return [100, 255, 150]; // Green for low
  }
  
  update(p, player) {
    this.age++;
    
    // Floating animation
    const floatY = Math.sin(p.frameCount * 0.05 + this.floatOffset) * 2;
    this.y += floatY * 0.1;
    
    // Pull toward player if in range
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < this.pullRadius) {
      const pullStrength = 1 - (dist / this.pullRadius);
      this.x += (dx / dist) * this.pullSpeed * pullStrength;
      this.y += (dy / dist) * this.pullSpeed * pullStrength;
    }
    
    // Check collection
    if (dist < player.size + this.size) {
      player.gainXP(this.value);
      gameState.score += this.value;
      
      // Create collection particles
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        gameState.particles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * 2,
          vy: Math.sin(angle) * 2,
          life: 20,
          color: this.color,
          size: 4
        });
      }
      
      return true; // Collected
    }
    
    return this.age >= this.lifetime; // Expired
  }
  
  draw(p) {
    p.push();
    
    // Glow
    p.fill(...this.color, 50);
    p.noStroke();
    p.ellipse(this.x, this.y, this.size * 2.5, this.size * 2.5);
    
    // Gem
    p.fill(...this.color);
    p.stroke(255);
    p.strokeWeight(1);
    
    // Diamond shape
    p.beginShape();
    p.vertex(this.x, this.y - this.size);
    p.vertex(this.x + this.size, this.y);
    p.vertex(this.x, this.y + this.size);
    p.vertex(this.x - this.size, this.y);
    p.endShape(p.CLOSE);
    
    // Shine effect
    p.fill(255, 200);
    p.noStroke();
    p.ellipse(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.5, this.size * 0.5);
    
    p.pop();
  }
}

export function createXPGem(x, y, value) {
  const gem = new XPGem(x, y, value);
  gameState.xpGems.push(gem);
  gameState.entities.push(gem);
}

export function updateParticles(p) {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.95;
    particle.vy *= 0.95;
    particle.life--;
    
    if (particle.life <= 0) {
      gameState.particles.splice(i, 1);
    }
  }
}

export function drawParticles(p) {
  for (const particle of gameState.particles) {
    const alpha = (particle.life / 30) * 255;
    p.fill(...particle.color, alpha);
    p.noStroke();
    p.ellipse(particle.x, particle.y, particle.size, particle.size);
  }
}