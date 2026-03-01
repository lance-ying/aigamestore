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
    this.leaveDirection = 0;
    this.bounceOffset = 0;
    this.bouncePhase = 0;
    this.arrivalAnimation = 1.0;
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
    // Update arrival animation
    if (this.arrivalAnimation > 0) {
      this.arrivalAnimation -= deltaTime / 500;
      if (this.arrivalAnimation < 0) this.arrivalAnimation = 0;
    }
    
    // Update bounce animation
    this.bouncePhase += deltaTime / 1000;
    this.bounceOffset = this.p.sin(this.bouncePhase * 2) * 3;
    
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
    this.leaveDirection = Math.random() > 0.5 ? 1 : -1;
    
    // Create particles
    if (typeof window.createParticles === 'function') {
      const color = satisfied ? [100, 255, 100] : [255, 100, 100];
      window.createParticles(this.x, this.y - 20, color, 15, satisfied ? 'star' : 'normal');
    }
  }

  draw() {
    const p = this.p;
    
    // Animate position
    let drawX = this.x;
    let drawY = this.y + this.bounceOffset;
    
    // Arrival animation (drop from top)
    if (this.arrivalAnimation > 0) {
      drawY -= this.arrivalAnimation * 100;
    }
    
    // Leaving animation
    if (this.leaving) {
      drawY -= this.leaveProgress * 100;
      drawX += (this.leaveProgress * this.leaveProgress) * (this.leaveDirection * 50);
    }
    
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(this.x, this.y + 30, 35, 10);
    
    // Customer body with gradient
    for (let i = 0; i < 50; i++) {
      let inter = i / 50;
      let c = p.lerpColor(p.color(200, 150, 100), p.color(180, 130, 80), inter);
      p.stroke(c);
      p.line(drawX - 20, drawY - 25 + i, drawX + 20, drawY - 25 + i);
    }
    
    p.noStroke();
    p.fill(200, 150, 100);
    p.ellipse(drawX, drawY, 40, 50);
    
    // Head
    p.fill(220, 180, 140);
    p.ellipse(drawX, drawY - 30, 35, 35);
    
    // Eyes
    p.fill(0);
    p.ellipse(drawX - 8, drawY - 33, 4, 4);
    p.ellipse(drawX + 8, drawY - 33, 4, 4);
    
    // Eyebrows
    p.stroke(0);
    p.strokeWeight(2);
    p.noFill();
    if (this.timer < this.maxTimer * 0.3) {
      // Angry eyebrows
      p.line(drawX - 12, drawY - 38, drawX - 5, drawY - 36);
      p.line(drawX + 12, drawY - 38, drawX + 5, drawY - 36);
    } else {
      // Normal eyebrows
      p.line(drawX - 12, drawY - 37, drawX - 5, drawY - 37);
      p.line(drawX + 12, drawY - 37, drawX + 5, drawY - 37);
    }
    
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
    
    // Bubble shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.rect(x - 58, y - 23, 120, 40, 10);
    
    // Bubble background with gradient
    const timerPercent = this.timer / this.maxTimer;
    const bgColor = timerPercent > 0.5 ? [240, 240, 240] : 
                     timerPercent > 0.25 ? [255, 240, 200] : [255, 200, 200];
    
    for (let i = 0; i < 40; i++) {
      let inter = i / 40;
      let c = p.lerpColor(
        p.color(bgColor[0], bgColor[1], bgColor[2]),
        p.color(bgColor[0] * 0.9, bgColor[1] * 0.9, bgColor[2] * 0.9),
        inter
      );
      p.stroke(c);
      p.line(x - 60, y - 25 + i, x + 60, y - 25 + i);
    }
    
    p.noFill();
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(x - 60, y - 25, 120, 40, 10);
    
    // Triangle pointer
    p.fill(bgColor[0], bgColor[1], bgColor[2]);
    p.stroke(0);
    p.strokeWeight(2);
    p.triangle(x - 5, y + 15, x + 5, y + 15, x, y + 25);
    
    // Draw order items with better styling
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
        // Draw ingredient color dot with border
        p.stroke(0);
        p.strokeWeight(1.5);
        p.fill(...ingredient.color);
        p.ellipse(offsetX + 5, offsetY, 10, 10);
        
        // Inner highlight
        p.noStroke();
        p.fill(255, 255, 255, 100);
        p.ellipse(offsetX + 3, offsetY - 2, 4, 4);
        
        // Draw quantity with shadow
        p.fill(0);
        p.noStroke();
        p.textStyle(p.BOLD);
        p.text(`×${quantity}`, offsetX + 12, offsetY);
        
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
    
    // Timer bar background with border
    p.stroke(0);
    p.strokeWeight(2);
    p.fill(60);
    p.rect(x - 51, y - 1, 102, 10, 4);
    
    p.fill(100);
    p.noStroke();
    p.rect(x - 50, y, 100, 8, 4);
    
    // Timer bar fill with gradient
    const barColor = timerPercent > 0.5 ? [100, 200, 100] : 
                     timerPercent > 0.25 ? [255, 200, 50] : [255, 50, 50];
    
    for (let i = 0; i < 100 * timerPercent; i++) {
      let inter = i / (100 * timerPercent);
      let c = p.lerpColor(
        p.color(barColor[0] * 0.6, barColor[1] * 0.6, barColor[2] * 0.6),
        p.color(...barColor),
        inter
      );
      p.stroke(c);
      p.line(x - 50 + i, y, x - 50 + i, y + 8);
    }
    
    // Glow effect when low on time
    if (timerPercent < 0.3) {
      p.drawingContext.shadowBlur = 10;
      p.drawingContext.shadowColor = 'rgba(255, 50, 50, 0.8)';
      p.noFill();
      p.stroke(255, 50, 50);
      p.strokeWeight(1);
      p.rect(x - 50, y, 100 * timerPercent, 8, 4);
      p.drawingContext.shadowBlur = 0;
    }
  }
}