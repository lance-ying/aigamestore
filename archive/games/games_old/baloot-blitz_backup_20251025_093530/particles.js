// particles.js - Particle effects system
import { gameState } from './globals.js';

export class Particle {
  constructor(x, y, vx, vy, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.alpha = 255;
    this.life = 30;
    this.size = Math.random() * 4 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3; // Gravity
    this.alpha -= 255 / this.life;
    this.life--;
  }

  draw(p) {
    p.push();
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
    p.ellipse(this.x, this.y, this.size);
    p.pop();
  }

  isDead() {
    return this.life <= 0;
  }
}

export function createParticleEffect(p, x, y) {
  const colors = [
    [255, 215, 0],
    [255, 165, 0],
    [255, 255, 255],
    [200, 200, 255]
  ];

  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 2;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const particle = new Particle(x, y, vx, vy, color);
    gameState.particleEffects.push(particle);
  }
}

export function updateParticles() {
  gameState.particleEffects.forEach(p => p.update());
  gameState.particleEffects = gameState.particleEffects.filter(p => !p.isDead());
}

export function drawParticles(p) {
  gameState.particleEffects.forEach(particle => particle.draw(p));
}