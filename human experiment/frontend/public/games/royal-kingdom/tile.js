// tile.js - Tile class definition
import { TILE_SIZE, COLORS, COLOR_NAMES } from './globals.js';

export class Tile {
  constructor(gridX, gridY, color, p) {
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

  render(offsetX, offsetY, isSelected, isCursor) {
    const p = this.p;
    const screenX = offsetX + this.x * TILE_SIZE;
    const screenY = offsetY + this.y * TILE_SIZE;

    p.push();
    p.translate(screenX + TILE_SIZE / 2, screenY + TILE_SIZE / 2);
    p.scale(this.scale);

    // Tile background
    const colorArray = COLORS[this.color];
    p.fill(...colorArray, this.alpha);
    p.stroke(40, 30, 20, this.alpha);
    p.strokeWeight(2);
    p.rect(-TILE_SIZE / 2 + 2, -TILE_SIZE / 2 + 2, TILE_SIZE - 4, TILE_SIZE - 4, 4);

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
}