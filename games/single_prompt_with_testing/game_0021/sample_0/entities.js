// entities.js
import { TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, TILE_TYPES } from './globals.js';

export class Block {
  constructor(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = TILE_TYPES.BLOCK;
  }

  getScreenX() {
    return GRID_OFFSET_X + this.gridX * TILE_SIZE;
  }

  getScreenY() {
    return GRID_OFFSET_Y + this.gridY * TILE_SIZE;
  }

  setGridPosition(x, y) {
    this.gridX = x;
    this.gridY = y;
  }

  render(p) {
    const x = this.getScreenX();
    const y = this.getScreenY();
    
    p.push();
    p.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    
    // Stone block
    p.fill(120, 120, 120);
    p.stroke(80, 80, 80);
    p.strokeWeight(2);
    p.rect(-15, -15, 30, 30, 3);
    
    // Highlights and shadows
    p.noStroke();
    p.fill(150, 150, 150);
    p.rect(-15, -15, 8, 8);
    p.fill(90, 90, 90);
    p.rect(7, 7, 8, 8);
    
    // Cracks
    p.stroke(70, 70, 70);
    p.strokeWeight(1);
    p.line(-5, -10, 5, -5);
    p.line(-8, 0, 0, 5);
    
    p.pop();
  }
}

export class Skeleton {
  constructor(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = TILE_TYPES.SKELETON;
    this.animOffset = Math.random() * 100;
  }

  getScreenX() {
    return GRID_OFFSET_X + this.gridX * TILE_SIZE;
  }

  getScreenY() {
    return GRID_OFFSET_Y + this.gridY * TILE_SIZE;
  }

  setGridPosition(x, y) {
    this.gridX = x;
    this.gridY = y;
  }

  render(p) {
    const x = this.getScreenX();
    const y = this.getScreenY();
    const wobble = p.sin((p.frameCount + this.animOffset) * 0.1) * 2;
    
    p.push();
    p.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2 + wobble);
    
    // Skull
    p.fill(240, 240, 230);
    p.stroke(200, 200, 190);
    p.strokeWeight(2);
    p.ellipse(0, -10, 16, 18);
    
    // Eye sockets
    p.fill(0);
    p.noStroke();
    p.ellipse(-4, -12, 4, 6);
    p.ellipse(4, -12, 4, 6);
    
    // Nose hole
    p.triangle(-1, -8, 1, -8, 0, -5);
    
    // Jaw
    p.fill(240, 240, 230);
    p.stroke(200, 200, 190);
    p.strokeWeight(2);
    p.arc(0, -6, 12, 10, 0, p.PI);
    
    // Teeth
    p.noStroke();
    p.fill(255);
    for (let i = -4; i <= 4; i += 3) {
      p.rect(i, -6, 2, 3);
    }
    
    // Spine/body
    p.stroke(240, 240, 230);
    p.strokeWeight(3);
    p.line(0, 0, 0, 12);
    
    // Ribs
    p.strokeWeight(2);
    p.line(-6, 2, 6, 2);
    p.line(-5, 6, 5, 6);
    p.line(-4, 10, 4, 10);
    
    p.pop();
  }
}

export class DemonGirl {
  constructor(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = TILE_TYPES.GOAL;
    this.animOffset = Math.random() * 100;
  }

  getScreenX() {
    return GRID_OFFSET_X + this.gridX * TILE_SIZE;
  }

  getScreenY() {
    return GRID_OFFSET_Y + this.gridY * TILE_SIZE;
  }

  render(p) {
    const x = this.getScreenX();
    const y = this.getScreenY();
    const float = p.sin((p.frameCount + this.animOffset) * 0.05) * 3;
    
    p.push();
    p.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2 + float);
    
    // Demon girl silhouette
    // Body (dress)
    p.fill(180, 50, 80);
    p.stroke(140, 40, 60);
    p.strokeWeight(2);
    p.triangle(-12, 15, 12, 15, 0, -5);
    
    // Head
    p.fill(255, 200, 200);
    p.stroke(200, 150, 150);
    p.strokeWeight(2);
    p.ellipse(0, -12, 16, 18);
    
    // Horns
    p.fill(60, 20, 20);
    p.noStroke();
    p.triangle(-8, -20, -10, -12, -6, -12);
    p.triangle(8, -20, 10, -12, 6, -12);
    
    // Hair
    p.fill(100, 30, 30);
    p.arc(0, -12, 18, 16, p.PI, 0);
    p.rect(-9, -12, 18, 8);
    
    // Eyes (heart-shaped)
    p.fill(255, 100, 150);
    p.ellipse(-4, -12, 4, 4);
    p.ellipse(4, -12, 4, 4);
    
    // Smile
    p.stroke(180, 80, 100);
    p.strokeWeight(1);
    p.noFill();
    p.arc(0, -8, 8, 6, 0, p.PI);
    
    // Heart effect
    p.noStroke();
    p.fill(255, 100, 150, 150);
    const heartSize = 4 + p.sin((p.frameCount + this.animOffset) * 0.1) * 2;
    p.ellipse(-15, -15, heartSize, heartSize);
    p.ellipse(15, -15, heartSize, heartSize);
    
    p.pop();
  }
}

export class Spike {
  constructor(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.type = TILE_TYPES.SPIKE;
  }

  getScreenX() {
    return GRID_OFFSET_X + this.gridX * TILE_SIZE;
  }

  getScreenY() {
    return GRID_OFFSET_Y + this.gridY * TILE_SIZE;
  }

  render(p) {
    const x = this.getScreenX();
    const y = this.getScreenY();
    
    p.push();
    p.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    
    // Spike trap
    p.fill(80, 80, 90);
    p.noStroke();
    p.rect(-18, 10, 36, 8);
    
    // Spikes
    p.fill(140, 140, 150);
    for (let i = -15; i <= 15; i += 8) {
      p.triangle(i - 3, 10, i + 3, 10, i, -5);
    }
    
    // Glow effect
    p.fill(255, 50, 50, 100);
    for (let i = -15; i <= 15; i += 8) {
      p.triangle(i - 2, 5, i + 2, 5, i, -3);
    }
    
    p.pop();
  }
}