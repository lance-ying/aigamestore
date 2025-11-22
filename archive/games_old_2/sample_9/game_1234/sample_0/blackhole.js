// blackhole.js - Black hole entity class

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class BlackHole {
  constructor(x, y, radius, isPlayer = false, color = null) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.isPlayer = isPlayer;
    this.speed = isPlayer ? 3 : 2;
    this.mass = radius * radius; // Mass proportional to area
    this.alive = true;
    
    if (isPlayer) {
      this.color = [0, 0, 0];
      this.glowColor = [60, 60, 60];
    } else {
      this.color = color || [20, 0, 0];
      this.glowColor = [80, 20, 20];
    }
    
    // AI properties
    this.targetX = x;
    this.targetY = y;
    this.retargetTimer = 0;
  }
  
  update(p, consumables, allBlackHoles) {
    if (!this.alive) return;
    
    // Bounds checking
    this.x = p.constrain(this.x, this.radius, CANVAS_WIDTH - this.radius);
    this.y = p.constrain(this.y, this.radius, CANVAS_HEIGHT - this.radius);
    
    if (!this.isPlayer) {
      this.updateAI(p, consumables, allBlackHoles);
    }
  }
  
  updateAI(p, consumables, allBlackHoles) {
    this.retargetTimer--;
    
    if (this.retargetTimer <= 0) {
      this.retargetTimer = 60;
      
      // Find closest consumable or smaller black hole
      let closestTarget = null;
      let closestDist = Infinity;
      
      // Check consumables
      for (let obj of consumables) {
        if (obj.size <= this.radius * 0.8) {
          const d = p.dist(this.x, this.y, obj.x, obj.y);
          if (d < closestDist && d < 300) {
            closestDist = d;
            closestTarget = obj;
          }
        }
      }
      
      // Check other black holes
      for (let bh of allBlackHoles) {
        if (bh !== this && bh.alive && bh.radius < this.radius * 0.8) {
          const d = p.dist(this.x, this.y, bh.x, bh.y);
          if (d < closestDist && d < 400) {
            closestDist = d;
            closestTarget = bh;
          }
        }
      }
      
      // Evade larger black holes
      for (let bh of allBlackHoles) {
        if (bh !== this && bh.alive && bh.radius > this.radius * 1.2) {
          const d = p.dist(this.x, this.y, bh.x, bh.y);
          if (d < 200) {
            // Run away
            const angle = p.atan2(this.y - bh.y, this.x - bh.x);
            this.targetX = this.x + p.cos(angle) * 150;
            this.targetY = this.y + p.sin(angle) * 150;
            return;
          }
        }
      }
      
      if (closestTarget) {
        this.targetX = closestTarget.x;
        this.targetY = closestTarget.y;
      } else {
        // Random movement
        this.targetX = p.random(this.radius, CANVAS_WIDTH - this.radius);
        this.targetY = p.random(this.radius, CANVAS_HEIGHT - this.radius);
      }
    }
    
    // Move towards target
    const angle = p.atan2(this.targetY - this.y, this.targetX - this.x);
    this.x += p.cos(angle) * this.speed;
    this.y += p.sin(angle) * this.speed;
  }
  
  grow(amount) {
    this.radius += amount;
    this.mass = this.radius * this.radius;
  }
  
  canSwallow(obj) {
    if (obj.size !== undefined) {
      return obj.size <= this.radius * 0.8;
    } else if (obj.radius !== undefined) {
      return obj.radius < this.radius * 0.8;
    }
    return false;
  }
  
  checkCollision(p, obj) {
    if (obj.size !== undefined) {
      // Consumable object
      return p.collideCircleCircle(this.x, this.y, this.radius * 2, obj.x, obj.y, obj.size * 2);
    } else if (obj.radius !== undefined) {
      // Another black hole
      return p.collideCircleCircle(this.x, this.y, this.radius * 2, obj.x, obj.y, obj.radius * 2);
    }
    return false;
  }
  
  render(p) {
    if (!this.alive) return;
    
    p.push();
    
    // Glow effect
    for (let i = 3; i > 0; i--) {
      p.noStroke();
      p.fill(...this.glowColor, 30 * i);
      p.circle(this.x, this.y, this.radius * 2 + i * 8);
    }
    
    // Main black hole
    p.fill(...this.color);
    p.noStroke();
    p.circle(this.x, this.y, this.radius * 2);
    
    // Outline for AI
    if (!this.isPlayer) {
      p.noFill();
      p.stroke(200, 50, 50);
      p.strokeWeight(2);
      p.circle(this.x, this.y, this.radius * 2);
    }
    
    p.pop();
  }
}