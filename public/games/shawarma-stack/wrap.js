// wrap.js - Wrap management and rendering

import { INGREDIENTS, gameState } from './globals.js';

export class WrapRenderer {
  constructor(p) {
    this.p = p;
  }

  draw(wrap, x, y) {
    const p = this.p;
    
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.ellipse(x + 3, y + 3, 125, 125);
    
    // Base wrap with gradient
    for (let r = 60; r >= 0; r--) {
      let inter = r / 60;
      let c = p.lerpColor(p.color(225, 202, 159), p.color(245, 222, 179), inter);
      p.fill(c);
      p.noStroke();
      p.ellipse(x, y, r * 2, r * 2);
    }
    
    // Border
    p.noFill();
    p.stroke(139, 119, 101);
    p.strokeWeight(3);
    p.ellipse(x, y, 120, 120);
    
    // Draw ingredients on wrap with animation
    const radius = 35;
    const angleStep = p.TWO_PI / Math.max(wrap.length, 1);
    
    wrap.forEach((ingredientKey, index) => {
      const ingredient = INGREDIENTS[ingredientKey];
      if (ingredient) {
        const angle = angleStep * index;
        const ix = x + p.cos(angle) * radius;
        const iy = y + p.sin(angle) * radius;
        
        // Check if this is recently added
        const isRecent = gameState.lastAddedIngredient === ingredientKey && 
                        p.millis() - gameState.lastAddedTime < 300;
        
        let size = 15;
        if (isRecent) {
          // Pulse animation
          size += p.sin((p.millis() - gameState.lastAddedTime) * 0.02) * 3;
        }
        
        // Ingredient shadow
        p.fill(0, 0, 0, 50);
        p.noStroke();
        p.ellipse(ix + 1, iy + 1, size + 2);
        
        // Ingredient with gradient
        for (let r = size; r >= 0; r--) {
          let inter = r / size;
          let c = p.lerpColor(
            p.color(ingredient.color[0] * 0.7, ingredient.color[1] * 0.7, ingredient.color[2] * 0.7),
            p.color(...ingredient.color),
            inter
          );
          p.fill(c);
          p.noStroke();
          p.ellipse(ix, iy, r, r);
        }
        
        // Border
        p.noFill();
        p.stroke(0);
        p.strokeWeight(1.5);
        p.ellipse(ix, iy, size);
        
        // Highlight
        p.noStroke();
        p.fill(255, 255, 255, 150);
        p.ellipse(ix - size/4, iy - size/4, size/3, size/3);
        
        // Label with shadow
        p.fill(0);
        p.textSize(8);
        p.textAlign(p.CENTER, p.CENTER);
        p.textStyle(p.BOLD);
        p.text(ingredient.name[0], ix + 0.5, iy + 0.5);
        p.fill(255);
        p.text(ingredient.name[0], ix, iy);
      }
    });
    
    // Glow effect if wrap has items
    if (wrap.length > 0) {
      p.drawingContext.shadowBlur = 10;
      p.drawingContext.shadowColor = 'rgba(245, 222, 179, 0.5)';
      p.noFill();
      p.stroke(245, 222, 179);
      p.strokeWeight(1);
      p.ellipse(x, y, 125);
      p.drawingContext.shadowBlur = 0;
    }
    
    p.pop();
  }

  drawIngredientBins(availableIngredients, selectedIndex) {
    const p = this.p;
    const binY = 320;
    const binSpacing = 80;
    const startX = (CANVAS_WIDTH - (availableIngredients.length - 1) * binSpacing) / 2;
    
    availableIngredients.forEach((ingredientKey, index) => {
      const ingredient = INGREDIENTS[ingredientKey];
      if (ingredient) {
        const x = startX + index * binSpacing;
        
        // Shadow
        p.fill(0, 0, 0, 80);
        p.noStroke();
        p.rect(x - 19, binY - 18, 40, 40, 5);
        
        // Highlight if selected
        if (index === selectedIndex) {
          p.drawingContext.shadowBlur = 15;
          p.drawingContext.shadowColor = 'rgba(255, 255, 0, 0.8)';
          p.fill(255, 255, 0, 100);
          p.noStroke();
          p.rect(x - 25, binY - 25, 50, 50, 5);
          p.drawingContext.shadowBlur = 0;
        }
        
        // Bin with gradient
        for (let i = 0; i < 40; i++) {
          let inter = i / 40;
          let c = p.lerpColor(
            p.color(ingredient.color[0] * 0.8, ingredient.color[1] * 0.8, ingredient.color[2] * 0.8),
            p.color(...ingredient.color),
            inter
          );
          p.stroke(c);
          p.line(x - 20, binY - 20 + i, x + 20, binY - 20 + i);
        }
        
        // Border
        p.noFill();
        p.stroke(0);
        p.strokeWeight(3);
        p.rect(x - 20, binY - 20, 40, 40, 5);
        
        // Inner highlight
        p.stroke(255, 255, 255, 100);
        p.strokeWeight(2);
        p.line(x - 15, binY - 15, x - 5, binY - 15);
        p.line(x - 15, binY - 15, x - 15, binY - 5);
        
        // Label with shadow
        p.fill(0);
        p.noStroke();
        p.textSize(10);
        p.textAlign(p.CENTER, p.CENTER);
        p.textStyle(p.BOLD);
        p.text(ingredient.name, x + 0.5, binY + 30.5);
        p.fill(255, 255, 200);
        p.text(ingredient.name, x, binY + 30);
        
        p.textSize(8);
        p.fill(0);
        p.text(`[${ingredient.key}]`, x + 0.5, binY + 43.5);
        p.fill(200, 200, 255);
        p.text(`[${ingredient.key}]`, x, binY + 43);
      }
    });
  }
}

const CANVAS_WIDTH = 600;