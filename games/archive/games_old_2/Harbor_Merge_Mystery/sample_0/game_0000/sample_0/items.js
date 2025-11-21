// items.js - Item management and rendering

import { ITEM_TYPES, CELL_SIZE } from './globals.js';

export class Item {
  constructor(itemType, level, gridX, gridY, id) {
    this.itemType = itemType;
    this.level = level;
    this.gridX = gridX;
    this.gridY = gridY;
    this.id = id;
    this.screenX = 0;
    this.screenY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.isAnimating = false;
    this.animationProgress = 0;
    this.spawnProgress = 0;
    this.mergeFlash = 0;
  }

  updateScreenPosition(startX, startY) {
    this.targetX = startX + this.gridX * CELL_SIZE + CELL_SIZE / 2;
    this.targetY = startY + this.gridY * CELL_SIZE + CELL_SIZE / 2;
    
    if (!this.isAnimating) {
      this.screenX = this.targetX;
      this.screenY = this.targetY;
    }
  }

  update(p) {
    if (this.spawnProgress < 1) {
      this.spawnProgress = Math.min(1, this.spawnProgress + 0.05);
    }
    
    if (this.isAnimating) {
      this.animationProgress += 0.15;
      if (this.animationProgress >= 1) {
        this.animationProgress = 0;
        this.isAnimating = false;
        this.screenX = this.targetX;
        this.screenY = this.targetY;
      } else {
        this.screenX = p.lerp(this.screenX, this.targetX, this.animationProgress);
        this.screenY = p.lerp(this.screenY, this.targetY, this.animationProgress);
      }
    }
    
    if (this.mergeFlash > 0) {
      this.mergeFlash -= 0.1;
    }
  }

  draw(p, isSelected = false, isDragging = false, mouseX = 0, mouseY = 0) {
    p.push();
    
    const x = isDragging ? mouseX : this.screenX;
    const y = isDragging ? mouseY : this.screenY;
    
    const alpha = this.spawnProgress * 255;
    const size = CELL_SIZE * 0.8;
    
    // Glow effect for selected items
    if (isSelected || isDragging) {
      p.noFill();
      p.stroke(255, 255, 100, alpha * 0.7);
      p.strokeWeight(3);
      p.ellipse(x, y, size + 10, size + 10);
    }
    
    // Merge flash effect
    if (this.mergeFlash > 0) {
      p.fill(255, 255, 255, this.mergeFlash * 200);
      p.noStroke();
      p.ellipse(x, y, size * (1 + this.mergeFlash * 0.5), size * (1 + this.mergeFlash * 0.5));
    }
    
    this.drawItemShape(p, x, y, size, alpha);
    
    // Level indicator
    p.fill(255, alpha);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(this.level, x, y + size * 0.4);
    
    p.pop();
  }

