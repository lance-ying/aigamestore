// tile.js - Tile class definition
import { TILE_SIZE, COLORS, COLOR_NAMES } from './globals.js';

export class Tile {
  constructor(gridX, gridY, color, p, texture = null) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.x = gridX;
    this.y = gridY;
    this.targetX = gridX;
    this.targetY = gridY;
    this.color = color;
    this.p = p;
    this.markedForClear = false;
    this.specialType = null; // 'ROCKET', 'BOMB'
    this.rocketDirection = null; // 'HORIZONTAL', 'VERTICAL'
    this.iceLayer = 0;
    this.chainLayer = 0;
    this.hasTargetItem = false;
    this.targetItemType = null; // 'KEY', 'CROWN'
    this.alpha = 255;
    this.scale = 1.0;
    this.animating = false;
    
    // Assign texture if not provided
    if (texture === null) {
      const textures = ['crystal', 'solid', 'fuzzy', 'wood'];
      this.texture = textures[Math.floor(p.random() * textures.length)];
    } else {
      this.texture = texture;
    }
    
    // Assign random background shape
    const shapes = ['square', 'circle', 'diamond', 'cross', 'x', 'hexagon'];
    this.shape = shapes[Math.floor(p.random() * shapes.length)];
  }

  update() {
    // Smooth position interpolation
    if (Math.abs(this.x - this.targetX) > 0.01) {
      this.x = this.p.lerp(this.x, this.targetX, 0.3);
    } else {
      this.x = this.targetX;
    }
    
    if (Math.abs(this.y - this.targetY) > 0.01) {
      this.y = this.p.lerp(this.y, this.targetY, 0.3);
    } else {
      this.y = this.targetY;
    }

    // Fade out animation
    if (this.markedForClear && this.alpha > 0) {
      this.alpha -= 25;
      this.scale -= 0.05;
      if (this.alpha < 0) this.alpha = 0;
      if (this.scale < 0.1) this.scale = 0.1;
    }
  }

  isAtTarget() {
    return Math.abs(this.x - this.targetX) < 0.01 && Math.abs(this.y - this.targetY) < 0.01;
  }

  render(offsetX, offsetY, isSelected, isCursor, isHinted, p) {
    const screenX = offsetX + this.x * TILE_SIZE;
    const screenY = offsetY + this.y * TILE_SIZE;

    p.push();
    p.translate(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
    p.scale(this.scale);

    // Tile background with different shapes
    const colorArray = COLORS[this.color];
    p.fill(...colorArray, this.alpha);
    p.stroke(40, 30, 20, this.alpha);
    p.strokeWeight(2);

    const halfSize = TILE_SIZE / 2 - 2; // Leave 2px margin

    switch (this.shape) {
      case 'square':
        p.rect(-halfSize, -halfSize, halfSize * 2, halfSize * 2, 4);
        break;
        
      case 'circle':
        p.circle(0, 0, halfSize * 2);
        break;
        
      case 'diamond':
        p.push();
        p.rotate(p.QUARTER_PI);
        const diamondSize = halfSize * 1.35;
        p.rect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);
        p.pop();
        break;
        
      case 'cross':
        // Draw a plus/cross shape
        const crossWidth = halfSize * 0.65;
        p.rect(-crossWidth / 2, -halfSize, crossWidth, halfSize * 2, 2);
        p.rect(-halfSize, -crossWidth / 2, halfSize * 2, crossWidth, 2);
        break;
        
      case 'x':
        // Draw an X shape using rotated rectangles
        p.push();
        p.rotate(p.QUARTER_PI);
        const xWidth = halfSize * 0.65;
        const xLength = halfSize * 1.75;
        p.rect(-xWidth / 2, -xLength / 2, xWidth, xLength, 2);
        p.rect(-xLength / 2, -xWidth / 2, xLength, xWidth, 2);
        p.pop();
        break;
        
      case 'hexagon':
        // Draw a hexagon
        p.beginShape();
        for (let i = 0; i < 6; i++) {
          const angle = p.TWO_PI / 6 * i - p.HALF_PI; // Start from top
          const x = halfSize * p.cos(angle);
          const y = halfSize * p.sin(angle);
          p.vertex(x, y);
        }
        p.endShape(p.CLOSE);
        break;
    }

    // Apply texture overlay
    this.renderTexture(p);

    // Special piece overlay
    if (this.specialType === 'ROCKET' && this.alpha > 100) {
      p.fill(255, 255, 255, this.alpha);
      p.noStroke();
      if (this.rocketDirection === 'HORIZONTAL') {
        p.triangle(-8, 0, 8, -6, 8, 6);
        p.rect(0, -4, 10, 8);
      } else {
        p.triangle(0, -8, -6, 8, 6, 8);
        p.rect(-4, 0, 8, 10);
      }
    } else if (this.specialType === 'BOMB' && this.alpha > 100) {
      p.fill(40, 40, 40, this.alpha);
      p.noStroke();
      p.circle(0, 0, 16);
      p.fill(255, 200, 100, this.alpha);
      p.rect(-2, -12, 4, 8);
    }

    // Target item overlay
    if (this.hasTargetItem && this.alpha > 100) {
      p.push();
      p.scale(0.8);
      if (this.targetItemType === 'KEY') {
        p.fill(255, 215, 0, this.alpha);
        p.noStroke();
        p.circle(-5, 0, 8);
        p.rect(-5, 0, 12, 4);
        p.rect(4, -2, 3, 8);
      } else if (this.targetItemType === 'CROWN') {
        p.fill(255, 215, 0, this.alpha);
        p.noStroke();
        p.triangle(-8, 4, 0, -8, 8, 4);
        p.rect(-10, 4, 20, 6);
        p.fill(200, 50, 50, this.alpha);
        p.circle(0, -4, 4);
      }
      p.pop();
    }

    p.pop();

    // Ice overlay
    if (this.iceLayer > 0) {
      p.fill(180, 220, 255, 150);
      p.noStroke();
      p.rect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4, 4);
      p.stroke(200, 240, 255, 200);
      p.strokeWeight(2);
      p.line(screenX + 5, screenY + 5, screenX + TILE_SIZE - 5, screenY + TILE_SIZE - 5);
      p.line(screenX + TILE_SIZE - 5, screenY + 5, screenX + 5, screenY + TILE_SIZE - 5);
    }

    // Chain overlay
    if (this.chainLayer > 0) {
      p.stroke(100, 100, 100);
      p.strokeWeight(3);
      p.noFill();
      p.circle(screenX + TILE_SIZE / 4, screenY + TILE_SIZE / 2, 8);
      p.circle(screenX + 3 * TILE_SIZE / 4, screenY + TILE_SIZE / 2, 8);
      p.line(screenX + TILE_SIZE / 4 + 4, screenY + TILE_SIZE / 2, 
             screenX + 3 * TILE_SIZE / 4 - 4, screenY + TILE_SIZE / 2);
    }

    // Hint highlight (pulsing yellow)
    if (isHinted) {
      const pulse = Math.sin(p.frameCount * 0.2) * 0.5 + 0.5;
      p.noFill();
      p.stroke(255, 255, 0, 150 + pulse * 105);
      p.strokeWeight(4);
      p.rect(screenX - 2, screenY - 2, TILE_SIZE + 4, TILE_SIZE + 4, 6);
    }

    // Selection highlight
    if (isSelected) {
      p.noFill();
      p.stroke(255, 255, 100);
      p.strokeWeight(3);
      p.rect(screenX + 2, screenY + 2, TILE_SIZE - 4, TILE_SIZE - 4, 4);
    }

    // Cursor highlight
    if (isCursor) {
      p.noFill();
      p.stroke(255, 255, 255, 200);
      p.strokeWeight(2);
      p.rect(screenX, screenY, TILE_SIZE, TILE_SIZE, 4);
    }
  }

  renderTexture(p) {
    const halfSize = TILE_SIZE / 2;
    const textureAlpha = this.alpha * 0.4; // Make textures semi-transparent
    
    switch (this.texture) {
      case 'crystal':
        // Crystal: diagonal lines and sparkle effect
        p.stroke(255, 255, 255, textureAlpha * 0.8);
        p.strokeWeight(1);
        for (let i = -halfSize; i < halfSize; i += 8) {
          p.line(i, -halfSize + 2, i + halfSize - 4, halfSize - 2);
        }
        // Add sparkles
        p.noStroke();
        p.fill(255, 255, 255, textureAlpha);
        p.circle(-10, -10, 3);
        p.circle(8, 6, 2);
        p.circle(-6, 12, 2);
        break;
        
      case 'solid':
        // Solid: subtle gradient effect
        p.noStroke();
        p.fill(255, 255, 255, textureAlpha * 0.3);
        p.rect(-halfSize + 2, -halfSize + 2, (TILE_SIZE - 4) / 2, TILE_SIZE - 4);
        break;
        
      case 'fuzzy':
        // Fuzzy: small dots pattern
        p.noStroke();
        p.fill(255, 255, 255, textureAlpha * 0.6);
        for (let y = -halfSize + 4; y < halfSize - 4; y += 6) {
          for (let x = -halfSize + 4; x < halfSize - 4; x += 6) {
            const offsetX = (p.noise(x * 0.1, y * 0.1) - 0.5) * 3;
            const offsetY = (p.noise(x * 0.1 + 100, y * 0.1) - 0.5) * 3;
            p.circle(x + offsetX, y + offsetY, 2);
          }
        }
        break;
        
      case 'wood':
        // Wood: horizontal grain lines
        p.stroke(80, 50, 20, textureAlpha * 0.7);
        p.strokeWeight(1);
        for (let y = -halfSize + 4; y < halfSize - 4; y += 4) {
          const waveOffset = p.sin(y * 0.3) * 3;
          p.line(-halfSize + 4 + waveOffset, y, halfSize - 4 + waveOffset, y);
        }
        // Add some darker knots
        p.noStroke();
        p.fill(60, 40, 10, textureAlpha * 0.5);
        p.ellipse(-8, 0, 6, 4);
        p.ellipse(10, -8, 4, 3);
        break;
    }
  }
}