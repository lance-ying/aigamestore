// entities.js - Game entities

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, FISH_DATA } from './globals.js';

export class Player {
  constructor(p) {
    this.p = p;
    this.x = CANVAS_WIDTH / 2;
    this.y = 50;
    this.vx = 0;
    this.vy = 0;
    this.size = 20;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Boundaries
    this.x = this.p.constrain(this.x, 20, CANVAS_WIDTH - 20);
  }
  
  draw() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Lure body
    this.p.fill(220, 180, 80);
    this.p.noStroke();
    this.p.ellipse(0, 0, this.size, this.size * 1.5);
    
    // Hook
    this.p.stroke(150, 150, 150);
    this.p.strokeWeight(2);
    this.p.noFill();
    this.p.arc(0, this.size, 10, 10, 0, this.p.PI);
    
    // Line going up
    this.p.stroke(100, 100, 100);
    this.p.strokeWeight(1);
    this.p.line(0, -this.size * 0.75, 0, -50);
    
    this.p.pop();
  }
}

export class Fish {
  constructor(p, species, x, y, direction = 1) {
    this.p = p;
    this.species = species;
    this.data = FISH_DATA[species];
    this.x = x;
    this.y = y;
    this.size = this.data.size;
    this.direction = direction;
    this.speed = this.data.speed;
    this.baseSpeed = this.data.speed;
    this.bobOffset = this.p.random(0, this.p.TWO_PI);
    this.active = true;
    this.hit = false;
  }
  
  update() {
    if (!this.active) return;
    
    // Swimming motion
    this.x += this.speed * this.direction;
    this.y += this.p.sin(this.p.frameCount * 0.05 + this.bobOffset) * 0.5;
    
    // Remove if off screen
    if (this.x < -50 || this.x > CANVAS_WIDTH + 50) {
      this.active = false;
    }
  }
  
  draw() {
    if (!this.active) return;
    
    this.p.push();
    this.p.translate(this.x, this.y);
    if (this.direction < 0) {
      this.p.scale(-1, 1);
    }
    
    // Fish body
    const col = this.data.color;
    this.p.fill(...col);
    this.p.noStroke();
    this.p.ellipse(0, 0, this.size * 1.5, this.size);
    
    // Tail
    this.p.triangle(
      -this.size * 0.75, 0,
      -this.size * 1.2, -this.size * 0.4,
      -this.size * 1.2, this.size * 0.4
    );
    
    // Eye
    this.p.fill(255);
    this.p.ellipse(this.size * 0.4, -this.size * 0.2, this.size * 0.2);
    this.p.fill(0);
    this.p.ellipse(this.size * 0.45, -this.size * 0.2, this.size * 0.1);
    
    this.p.pop();
  }
  
  checkCollision(px, py, psize) {
    if (!this.active) return false;
    
    const dist = this.p.dist(this.x, this.y, px, py);
    return dist < (this.size + psize) * 0.6;
  }
}

export class Projectile {
  constructor(p, x, y, targetFish) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.targetFish = targetFish;
    this.speed = 15;
    this.active = true;
    this.size = 8;
    
    // Calculate direction to target
    if (targetFish && targetFish.active) {
      const angle = this.p.atan2(targetFish.y - y, targetFish.x - x);
      this.vx = this.p.cos(angle) * this.speed;
      this.vy = this.p.sin(angle) * this.speed;
    } else {
      this.vx = 0;
      this.vy = -this.speed;
    }
  }
  
  update() {
    if (!this.active) return;
    
    this.x += this.vx;
    this.y += this.vy;
    
    // Remove if off screen
    if (this.y < -20 || this.y > CANVAS_HEIGHT + 20 || 
        this.x < -20 || this.x > CANVAS_WIDTH + 20) {
      this.active = false;
    }
  }
  
  draw() {
    if (!this.active) return;
    
    this.p.push();
    this.p.fill(255, 200, 50);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.size);
    
    // Trail
    this.p.fill(255, 150, 0, 100);
    this.p.ellipse(this.x - this.vx * 0.3, this.y - this.vy * 0.3, this.size * 0.6);
    this.p.pop();
  }
  
  checkCollision(fish) {
    if (!this.active || !fish.active) return false;
    
    const dist = this.p.dist(this.x, this.y, fish.x, fish.y);
    return dist < (this.size + fish.size) * 0.5;
  }
}

export class Particle {
  constructor(p, x, y, color) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.vx = this.p.random(-3, 3);
    this.vy = this.p.random(-3, 3);
    this.life = 30;
    this.maxLife = 30;
    this.size = this.p.random(3, 8);
    this.color = color;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.life--;
  }
  
  draw() {
    const alpha = (this.life / this.maxLife) * 255;
    this.p.fill(this.color[0], this.color[1], this.color[2], alpha);
    this.p.noStroke();
    this.p.ellipse(this.x, this.y, this.size);
  }
  
  isDead() {
    return this.life <= 0;
  }
}