  drawItemShape(p, x, y, size, alpha) {
    p.strokeWeight(2);
    
    const colors = this.getColorForLevel();
    const [r, g, b] = colors;
    
    switch (this.itemType) {
      case 'COFFEE':
        p.fill(r, g, b, alpha);
        p.stroke(100, 50, 20, alpha);
        p.ellipse(x, y, size, size);
        // Handle detail
        if (this.level >= 2) {
          p.stroke(80, 40, 10, alpha);
          p.line(x + size * 0.3, y, x + size * 0.5, y - size * 0.2);
        }
        // Steam for higher levels
        if (this.level >= 4) {
          p.noFill();
          p.stroke(200, 200, 200, alpha * 0.5);
          p.strokeWeight(1);
          p.bezier(x, y - size * 0.4, x - 5, y - size * 0.6, x + 5, y - size * 0.7, x, y - size * 0.9);
        }
        break;
        
      case 'SANDWICH':
        p.fill(r, g, b, alpha);
        p.stroke(120, 80, 40, alpha);
        p.rect(x - size * 0.4, y - size * 0.3, size * 0.8, size * 0.6, 4);
        // Layers for higher levels
        if (this.level >= 3) {
          p.fill(r - 40, g - 20, b - 10, alpha);
          p.rect(x - size * 0.35, y - size * 0.1, size * 0.7, size * 0.2);
        }
        if (this.level >= 5) {
          p.fill(100, 200, 100, alpha);
          p.rect(x - size * 0.3, y, size * 0.6, size * 0.1);
        }
        break;
        
      case 'PASTRY':
        p.fill(r, g, b, alpha);
        p.stroke(150, 100, 50, alpha);
        p.triangle(x, y - size * 0.4, x - size * 0.4, y + size * 0.3, x + size * 0.4, y + size * 0.3);
        // Glaze for higher levels
        if (this.level >= 3) {
          p.fill(255, 200, 200, alpha * 0.6);
          p.noStroke();
          p.triangle(x, y - size * 0.3, x - size * 0.3, y + size * 0.2, x + size * 0.3, y + size * 0.2);
        }
        break;
        
      case 'JUICE':
        p.fill(r, g, b, alpha);
        p.stroke(100, 100, 150, alpha);
        // Glass shape
        p.beginShape();
        p.vertex(x - size * 0.25, y - size * 0.4);
        p.vertex(x + size * 0.25, y - size * 0.4);
        p.vertex(x + size * 0.35, y + size * 0.4);
        p.vertex(x - size * 0.35, y + size * 0.4);
        p.endShape(p.CLOSE);
        // Straw for higher levels
        if (this.level >= 2) {
          p.stroke(255, 50, 50, alpha);
          p.strokeWeight(3);
          p.line(x + size * 0.2, y - size * 0.4, x + size * 0.2, y - size * 0.6);
        }
        break;
        
      case 'SALAD':
        p.fill(r, g, b, alpha);
        p.stroke(80, 120, 60, alpha);
        p.ellipse(x, y, size, size * 0.8);
        // Vegetable details
        if (this.level >= 2) {
          p.fill(255, 100, 100, alpha);
          p.noStroke();
          p.ellipse(x - size * 0.2, y, size * 0.2, size * 0.2);
          p.ellipse(x + size * 0.2, y, size * 0.2, size * 0.2);
        }
        break;
        
      case 'BURGER':
        p.fill(r, g, b, alpha);
        p.stroke(100, 60, 30, alpha);
        // Bun top
        p.arc(x, y - size * 0.15, size * 0.8, size * 0.5, p.PI, 0, p.CHORD);
        // Patty
        p.fill(100, 50, 30, alpha);
        p.rect(x - size * 0.35, y - size * 0.1, size * 0.7, size * 0.2);
        // Bun bottom
        p.fill(r, g, b, alpha);
        p.rect(x - size * 0.4, y + size * 0.1, size * 0.8, size * 0.2, 0, 0, 4, 4);
        // Cheese for higher levels
        if (this.level >= 3) {
          p.fill(255, 200, 0, alpha);
          p.rect(x - size * 0.3, y - size * 0.05, size * 0.6, size * 0.1);
        }
        break;
    }
  }

  getColorForLevel() {
    const baseColors = {
      COFFEE: [139, 90, 43],
      SANDWICH: [230, 200, 140],
      PASTRY: [255, 220, 180],
      JUICE: [255, 180, 50],
      SALAD: [120, 200, 120],
      BURGER: [200, 150, 100]
    };
    
    const base = baseColors[this.itemType] || [150, 150, 150];
    const levelMultiplier = 1 + (this.level - 1) * 0.15;
    
    return [
      Math.min(255, base[0] * levelMultiplier),
      Math.min(255, base[1] * levelMultiplier),
      Math.min(255, base[2] * levelMultiplier)
    ];
  }
}

export function createRandomItem(gridX, gridY, id, level = 1) {
  const itemTypes = Object.keys(ITEM_TYPES);
  const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
  return new Item(randomType, level, gridX, gridY, id);
}