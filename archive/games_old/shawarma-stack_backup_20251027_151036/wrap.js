// wrap.js - Wrap management and rendering

import { INGREDIENTS } from './globals.js';

export class WrapRenderer {
  constructor(p) {
    this.p = p;
  }

  draw(wrap, x, y) {
    const p = this.p;
    
    p.push();
    
    // Base wrap
    p.fill(245, 222, 179);
    p.stroke(139, 119, 101);
    p.strokeWeight(2);
    p.ellipse(x, y, 120, 120);
    
    // Draw ingredients on wrap
    const radius = 35;
    const angleStep = p.TWO_PI / Math.max(wrap.length, 1);
    
    wrap.forEach((ingredientKey, index) => {
      const ingredient = INGREDIENTS[ingredientKey];
      if (ingredient) {
        const angle = angleStep * index;
        const ix = x + p.cos(angle) * radius;
        const iy = y + p.sin(angle) * radius;
        
        p.fill(...ingredient.color);
        p.noStroke();
        p.ellipse(ix, iy, 15, 15);
        
        // Label
        p.fill(0);
        p.textSize(8);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(ingredient.name[0], ix, iy);
      }
    });
    
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
        
        // Highlight if selected
        if (index === selectedIndex) {
          p.fill(255, 255, 0, 100);
          p.noStroke();
          p.rect(x - 25, binY - 25, 50, 50, 5);
        }
        
        // Bin
        p.fill(...ingredient.color);
        p.stroke(0);
        p.strokeWeight(2);
        p.rect(x - 20, binY - 20, 40, 40, 5);
        
        // Label
        p.fill(0);
        p.noStroke();
        p.textSize(10);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(ingredient.name, x, binY + 30);
        p.textSize(8);
        p.text(`[${ingredient.key}]`, x, binY + 43);
      }
    });
  }
}

const CANVAS_WIDTH = 600;