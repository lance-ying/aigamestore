// entities.js - Game entity classes

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.speed = 3;
    this.velocityX = 0;
    this.velocityY = 0;
  }
  
  update(p) {
    // Apply velocity
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Apply friction
    this.velocityX *= 0.85;
    this.velocityY *= 0.85;
    
    // Boundary checking
    this.x = p.constrain(this.x, this.size, CANVAS_WIDTH - this.size);
    this.y = p.constrain(this.y, this.size, CANVAS_HEIGHT - this.size);
  }
  
  moveLeft() {
    this.velocityX = -this.speed;
  }
  
  moveRight() {
    this.velocityX = this.speed;
  }
  
  moveUp() {
    this.velocityY = -this.speed;
  }
  
  moveDown() {
    this.velocityY = this.speed;
  }
  
  render(p) {
    p.push();
    p.fill(100, 150, 255);
    p.stroke(50, 100, 200);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, this.size * 2);
    
    // Direction indicator
    p.fill(255);
    p.noStroke();
    p.ellipse(this.x, this.y - this.size * 0.3, this.size * 0.4);
    p.pop();
  }
}

export class Target {
  constructor(x, y, speed, size) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = size;
    this.angle = Math.random() * Math.PI * 2;
    this.alive = true;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.colorHue = Math.random() * 60 + 340; // Red-ish hues
  }
  
  update(p) {
    if (!this.alive) return;
    
    // Move in direction
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    
    // Bounce off walls
    if (this.x < this.size || this.x > CANVAS_WIDTH - this.size) {
      this.angle = Math.PI - this.angle;
      this.x = p.constrain(this.x, this.size, CANVAS_WIDTH - this.size);
    }
    if (this.y < this.size || this.y > CANVAS_HEIGHT - this.size) {
      this.angle = -this.angle;
      this.y = p.constrain(this.y, this.size, CANVAS_HEIGHT - this.size);
    }
    
    this.pulsePhase += 0.1;
  }
  
  render(p) {
    if (!this.alive) return;
    
    p.push();
    const pulse = Math.sin(this.pulsePhase) * 0.2 + 1;
    const renderSize = this.size * pulse;
    
    // Outer ring
    p.noFill();
    p.stroke(255, 100, 100);
    p.strokeWeight(3);
    p.ellipse(this.x, this.y, renderSize * 2.5);
    
    // Middle ring
    p.stroke(255, 150, 100);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, renderSize * 1.8);
    
    // Inner circle
    p.fill(255, 200, 100, 150);
    p.noStroke();
    p.ellipse(this.x, this.y, renderSize * 1.2);
    
    // Center dot
    p.fill(255, 100, 50);
    p.ellipse(this.x, this.y, renderSize * 0.4);
    
    p.pop();
  }
  
  checkHit(bulletX, bulletY, p) {
    if (!this.alive) return false;
    const dist = p.dist(this.x, this.y, bulletX, bulletY);
    return dist < this.size;
  }
  
  destroy() {
    this.alive = false;
  }
}

export class Bullet {
  constructor(x, y, targetX, targetY) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.speed = 12;
    this.alive = true;
    this.maxDistance = 500;
    
    // Calculate direction
    const angle = Math.atan2(targetY - y, targetX - x);
    this.velocityX = Math.cos(angle) * this.speed;
    this.velocityY = Math.sin(angle) * this.speed;
    
    this.trailParticles = [];
  }
  
  update(p) {
    if (!this.alive) return;
    
    this.x += this.velocityX;
    this.y += this.velocityY;
    
    // Add trail particle
    this.trailParticles.push({ x: this.x, y: this.y, life: 10 });
    if (this.trailParticles.length > 8) {
      this.trailParticles.shift();
    }
    
    // Update trail
    this.trailParticles.forEach(particle => {
      particle.life--;
    });
    this.trailParticles = this.trailParticles.filter(p => p.life > 0);
    
    // Check boundaries
    if (this.x < 0 || this.x > CANVAS_WIDTH || this.y < 0 || this.y > CANVAS_HEIGHT) {
      this.alive = false;
    }
    
    // Check max distance
    const dist = p.dist(this.startX, this.startY, this.x, this.y);
    if (dist > this.maxDistance) {
      this.alive = false;
    }
  }
  
  render(p) {
    if (!this.alive) return;
    
    p.push();
    
    // Render trail
    this.trailParticles.forEach((particle, index) => {
      const alpha = (particle.life / 10) * 150;
      const size = (particle.life / 10) * 4;
      p.fill(255, 255, 100, alpha);
      p.noStroke();
      p.ellipse(particle.x, particle.y, size);
    });
    
    // Render bullet
    p.fill(255, 255, 150);
    p.noStroke();
    p.ellipse(this.x, this.y, 6);
    
    p.stroke(255, 200, 0);
    p.strokeWeight(1);
    p.line(this.x, this.y, this.x - this.velocityX, this.y - this.velocityY);
    
    p.pop();
  }
}

export class Particle {
  constructor(x, y, vx, vy, color, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = Math.random() * 4 + 2;
    this.alive = true;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.15; // Gravity
    this.vx *= 0.98;
    this.life--;
    if (this.life <= 0) {
      this.alive = false;
    }
  }
  
  render(p) {
    if (!this.alive) return;
    
    p.push();
    const alpha = (this.life / this.maxLife) * 255;
    p.fill(...this.color, alpha);
    p.noStroke();
    const currentSize = this.size * (this.life / this.maxLife);
    p.ellipse(this.x, this.y, currentSize);
    p.pop();
  }
}