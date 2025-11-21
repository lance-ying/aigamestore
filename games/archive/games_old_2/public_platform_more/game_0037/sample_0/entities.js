// entities.js - Game entities

import { gameState, FIREPLACE_X, FIREPLACE_Y, FIREPLACE_WIDTH, FIREPLACE_HEIGHT } from './globals.js';

export class Item {
  constructor(template, x, y) {
    this.id = template.id;
    this.name = template.name;
    this.cost = template.cost;
    this.burnTime = template.burnTime;
    this.maxBurnTime = template.burnTime;
    this.color = template.color;
    this.catalog = template.catalog;
    
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    
    this.isBurning = false;
    this.burnProgress = 0;
    this.isDragging = false;
    
    // Burning effects
    this.flames = [];
    this.smoke = [];
    this.sparkles = [];
    
    // Initialize particle effects
    for (let i = 0; i < 5; i++) {
      this.flames.push({
        offsetX: (Math.random() - 0.5) * 20,
        offsetY: Math.random() * -20,
        life: Math.random(),
        speed: 0.5 + Math.random() * 0.5
      });
    }
  }
  
  startBurning() {
    this.isBurning = true;
    this.isDragging = false;
  }
  
  update() {
    if (this.isBurning) {
      this.burnProgress++;
      
      // Update flame particles
      this.flames.forEach(flame => {
        flame.life += flame.speed * 0.02;
        if (flame.life > 1) flame.life = 0;
      });
      
      // Generate smoke as burning progresses
      if (this.burnProgress % 10 === 0 && this.smoke.length < 8) {
        this.smoke.push({
          x: this.x + (Math.random() - 0.5) * this.width,
          y: this.y,
          vy: -1 - Math.random(),
          vx: (Math.random() - 0.5) * 0.5,
          life: 0,
          maxLife: 60 + Math.random() * 40
        });
      }
      
      // Update smoke
      this.smoke.forEach(s => {
        s.y += s.vy;
        s.x += s.vx;
        s.life++;
      });
      this.smoke = this.smoke.filter(s => s.life < s.maxLife);
      
      // Generate sparkles for special items
      if (this.burnProgress % 15 === 0 && this.sparkles.length < 5) {
        this.sparkles.push({
          x: this.x + (Math.random() - 0.5) * this.width,
          y: this.y + (Math.random() - 0.5) * this.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 0,
          maxLife: 30
        });
      }
      
      // Update sparkles
      this.sparkles.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.life++;
      });
      this.sparkles = this.sparkles.filter(s => s.life < s.maxLife);
    }
  }
  
  render(p) {
    p.push();
    
    if (this.isBurning) {
      // Render smoke
      this.smoke.forEach(s => {
        const alpha = 255 * (1 - s.life / s.maxLife);
        p.fill(100, 100, 100, alpha);
        p.noStroke();
        const size = 5 + (s.life / s.maxLife) * 10;
        p.ellipse(s.x, s.y, size, size);
      });
      
      // Render item (shrinking as it burns)
      const burnRatio = 1 - (this.burnProgress / this.maxBurnTime);
      const currentWidth = this.width * burnRatio;
      const currentHeight = this.height * burnRatio;
      
      p.fill(...this.color);
      p.stroke(0);
      p.strokeWeight(1);
      p.rect(this.x - currentWidth / 2, this.y - currentHeight / 2, currentWidth, currentHeight);
      
      // Render flames
      this.flames.forEach(flame => {
        const flameY = this.y + flame.offsetY - flame.life * 15;
        const flameX = this.x + flame.offsetX;
        const alpha = 255 * (1 - flame.life);
        
        // Gradient from yellow to red
        const r = 255;
        const g = 255 - flame.life * 155;
        const b = 0;
        
        p.fill(r, g, b, alpha);
        p.noStroke();
        const flameSize = 8 * (1 - flame.life * 0.5);
        p.ellipse(flameX, flameY, flameSize, flameSize * 1.5);
      });
      
      // Render sparkles
      this.sparkles.forEach(s => {
        const alpha = 255 * (1 - s.life / s.maxLife);
        p.fill(255, 255, 0, alpha);
        p.noStroke();
        p.ellipse(s.x, s.y, 3, 3);
      });
      
      // Burn progress indicator
      const barWidth = 40;
      const barHeight = 4;
      const barX = this.x - barWidth / 2;
      const barY = this.y - this.height - 10;
      
      p.stroke(0);
      p.strokeWeight(1);
      p.fill(50);
      p.rect(barX, barY, barWidth, barHeight);
      
      p.fill(255, 100, 0);
      p.noStroke();
      const progressWidth = barWidth * (this.burnProgress / this.maxBurnTime);
      p.rect(barX, barY, progressWidth, barHeight);
      
    } else {
      // Render normal item
      p.fill(...this.color);
      p.stroke(this.isDragging ? [255, 255, 0] : [0]);
      p.strokeWeight(this.isDragging ? 2 : 1);
      p.rect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
      
      // Item name
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(8);
      p.text(this.name.substring(0, 8), this.x, this.y);
    }
    
    p.pop();
  }
  
  isFinishedBurning() {
    return this.isBurning && this.burnProgress >= this.maxBurnTime;
  }
  
  isInFireplace() {
    return this.x > FIREPLACE_X && 
           this.x < FIREPLACE_X + FIREPLACE_WIDTH &&
           this.y > FIREPLACE_Y && 
           this.y < FIREPLACE_Y + FIREPLACE_HEIGHT;
  }
}

export class Catalog {
  constructor(index, items) {
    this.index = index;
    this.items = items;
    this.unlocked = index === 0; // First catalog starts unlocked
  }
  
  unlock() {
    this.unlocked = true;
  }
}

export class Letter {
  constructor(message, sender) {
    this.message = message;
    this.sender = sender;
    this.readTime = 0;
    this.dismissed = false;
  }
}