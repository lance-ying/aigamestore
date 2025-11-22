// launcher.js - Launcher and projectile management

import { LAUNCHER_X, LAUNCHER_Y, BUBBLE_RADIUS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Bubble } from './bubble.js';

export class Launcher {
  constructor() {
    this.x = LAUNCHER_X;
    this.y = LAUNCHER_Y;
    this.angle = -Math.PI / 2;
    this.rotationSpeed = 0.03;
    this.minAngle = -Math.PI * 0.85;
    this.maxAngle = -Math.PI * 0.15;
  }

  rotate(direction) {
    this.angle += direction * this.rotationSpeed;
    this.angle = Math.max(this.minAngle, Math.min(this.maxAngle, this.angle));
  }

  render(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(this.angle);
    
    // Launcher body
    p.fill(80, 80, 100);
    p.stroke(255);
    p.strokeWeight(2);
    p.beginShape();
    p.vertex(-15, 0);
    p.vertex(-10, -30);
    p.vertex(10, -30);
    p.vertex(15, 0);
    p.endShape(p.CLOSE);
    
    // Base
    p.fill(60, 60, 80);
    p.rect(-20, 0, 40, 10);
    
    p.pop();
  }

  getFirePosition() {
    return {
      x: this.x + Math.cos(this.angle) * 30,
      y: this.y + Math.sin(this.angle) * 30
    };
  }

  getFireVelocity() {
    const speed = 8;
    return {
      vx: Math.cos(this.angle) * speed,
      vy: Math.sin(this.angle) * speed
    };
  }
}

export class Projectile extends Bubble {
  constructor(x, y, color, vx, vy) {
    super(x, y, color);
    this.vx = vx;
    this.vy = vy;
    this.active = true;
  }

  update() {
    super.update();
    if (!this.markedForPop) {
      this.x += this.vx;
      this.y += this.vy;
      
      // Bounce off walls
      if (this.x - this.radius < 0) {
        this.x = this.radius;
        this.vx = Math.abs(this.vx);
      }
      if (this.x + this.radius > CANVAS_WIDTH) {
        this.x = CANVAS_WIDTH - this.radius;
        this.vx = -Math.abs(this.vx);
      }
    }
  }

  render(p) {
    if (!this.active) return;
    super.render(p);
  }
}

export function calculateGuideLine(launcher, bubbles, p, gridOffsetY) {
  const points = [];
  const maxBounces = 3;
  const maxDistance = 1000;
  
  let x = launcher.x;
  let y = launcher.y;
  let vx = Math.cos(launcher.angle);
  let vy = Math.sin(launcher.angle);
  
  points.push({ x, y });
  
  let distance = 0;
  let bounces = 0;
  
  while (distance < maxDistance && bounces < maxBounces) {
    // Check for collision with bubbles
    let hitBubble = false;
    for (const bubble of bubbles) {
      if (!bubble.active || bubble.markedForPop) continue;
      const dx = bubble.x - x;
      const dy = bubble.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < BUBBLE_RADIUS * 2 + 5) {
        points.push({ x: bubble.x, y: bubble.y });
        hitBubble = true;
        break;
      }
    }
    
    if (hitBubble) break;
    
    // Move along trajectory
    const step = 5;
    x += vx * step;
    y += vy * step;
    distance += step;
    
    // Check wall bounces
    if (x < BUBBLE_RADIUS) {
      x = BUBBLE_RADIUS;
      vx = Math.abs(vx);
      bounces++;
    }
    if (x > CANVAS_WIDTH - BUBBLE_RADIUS) {
      x = CANVAS_WIDTH - BUBBLE_RADIUS;
      vx = -Math.abs(vx);
      bounces++;
    }
    
    // Check ceiling
    if (y < gridOffsetY) {
      points.push({ x, y: gridOffsetY });
      break;
    }
    
    points.push({ x, y });
  }
  
  return points;
}