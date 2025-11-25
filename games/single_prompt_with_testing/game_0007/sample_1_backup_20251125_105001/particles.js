// Particle system for visual effects

import { gameState, COLORS, CANVAS_HEIGHT } from './globals.js';
import { Vector2, randomRange, randomInt } from './utils.js';

// Base particle class
export class Particle {
  constructor(x, y, vx, vy, color, size, lifetime) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.lifetime = lifetime;
    this.age = 0;
    this.alpha = 1.0;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.age++;
    
    // Fade out
    this.alpha = 1 - (this.age / this.lifetime);
    
    return this.age < this.lifetime;
  }
  
  render(p) {
    p.push();
    p.noStroke();
    p.fill(...this.color, this.alpha * 255);
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
}

// Explosion particle effect
export class ExplosionParticle extends Particle {
  constructor(x, y, color = COLORS.PARTICLE_ORANGE) {
    const angle = randomRange(0, Math.PI * 2);
    const speed = randomRange(2, 6);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const size = randomRange(3, 8);
    const lifetime = randomInt(20, 40);
    
    super(x, y, vx, vy, color, size, lifetime);
  }
}

// Smoke particle
export class SmokeParticle extends Particle {
  constructor(x, y) {
    const vx = randomRange(-1, 1);
    const vy = randomRange(-2, -0.5);
    const gray = randomInt(100, 200);
    const color = [gray, gray, gray];
    const size = randomRange(5, 12);
    const lifetime = randomInt(30, 60);
    
    super(x, y, vx, vy, color, size, lifetime);
  }
  
  update() {
    this.size += 0.2; // Grow over time
    return super.update();
  }
}

// Sparkle particle for parry effect
export class SparkleParticle extends Particle {
  constructor(x, y) {
    const angle = randomRange(0, Math.PI * 2);
    const speed = randomRange(3, 7);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const color = COLORS.PARTICLE_YELLOW;
    const size = randomRange(2, 5);
    const lifetime = randomInt(15, 30);
    
    super(x, y, vx, vy, color, size, lifetime);
    this.rotation = 0;
    this.rotationSpeed = randomRange(-0.3, 0.3);
  }
  
  update() {
    this.rotation += this.rotationSpeed;
    this.vy += 0.1; // Less gravity
    return super.update();
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    p.noStroke();
    p.fill(...this.color, this.alpha * 255);
    
    // Draw star shape
    p.beginShape();
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const x = Math.cos(angle) * this.size;
      const y = Math.sin(angle) * this.size;
      p.vertex(x, y);
      
      const innerAngle = angle + Math.PI / 5;
      const ix = Math.cos(innerAngle) * this.size * 0.4;
      const iy = Math.sin(innerAngle) * this.size * 0.4;
      p.vertex(ix, iy);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  }
}

// Dust particle for landing/dashing
export class DustParticle extends Particle {
  constructor(x, y) {
    const vx = randomRange(-2, 2);
    const vy = randomRange(-3, -1);
    const color = COLORS.GROUND_HIGHLIGHT;
    const size = randomRange(4, 8);
    const lifetime = randomInt(15, 25);
    
    super(x, y, vx, vy, color, size, lifetime);
  }
}

// Damage number particle
export class DamageNumberParticle {
  constructor(x, y, damage) {
    this.x = x;
    this.y = y;
    this.damage = Math.round(damage);
    this.vy = -2;
    this.lifetime = 40;
    this.age = 0;
    this.alpha = 1.0;
  }
  
  update() {
    this.y += this.vy;
    this.vy += 0.1;
    this.age++;
    
    // Fade out
    this.alpha = 1 - (this.age / this.lifetime);
    
    return this.age < this.lifetime;
  }
  
  render(p) {
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.fill(255, 255, 0, this.alpha * 255);
    p.stroke(0, 0, 0, this.alpha * 255);
    p.strokeWeight(3);
    p.text(this.damage, this.x, this.y);
    p.pop();
  }
}

// Create explosion at position
export function createExplosion(x, y, count = 12, color = COLORS.PARTICLE_ORANGE) {
  for (let i = 0; i < count; i++) {
    gameState.particles.push(new ExplosionParticle(x, y, color));
  }
}

// Create sparkle effect
export function createSparkles(x, y, count = 8) {
  for (let i = 0; i < count; i++) {
    gameState.particles.push(new SparkleParticle(x, y));
  }
}

// Create dust cloud
export function createDust(x, y, count = 5) {
  for (let i = 0; i < count; i++) {
    gameState.particles.push(new DustParticle(x, y));
  }
}

// Create damage number
export function createDamageNumber(x, y, damage) {
  gameState.particles.push(new DamageNumberParticle(x, y, damage));
}

// Update all particles
export function updateParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    const stillAlive = particle.update();
    
    if (!stillAlive) {
      gameState.particles.splice(i, 1);
    }
  }
}

// Render all particles
export function renderParticles(p) {
  gameState.particles.forEach(particle => particle.render(p));
}