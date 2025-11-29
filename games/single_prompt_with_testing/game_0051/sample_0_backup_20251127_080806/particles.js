// particles.js - Particle effects system

import { gameState, COLORS } from './globals.js';

export class Particle {
  constructor(x, y, vx, vy, color, lifetime = 30) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = lifetime;
    this.age = 0;
    this.size = Math.random() * 4 + 2;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += gameState.gravity * 0.5;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.rotation += this.rotationSpeed;
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = 1 - (this.age / this.lifetime);
    
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotation);
    
    p.fill(this.color[0], this.color[1], this.color[2], alpha * 255);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.size, this.size);
    
    p.pop();
  }
}

export class SparkParticle extends Particle {
  constructor(x, y, vx, vy) {
    super(x, y, vx, vy, [255, 255, 100], 20);
    this.length = 8;
  }
  
  render(p) {
    const alpha = 1 - (this.age / this.lifetime);
    
    p.push();
    p.stroke(255, 255, 100, alpha * 255);
    p.strokeWeight(2);
    
    const prevX = this.x - this.vx * 2;
    const prevY = this.y - this.vy * 2;
    p.line(prevX, prevY, this.x, this.y);
    
    p.pop();
  }
}