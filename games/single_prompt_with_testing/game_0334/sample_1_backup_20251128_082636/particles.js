// particles.js - Particle system

import { gameState } from './globals.js';
import { removeFromArray, isOnScreen } from './utils.js';

export class Particle {
  constructor(x, y, vx, vy, color, size = 3) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.lifetime = 30;
    this.age = 0;
    this.alpha = 255;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.age++;
    
    this.alpha = 255 * (1 - this.age / this.lifetime);
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    if (!isOnScreen(this.x, this.y)) return;
    
    const screenX = this.x - gameState.cameraX + gameState.cameraShakeX;
    const screenY = this.y - gameState.cameraY + gameState.cameraShakeY;
    
    p.fill(...this.color.slice(0, 3), this.alpha);
    p.noStroke();
    p.circle(screenX, screenY, this.size);
  }
}

export function createParticleBurst(x, y, count, color) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
    const speed = Math.random() * 3 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const size = Math.random() * 4 + 2;
    
    const particle = new Particle(x, y, vx, vy, color, size);
    gameState.particles.push(particle);
  }
}

export function updateParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const particle = gameState.particles[i];
    particle.update();
    
    if (particle.isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
}