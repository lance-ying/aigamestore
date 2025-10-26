// customer.js - Customer entity and order management

import { INGREDIENTS, LEVEL_CONFIG } from './globals.js';

export class Customer {
  constructor(p, level, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.order = this.generateOrder(level);
    this.timer = LEVEL_CONFIG[level - 1].customerTimer;
    this.maxTimer = this.timer;
    this.satisfied = null;
    this.leaving = false;
    this.leaveProgress = 0;
  }

  generateOrder(level) {
    const config = LEVEL_CONFIG[level - 1];
    const available = config.availableIngredients;
    const complexity = Math.min(config.orderComplexity, available.length);
    
    const order = {};
    const numIngredients = this.p.floor(this.p.random(2, complexity + 1));
    
    // Always include meat
    order.MEAT = this.p.floor(this.p.random(1, 3));
    
    // Add random other ingredients
    const shuffled = [...available].filter(ing => ing !== "MEAT");
    for (let i = 0; i < Math.min(numIngredients - 1, shuffled.length); i++) {
      const randIndex = this.p.floor(this.p.random(shuffled.length));
      const ingredient = shuffled.splice(randIndex, 1)[0];
      order[ingredient] = this.p.floor(this.p.random(1, 3));
    }
    
    return order;
  }

  update(deltaTime) {
    if (this.leaving) {
      this.leaveProgress += deltaTime / 500;
      return this.leaveProgress >= 1;
    }
    
    this.timer -= deltaTime;
    return false;
  }

  startLeaving(satisfied) {
    this.satisfied = satisfied;
    this.leaving = true;
    this.leaveProgress = 0;
  }

  draw() {
    const p = this.p;
    
    // Animate position if leaving
    let drawX = this.x;
    let drawY = this.y;
    if (this.leaving) {
      drawY -= this.leaveProgress * 100;
    }
    
    p.push();
    
    // Customer body
    p.fill(200, 150, 100);
    p.noStroke();
    p.ellipse(drawX, drawY, 40, 50);
    
    // Head
    p.fill(220, 180, 140);
    p.ellipse(drawX, drawY - 30, 35, 35);
    
    // Eyes
    p.fill(0);
    p.ellipse(drawX - 8, drawY - 33, 4, 4);
    p.ellipse(drawX + 8, drawY - 33, 4, 4);
    
    // Mouth (happy or sad)
    if (this.satisfied === true) {
      p.noFill();
      p.stroke(0);
      p.strokeWeight(2);
      p.arc(drawX, drawY - 25, 15, 10, 0, p.PI);
    } else if (this.satisfied === false) {
      p.noFill();
      p.stroke(0);
      p.strokeWeight(2);
      p.arc(drawX, drawY - 20, 15, 10, p.PI, p.TWO_PI);
    } else {
      p.stroke(0);
      p.strokeWeight(2);
      p.line(drawX - 6, drawY - 25, drawX + 6, drawY - 25);
    }
    
    p.pop();
    
    // Draw order bubble
    if (!this.leaving) {
      this.drawOrderBubble(drawX, drawY - 60);
      this.drawTimer(drawX, drawY - 110);
    }
  }

  drawOrderBubble(x, y) {
    const p = this.p;
    
    // Bubble background
    const timerPercent = this.timer / this.maxTimer;
    const bgColor = timerPercent > 0.5 ? [240, 240, 240] : 
                     timerPercent > 0.25 ? [255, 240, 200] : [255, 200, 200];
    
    p.fill(...bgColor);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(x - 60, y - 25, 120, 40, 10);
    
    // Triangle pointer
    p.triangle(x - 5, y + 15, x + 5, y + 15, x, y + 25);
    
    // Draw order items
    p.textAlign(p.LEFT, p.CENTER);
    p.fill(0);
    p.noStroke();
    p.textSize(10);
    
    let offsetX = x - 55;
    let offsetY = y - 15;
    let count = 0;
    
    for (const [ingredientKey, quantity] of Object.entries(this.order)) {
      const ingredient = INGREDIENTS[ingredientKey];
      if (ingredient) {
        // Draw ingredient color dot
        p.fill(...ingredient.color);
        p.ellipse(offsetX + 5, offsetY, 8, 8);
        
        // Draw quantity
        p.fill(0);
        p.text(`x${quantity}`, offsetX + 12, offsetY);
        
        offsetX += 35;
        count++;
        if (count >= 3) {
          offsetX = x - 55;
          offsetY += 15;
          count = 0;
        }
      }
    }
  }

  drawTimer(x, y) {
    const p = this.p;
    const timerPercent = Math.max(0, this.timer / this.maxTimer);
    
    // Timer bar background
    p.fill(100);
    p.noStroke();
    p.rect(x - 50, y, 100, 8, 4);
    
    // Timer bar fill
    const barColor = timerPercent > 0.5 ? [100, 200, 100] : 
                     timerPercent > 0.25 ? [255, 200, 50] : [255, 50, 50];
    p.fill(...barColor);
    p.rect(x - 50, y, 100 * timerPercent, 8, 4);
  }
}