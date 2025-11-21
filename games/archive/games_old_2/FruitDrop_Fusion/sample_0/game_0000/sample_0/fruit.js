// fruit.js - Fruit entity class

import { FRUIT_TIERS, PHYSICS } from './globals.js';

export class Fruit {
  constructor(p, x, y, tier) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.tier = tier;
    this.tierData = FRUIT_TIERS[tier];
    this.radius = this.tierData.radius;
    this.color = this.tierData.color;
    this.vx = 0;
    this.vy = 0;
    this.settled = false;
    this.settleTime = 0;
    this.opacity = 255;
    this.scale = 1.0;
    this.markedForRemoval = false;
    this.id = Math.random();
  }

  update() {
    // Apply gravity
    this.vy += PHYSICS.gravity;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply friction
    this.vx *= (1 - PHYSICS.friction * 0.1);
    
    // Check if settled
    if (Math.abs(this.vx) < 0.5 && Math.abs(this.vy) < 0.5) {
      if (!this.settled) {
        this.settled = true;
        this.settleTime = Date.now();
      }
    } else {
      this.settled = false;
    }
  }

  draw() {
    this.p.push();
    this.p.fill(...this.color, this.opacity);
    this.p.noStroke();
    this.p.circle(this.x, this.y, this.radius * 2 * this.scale);
    
    // Add a highlight for depth
    this.p.fill(255, 255, 255, 80 * (this.opacity / 255));
    this.p.circle(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.5 * this.scale);
    this.p.pop();
  }

  isColliding(other) {
    if (!other || other === this) return false;
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (this.radius + other.radius);
  }

  resolveCollision(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    const overlap = (this.radius + other.radius) - distance;
    if (overlap <= 0) return;
    
    const nx = dx / distance;
    const ny = dy / distance;
    
    // Separate fruits
    const separation = overlap / 2;
    this.x += nx * separation;
    this.y += ny * separation;
    other.x -= nx * separation;
    other.y -= ny * separation;
    
    // Calculate relative velocity
    const dvx = this.vx - other.vx;
    const dvy = this.vy - other.vy;
    const dotProduct = dvx * nx + dvy * ny;
    
    if (dotProduct > 0) return; // Moving apart
    
    // Apply collision response
    const restitution = PHYSICS.restitution;
    const impulse = -(1 + restitution) * dotProduct / 2;
    
    this.vx += impulse * nx;
    this.vy += impulse * ny;
    other.vx -= impulse * nx;
    other.vy -= impulse * ny;
  }

  checkBoundaryCollision(container) {
    const left = container.x + container.wallThickness + this.radius;
    const right = container.x + container.width - container.wallThickness - this.radius;
    const bottom = container.y + container.height - container.wallThickness - this.radius;
    
    // Left wall
    if (this.x < left) {
      this.x = left;
      this.vx = Math.abs(this.vx) * PHYSICS.restitution;
    }
    
    // Right wall
    if (this.x > right) {
      this.x = right;
      this.vx = -Math.abs(this.vx) * PHYSICS.restitution;
    }
    
    // Bottom
    if (this.y > bottom) {
      this.y = bottom;
      this.vy = -Math.abs(this.vy) * PHYSICS.restitution;
      this.vx *= (1 - PHYSICS.frictionStatic * 0.1);
    }
  }

  getTop() {
    return this.y - this.radius;
  }
}