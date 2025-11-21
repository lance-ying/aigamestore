import { BALL_COLORS, COLOR_NAMES } from './globals.js';

export class Ball {
  constructor(gridX, gridY, color, p) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.color = color;
    this.colorName = COLOR_NAMES[color];
    this.size = 0;
    this.targetSize = 0;
    this.isChained = false;
    this.isEliminating = false;
    this.eliminationProgress = 0;
    this.isFalling = false;
    this.id = `ball_${gridX}_${gridY}_${Date.now()}_${Math.random()}`;
    this.p = p;
    this.glowIntensity = 0;
  }

  updatePosition(cellSize, offsetX, offsetY) {
    this.targetX = offsetX + this.gridX * cellSize + cellSize / 2;
    this.targetY = offsetY + this.gridY * cellSize + cellSize / 2;
    this.targetSize = cellSize * 0.8;
    
    if (this.x === 0 && this.y === 0) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.size = this.targetSize;
    }
  }

  update() {
    // Smooth movement
    if (this.isFalling) {
      const speed = 0.3;
      this.x += (this.targetX - this.x) * speed;
      this.y += (this.targetY - this.y) * speed;
      this.size += (this.targetSize - this.size) * speed;
      
      if (Math.abs(this.y - this.targetY) < 1) {
        this.y = this.targetY;
        this.x = this.targetX;
        this.size = this.targetSize;
        this.isFalling = false;
      }
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
      this.size = this.targetSize;
    }

    // Update glow
    if (this.isChained) {
      this.glowIntensity = Math.min(1, this.glowIntensity + 0.1);
    } else {
      this.glowIntensity = Math.max(0, this.glowIntensity - 0.1);
    }

    // Update elimination
    if (this.isEliminating) {
      this.eliminationProgress += 0.05;
    }
  }

  draw() {
    if (this.isEliminating && this.eliminationProgress >= 1) {
      return;
    }

    const p = this.p;
    p.push();
    
    const alpha = this.isEliminating ? 255 * (1 - this.eliminationProgress) : 255;
    const currentSize = this.isEliminating ? this.size * (1 - this.eliminationProgress) : this.size;
    
    // Glow effect for chained balls
    if (this.glowIntensity > 0) {
      p.noFill();
      p.stroke(255, 255, 255, alpha * this.glowIntensity * 0.5);
      p.strokeWeight(3);
      p.ellipse(this.x, this.y, currentSize + 8);
    }
    
    // Main ball
    const ballColor = BALL_COLORS[this.colorName];
    p.fill(ballColor[0], ballColor[1], ballColor[2], alpha);
    p.stroke(0, 0, 0, alpha * 0.5);
    p.strokeWeight(2);
    p.ellipse(this.x, this.y, currentSize);
    
    // Highlight
    p.fill(255, 255, 255, alpha * 0.3);
    p.noStroke();
    p.ellipse(this.x - currentSize * 0.15, this.y - currentSize * 0.15, currentSize * 0.3);
    
    p.pop();
  }
}

export class Obstacle {
  constructor(gridX, gridY, p) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = 0;
    this.y = 0;
    this.size = 0;
    this.p = p;
    this.isObstacle = true;
  }

  updatePosition(cellSize, offsetX, offsetY) {
    this.x = offsetX + this.gridX * cellSize + cellSize / 2;
    this.y = offsetY + this.gridY * cellSize + cellSize / 2;
    this.size = cellSize * 0.9;
  }

  update() {}

  draw() {
    const p = this.p;
    p.push();
    p.fill(80, 80, 80);
    p.stroke(50, 50, 50);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(this.x, this.y, this.size, this.size, 5);
    
    // X pattern
    p.stroke(120, 120, 120);
    p.strokeWeight(3);
    const offset = this.size * 0.3;
    p.line(this.x - offset, this.y - offset, this.x + offset, this.y + offset);
    p.line(this.x + offset, this.y - offset, this.x - offset, this.y + offset);
    p.pop();
  }
}