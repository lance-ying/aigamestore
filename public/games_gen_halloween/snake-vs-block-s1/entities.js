// entities.js - Game entity classes
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class SnakeSegment {
  constructor(x, y, index) {
    this.x = x;
    this.y = y;
    this.index = index;
    this.radius = 8;
    this.targetX = x;
    this.targetY = y;
  }
  
  update(targetX, targetY) {
    this.targetX = targetX;
    this.targetY = targetY;
    
    // Smooth following
    const lerpFactor = 0.3;
    this.x += (this.targetX - this.x) * lerpFactor;
    this.y += (this.targetY - this.y) * lerpFactor;
  }
  
  draw(p) {
    // Gradient effect from head to tail
    const alpha = 255 - (this.index * 3);
    const hue = (this.index * 5) % 360;
    
    p.push();
    p.colorMode(p.HSB);
    p.fill(hue, 80, 100, Math.max(alpha, 100));
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 2);
    
    // Core glow
    p.fill(hue, 40, 100, 180);
    p.circle(this.x, this.y, this.radius * 1.2);
    p.pop();
  }
}

export class Block {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.width = 50;
    this.height = 40;
    this.active = true;
    this.hit = false;
    this.hitTime = 0;
  }
  
  update(p) {
    this.y += gameState.scrollSpeed;
    
    if (this.hit) {
      this.hitTime++;
    }
    
    // Remove if off screen
    if (this.y > CANVAS_HEIGHT + 50) {
      this.active = false;
    }
  }
  
  draw(p) {
    if (!this.active) return;
    
    p.push();
    
    if (this.hit) {
      // Hit animation
      const scale = 1 + (this.hitTime * 0.05);
      const alpha = 255 - (this.hitTime * 15);
      p.translate(this.x, this.y);
      p.scale(scale);
      p.fill(255, 100, 100, Math.max(alpha, 0));
      p.rect(-this.width/2, -this.height/2, this.width, this.height, 5);
    } else {
      // Color based on value
      const danger = Math.min(this.value / 50, 1);
      const r = 50 + danger * 150;
      const g = 50;
      const b = 200 - danger * 150;
      
      p.fill(r, g, b);
      p.stroke(r + 50, g + 50, b + 50);
      p.strokeWeight(2);
      p.rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height, 5);
      
      // Number
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(18);
      p.text(this.value, this.x, this.y);
    }
    
    p.pop();
  }
  
  collidesWith(segment) {
    if (!this.active || this.hit) return false;
    
    return Math.abs(segment.x - this.x) < (this.width/2 + segment.radius) &&
           Math.abs(segment.y - this.y) < (this.height/2 + segment.radius);
  }
}

export class Orb {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value; // 1-5
    this.radius = 6 + value;
    this.active = true;
    this.collected = false;
    this.collectTime = 0;
    this.wobble = Math.random() * Math.PI * 2;
  }
  
  update(p) {
    this.y += gameState.scrollSpeed;
    this.wobble += 0.1;
    
    if (this.collected) {
      this.collectTime++;
      this.radius *= 0.9;
    }
    
    // Remove if off screen
    if (this.y > CANVAS_HEIGHT + 50 || (this.collected && this.collectTime > 20)) {
      this.active = false;
    }
  }
  
  draw(p) {
    if (!this.active) return;
    
    p.push();
    
    const wobbleX = Math.cos(this.wobble) * 2;
    const wobbleY = Math.sin(this.wobble * 2) * 1;
    
    if (this.collected) {
      // Collection animation
      const alpha = 255 - (this.collectTime * 12);
      p.fill(100, 255, 255, Math.max(alpha, 0));
      p.noStroke();
      p.circle(this.x + wobbleX, this.y + wobbleY, this.radius * 2);
    } else {
      // Glow effect
      p.fill(100, 255, 255, 100);
      p.noStroke();
      p.circle(this.x + wobbleX, this.y + wobbleY, this.radius * 3);
      
      // Core
      p.fill(150, 255, 255);
      p.circle(this.x + wobbleX, this.y + wobbleY, this.radius * 2);
      
      // Highlight
      p.fill(255, 255, 255, 200);
      p.circle(this.x + wobbleX - 2, this.y + wobbleY - 2, this.radius * 0.8);
    }
    
    p.pop();
  }
  
  collidesWith(segment) {
    if (!this.active || this.collected) return false;
    
    const dist = Math.hypot(segment.x - this.x, segment.y - this.y);
    return dist < (this.radius + segment.radius);
  }
}