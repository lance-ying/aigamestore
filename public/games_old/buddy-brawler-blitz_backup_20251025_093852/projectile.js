// projectile.js - Projectile entities
import { gameState } from './globals.js';
import { createImpactParticles, createExplosionParticles } from './particle.js';

export class Projectile {
  constructor(p, Matter, x, y, vx, vy, type) {
    this.p = p;
    this.Matter = Matter;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.type = type;
    this.lifetime = 200;
    this.active = true;
  }
  
  update(buddy) {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.1; // gravity for grenades
    this.lifetime--;
    
    if (this.lifetime <= 0) {
      this.active = false;
    }
    
    // Check collision with buddy
    for (let part of buddy.parts) {
      const dx = part.position.x - this.x;
      const dy = part.position.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 20) {
        this.onHit(buddy, part);
        return;
      }
    }
  }
  
  onHit(buddy, part) {
    const Body = this.Matter.Body;
    
    if (this.type === 'pistol') {
      const forceScale = 0.002;
      Body.applyForce(part, part.position, {
        x: this.vx * forceScale,
        y: this.vy * forceScale
      });
      
      const isHead = part === buddy.head;
      const points = isHead ? 25 : 20;
      gameState.score += points;
      
      this.addCombo();
      
      const particles = createImpactParticles(this.p, this.x, this.y, [255, 100, 100], 8);
      gameState.particles.push(...particles);
      
    } else if (this.type === 'grenade') {
      // Explosion effect
      for (let buddyPart of buddy.parts) {
        const dx = buddyPart.position.x - this.x;
        const dy = buddyPart.position.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 80) {
          const force = 0.005 * (1 - dist / 80);
          const angle = Math.atan2(dy, dx);
          Body.applyForce(buddyPart, buddyPart.position, {
            x: Math.cos(angle) * force,
            y: Math.sin(angle) * force
          });
        }
      }
      
      gameState.score += 50;
      this.addCombo();
      
      const particles = createExplosionParticles(this.p, this.x, this.y, 30);
      gameState.particles.push(...particles);
    }
    
    this.active = false;
  }
  
  addCombo() {
    const currentTime = Date.now();
    if (currentTime - gameState.lastHitTime < 1000) {
      gameState.comboCount++;
      if (gameState.comboCount >= 3) {
        const comboBonus = gameState.comboCount === 3 ? 50 :
                          gameState.comboCount === 4 ? 100 : 150;
        gameState.score += comboBonus;
      }
    } else {
      gameState.comboCount = 1;
    }
    gameState.lastHitTime = currentTime;
    gameState.comboTimer = 60;
  }
  
  draw() {
    const p = this.p;
    
    if (this.type === 'pistol') {
      p.fill(255, 50, 50);
      p.noStroke();
      p.push();
      p.translate(this.x, this.y);
      p.rotate(Math.atan2(this.vy, this.vx));
      p.rect(-4, -2, 8, 4);
      p.pop();
    } else if (this.type === 'grenade') {
      p.fill(255, 220, 0);
      p.stroke(50);
      p.strokeWeight(2);
      p.circle(this.x, this.y, 12);
      p.stroke(100);
      p.line(this.x, this.y - 6, this.x, this.y - 12);
    }
  }
  
  isActive() {
    return this.active;
  }
}