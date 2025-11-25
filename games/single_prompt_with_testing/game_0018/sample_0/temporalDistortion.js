// temporalDistortion.js - Hazardous temporal distortions
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class TemporalDistortion {
  constructor(x, y, type = 'static') {
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.type = type; // 'static', 'moving', 'expanding'
    this.vx = 0;
    this.vy = 0;
    this.phase = Math.random() * Math.PI * 2;
    this.rotationAngle = 0;
    this.expansionPhase = 0;
    this.damage = 5;
    
    if (type === 'moving') {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
    }
  }

  update() {
    this.phase += 0.1;
    this.rotationAngle += 0.05;
    
    const slowdown = gameState.temporalStabilizerActive ? 0.3 : 1.0;
    
    if (this.type === 'moving') {
      this.x += this.vx * slowdown;
      this.y += this.vy * slowdown;

      // Bounce off walls
      if (this.x - this.radius < 0 || this.x + this.radius > CANVAS_WIDTH) {
        this.vx *= -1;
      }
      if (this.y - this.radius < 0 || this.y + this.radius > CANVAS_HEIGHT) {
        this.vy *= -1;
      }
    } else if (this.type === 'expanding') {
      this.expansionPhase += 0.02 * slowdown;
      this.radius = 20 + Math.sin(this.expansionPhase) * 10;
    }
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.rotationAngle);

    const alpha = gameState.temporalStabilizerActive ? 100 : 150;

    // Outer distortion
    p.noFill();
    p.stroke(255, 100, 100, alpha * 0.5);
    p.strokeWeight(2);
    p.ellipse(0, 0, this.radius * 2.5);

    // Middle layer
    p.stroke(255, 50, 50, alpha * 0.7);
    p.ellipse(0, 0, this.radius * 2);

    // Core
    p.fill(200, 50, 50, alpha);
    p.noStroke();
    p.ellipse(0, 0, this.radius * 1.5);

    // Distortion lines
    for (let i = 0; i < 4; i++) {
      const angle = (Math.PI / 2) * i + this.phase;
      const x1 = Math.cos(angle) * this.radius * 0.5;
      const y1 = Math.sin(angle) * this.radius * 0.5;
      const x2 = Math.cos(angle) * this.radius * 1.2;
      const y2 = Math.sin(angle) * this.radius * 1.2;
      
      p.stroke(255, 100, 100, alpha);
      p.strokeWeight(2);
      p.line(x1, y1, x2, y2);
    }

    p.pop();
  }

  checkCollision(player, p) {
    const distance = p.dist(this.x, this.y, player.x, player.y);
    if (distance < this.radius + player.width / 2) {
      return player.takeDamage(this.damage);
    }
    return false;
  }
}