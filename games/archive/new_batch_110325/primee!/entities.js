// entities.js - Game entity classes
import { isPrime, getPrimeFactors } from './utils.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Cursor {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.speed = 4;
    this.speedBoost = 2;
  }
  
  move(dx, dy, boosted) {
    const speed = boosted ? this.speed * this.speedBoost : this.speed;
    this.x += dx * speed;
    this.y += dy * speed;
    
    // Keep cursor in bounds
    this.x = Math.max(this.size, Math.min(CANVAS_WIDTH - this.size, this.x));
    this.y = Math.max(this.size, Math.min(CANVAS_HEIGHT - this.size, this.y));
  }
  
  draw(p) {
    p.push();
    p.stroke(255, 255, 0);
    p.strokeWeight(3);
    p.noFill();
    p.circle(this.x, this.y, this.size * 2);
    
    // Crosshair
    p.line(this.x - 15, this.y, this.x + 15, this.y);
    p.line(this.x, this.y - 15, this.x, this.y + 15);
    p.pop();
  }
}

export class NumberBall {
  constructor(x, y, value, fallSpeed) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.fallSpeed = fallSpeed;
    this.radius = 25;
    this.isPrime = isPrime(value);
    this.isCut = false;
    this.factors = [];
    this.opacity = 255;
    this.wobble = Math.random() * Math.PI * 2;
  }
  
  update() {
    this.y += this.fallSpeed;
    this.wobble += 0.05;
  }
  
  draw(p) {
    p.push();
    const wobbleX = Math.sin(this.wobble) * 2;
    
    // Shadow
    p.noStroke();
    p.fill(0, 0, 0, 50);
    p.ellipse(this.x + wobbleX + 3, this.y + 3, this.radius * 2, this.radius * 2);
    
    // Ball
    if (this.isPrime) {
      // Prime - green glow
      p.fill(100, 255, 150, this.opacity);
      p.noStroke();
      p.circle(this.x + wobbleX, this.y, this.radius * 2.2);
      p.fill(50, 200, 100, this.opacity);
    } else {
      // Composite - orange/red
      p.fill(255, 200, 100, this.opacity);
      p.noStroke();
      p.circle(this.x + wobbleX, this.y, this.radius * 2.2);
      p.fill(255, 150, 50, this.opacity);
    }
    
    p.stroke(50, 50, 50, this.opacity);
    p.strokeWeight(2);
    p.circle(this.x + wobbleX, this.y, this.radius * 2);
    
    // Number text
    p.fill(255, 255, 255, this.opacity);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text(this.value, this.x + wobbleX, this.y);
    
    p.pop();
  }
  
  isOffScreen() {
    return this.y - this.radius > CANVAS_HEIGHT;
  }
  
  contains(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }
  
  cut() {
    if (!this.isPrime && !this.isCut) {
      this.isCut = true;
      this.factors = getPrimeFactors(this.value);
      return this.factors;
    }
    return [];
  }
}

export class PrimeFactor {
  constructor(x, y, value, index, total) {
    this.x = x;
    this.y = y;
    this.targetX = x + (index - (total - 1) / 2) * 40;
    this.targetY = y;
    this.value = value;
    this.radius = 18;
    this.opacity = 255;
    this.vx = 0;
    this.vy = 0;
    this.settled = false;
    this.settleTimer = 0;
  }
  
  update() {
    if (!this.settled) {
      // Move toward target position
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      this.vx = dx * 0.2;
      this.vy = dy * 0.2;
      this.x += this.vx;
      this.y += this.vy;
      
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
        this.settleTimer++;
        if (this.settleTimer > 10) {
          this.settled = true;
        }
      }
    }
    
    // Continue falling
    this.y += 0.8;
  }
  
  draw(p) {
    p.push();
    
    // Glow
    p.fill(150, 255, 200, this.opacity * 0.5);
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 2.4);
    
    // Ball
    p.fill(100, 220, 150, this.opacity);
    p.stroke(50, 150, 100, this.opacity);
    p.strokeWeight(2);
    p.circle(this.x, this.y, this.radius * 2);
    
    // Number
    p.fill(255, 255, 255, this.opacity);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(this.value, this.x, this.y);
    
    p.pop();
  }
  
  isOffScreen() {
    return this.y - this.radius > CANVAS_HEIGHT;
  }
  
  contains(x, y) {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }
}

export class CutLine {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.lifetime = 15;
    this.maxLifetime = 15;
  }
  
  update() {
    this.lifetime--;
  }
  
  draw(p) {
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    p.push();
    p.stroke(255, 100, 100, alpha);
    p.strokeWeight(4);
    p.line(this.x1, this.y1, this.x2, this.y2);
    
    // Sparkles
    for (let i = 0; i < 3; i++) {
      const t = i / 3;
      const x = this.x1 + (this.x2 - this.x1) * t;
      const y = this.y1 + (this.y2 - this.y1) * t;
      p.fill(255, 200, 100, alpha);
      p.noStroke();
      p.circle(x, y, 6);
    }
    p.pop();
  }
  
  isAlive() {
    return this.lifetime > 0;
  }
}

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 6;
    this.vy = (Math.random() - 0.5) * 6 - 2;
    this.lifetime = 30;
    this.maxLifetime = 30;
    this.size = Math.random() * 4 + 2;
    this.color = color;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.3; // gravity
    this.lifetime--;
  }
  
  draw(p) {
    const alpha = (this.lifetime / this.maxLifetime) * 255;
    p.push();
    p.noStroke();
    p.fill(...this.color, alpha);
    p.circle(this.x, this.y, this.size);
    p.pop();
  }
  
  isAlive() {
    return this.lifetime > 0;
  }
}