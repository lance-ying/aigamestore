// entities.js - Game entities

import { GRID_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, ATTRACTIONS } from './globals.js';

export class Attraction {
  constructor(type, gridX, gridY) {
    this.type = type;
    this.gridX = gridX;
    this.gridY = gridY;
    this.config = ATTRACTIONS[type];
    this.x = GRID_OFFSET_X + gridX * GRID_SIZE + GRID_SIZE / 2;
    this.y = GRID_OFFSET_Y + gridY * GRID_SIZE + GRID_SIZE / 2;
    this.animation = 0;
    this.lastIncomeFrame = 0;
  }
  
  update(p) {
    this.animation += 0.05;
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    const size = this.config.size * GRID_SIZE - 4;
    const offset = (this.config.size - 1) * GRID_SIZE / 2;
    
    // Base
    p.fill(...this.config.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(-size/2 + offset, -size/2 + offset, size, size, 4);
    
    // Animation
    const bounce = Math.sin(this.animation * 2) * 2;
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.circle(0 + offset, bounce + offset, size / 3);
    
    // Icon based on type
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(this.config.name[0], offset, offset);
    
    p.pop();
  }
}

export class Guest {
  constructor(p) {
    this.x = p.random(GRID_OFFSET_X, GRID_OFFSET_X + GRID_SIZE * 5);
    this.y = GRID_OFFSET_Y - 30;
    this.targetX = this.x;
    this.targetY = this.y;
    this.speed = 1;
    this.state = "entering"; // entering, wandering, visiting, leaving
    this.currentAttraction = null;
    this.visitTimer = 0;
    this.happiness = 0;
    this.lifespan = 0;
    this.maxLifespan = 600;
    this.color = [p.random(100, 255), p.random(100, 255), p.random(100, 255)];
  }
  
  update(p, attractions, gameState) {
    this.lifespan++;
    
    if (this.lifespan > this.maxLifespan) {
      this.state = "leaving";
    }
    
    // Move towards target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > this.speed) {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
    }
    
    // State machine
    switch (this.state) {
      case "entering":
        if (dist < 2) {
          this.state = "wandering";
          this.pickRandomTarget(p, gameState);
        }
        break;
        
      case "wandering":
        if (dist < 2) {
          // Try to visit an attraction
          const nearbyAttraction = this.findNearestAttraction(attractions);
          if (nearbyAttraction && p.random() < 0.3) {
            this.currentAttraction = nearbyAttraction;
            this.targetX = nearbyAttraction.x;
            this.targetY = nearbyAttraction.y;
            this.state = "visiting";
          } else {
            this.pickRandomTarget(p, gameState);
          }
        }
        break;
        
      case "visiting":
        if (dist < 5 && this.currentAttraction) {
          this.visitTimer++;
          if (this.visitTimer > 60) {
            // Generate income
            const income = this.currentAttraction.config.income * (1 + gameState.efficiencyLevel * 0.2);
            gameState.money += income;
            this.happiness += this.currentAttraction.config.satisfaction;
            
            this.visitTimer = 0;
            this.currentAttraction = null;
            this.state = "wandering";
            this.pickRandomTarget(p, gameState);
          }
        } else if (dist < 2) {
          this.state = "wandering";
          this.pickRandomTarget(p, gameState);
        }
        break;
        
      case "leaving":
        this.targetY = GRID_OFFSET_Y + GRID_SIZE * gameState.gridHeight + 50;
        break;
    }
  }
  
  pickRandomTarget(p, gameState) {
    this.targetX = GRID_OFFSET_X + p.random(GRID_SIZE, GRID_SIZE * gameState.gridWidth);
    this.targetY = GRID_OFFSET_Y + p.random(GRID_SIZE, GRID_SIZE * gameState.gridHeight);
  }
  
  findNearestAttraction(attractions) {
    if (attractions.length === 0) return null;
    
    let nearest = null;
    let minDist = Infinity;
    
    for (const attraction of attractions) {
      const dx = attraction.x - this.x;
      const dy = attraction.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        nearest = attraction;
      }
    }
    
    return nearest;
  }
  
  render(p) {
    p.push();
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(1);
    p.circle(this.x, this.y, 8);
    
    // Happiness indicator
    if (this.happiness > 0) {
      p.fill(255, 200, 0);
      p.noStroke();
      p.circle(this.x, this.y - 12, 4);
    }
    
    p.pop();
  }
  
  shouldRemove() {
    return this.state === "leaving" && this.y > GRID_OFFSET_Y + GRID_SIZE * 10;
  }
}

export class Mascot {
  constructor(config, x, y) {
    this.config = config;
    this.x = x;
    this.y = y;
    this.animation = 0;
  }
  
  update(p) {
    this.animation += 0.1;
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    const bounce = Math.sin(this.animation) * 3;
    
    p.fill(...this.config.color);
    p.stroke(0);
    p.strokeWeight(2);
    p.circle(0, bounce, 20);
    
    // Eyes
    p.fill(255);
    p.circle(-5, bounce - 3, 6);
    p.circle(5, bounce - 3, 6);
    p.fill(0);
    p.circle(-5, bounce - 3, 3);
    p.circle(5, bounce - 3, 3);
    
    p.pop();
  }
}