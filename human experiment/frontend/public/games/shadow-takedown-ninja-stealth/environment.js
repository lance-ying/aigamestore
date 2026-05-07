// environment.js - Environmental objects

import { gameState } from './globals.js';

export class Wall {
  constructor(p, x, y, w, h) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  render() {
    this.p.fill(40, 40, 40);
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.rect(this.x, this.y, this.w, this.h);
  }
}

export class Vent {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 30;
    this.linkedVent = null;
  }

  linkTo(otherVent) {
    this.linkedVent = otherVent;
    otherVent.linkedVent = this;
  }

  render() {
    this.p.push();
    this.p.fill(100, 100, 100);
    this.p.stroke(60, 60, 60);
    this.p.strokeWeight(2);
    this.p.rectMode(this.p.CENTER);
    this.p.rect(this.x, this.y, this.size, this.size);
    
    // Grate pattern
    this.p.stroke(40, 40, 40);
    this.p.strokeWeight(1);
    for (let i = -this.size / 2 + 5; i < this.size / 2; i += 5) {
      this.p.line(this.x + i, this.y - this.size / 2, this.x + i, this.y + this.size / 2);
    }
    this.p.pop();
  }
}

export class Barrel {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 25;
    this.exploded = false;
    this.explosionTimer = 0;
  }

  update() {
    if (this.explosionTimer > 0) {
      this.explosionTimer--;
    }
    
    // Update particles
    if (gameState.particles) {
      for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2; // Gravity
        p.vx *= 0.98; // Friction
        p.life--;
        
        if (p.life <= 0) {
          gameState.particles.splice(i, 1);
        }
      }
    }
  }

  createExplosionParticles() {
    if (!gameState.particles) {
      gameState.particles = [];
    }
    
    // Create radial particle burst
    for (let i = 0; i < 24; i++) {
      const angle = (this.p.TWO_PI / 24) * i;
      const speed = this.p.random(3, 7);
      gameState.particles.push({
        x: this.x,
        y: this.y,
        vx: this.p.cos(angle) * speed,
        vy: this.p.sin(angle) * speed,
        life: 40,
        maxLife: 40,
        size: this.p.random(4, 8),
        color: [255, this.p.random(100, 200), 0]
      });
    }
    
    // Add smoke particles
    for (let i = 0; i < 12; i++) {
      const angle = this.p.random(this.p.TWO_PI);
      const speed = this.p.random(1, 3);
      gameState.particles.push({
        x: this.x,
        y: this.y,
        vx: this.p.cos(angle) * speed,
        vy: this.p.sin(angle) * speed - 2,
        life: 60,
        maxLife: 60,
        size: this.p.random(6, 12),
        color: [80, 80, 80]
      });
    }
  }

  render() {
    // Render particles
    if (gameState.particles) {
      this.p.push();
      this.p.noStroke();
      for (let particle of gameState.particles) {
        const alpha = (particle.life / particle.maxLife) * 255;
        this.p.fill(particle.color[0], particle.color[1], particle.color[2], alpha);
        this.p.circle(particle.x, particle.y, particle.size * (particle.life / particle.maxLife));
      }
      this.p.pop();
    }
    
    if (this.exploded && this.explosionTimer > 0) {
      // Explosion effect - multiple rings
      const progress = 1 - (this.explosionTimer / 30);
      const maxRadius = 70;
      
      this.p.push();
      this.p.noStroke();
      
      // Outer ring
      const outerRadius = maxRadius * progress;
      this.p.fill(255, 100, 0, 150 * (this.explosionTimer / 30));
      this.p.circle(this.x, this.y, outerRadius * 2);
      
      // Middle ring
      this.p.fill(255, 150, 0, 120 * (this.explosionTimer / 30));
      this.p.circle(this.x, this.y, outerRadius * 1.5);
      
      // Inner ring
      this.p.fill(255, 200, 0, 100 * (this.explosionTimer / 30));
      this.p.circle(this.x, this.y, outerRadius);
      
      // Flash
      if (this.explosionTimer > 25) {
        this.p.fill(255, 255, 255, 200);
        this.p.circle(this.x, this.y, outerRadius * 0.5);
      }
      
      this.p.pop();
    } else if (!this.exploded) {
      this.p.push();
      this.p.fill(200, 50, 50);
      this.p.stroke(0);
      this.p.strokeWeight(2);
      this.p.circle(this.x, this.y, this.size);
      
      // Black band
      this.p.fill(0);
      this.p.noStroke();
      this.p.rectMode(this.p.CENTER);
      this.p.rect(this.x, this.y, this.size, this.size / 4);
      
      // Warning symbol
      this.p.fill(255, 255, 0);
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(10);
      this.p.text('!', this.x, this.y);
      
      this.p.pop();
    }
  }
}