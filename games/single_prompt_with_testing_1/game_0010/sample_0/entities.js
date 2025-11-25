// entities.js - Entity classes for trucks, packages, and houses

import { gameState, TRUCK_COLORS } from './globals.js';

export class Truck {
  constructor(color, x, y) {
    this.color = color;
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.path = [];
    this.currentPathIndex = 0;
    this.hasPackage = false;
    this.packageColor = null;
    this.delivered = false;
    this.crashed = false;
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.currentPathIndex = 0;
    this.hasPackage = false;
    this.packageColor = null;
    this.delivered = false;
    this.crashed = false;
  }

  addPathNode(x, y) {
    this.path.push({ x, y });
  }

  clearPath() {
    this.path = [];
    this.currentPathIndex = 0;
  }

  getNextMove() {
    if (this.currentPathIndex < this.path.length) {
      return this.path[this.currentPathIndex];
    }
    return null;
  }

  moveToNext() {
    const nextMove = this.getNextMove();
    if (nextMove) {
      this.x = nextMove.x;
      this.y = nextMove.y;
      this.currentPathIndex++;
      return true;
    }
    return false;
  }

  getColorRGB() {
    return TRUCK_COLORS[this.color] || [128, 128, 128];
  }

  render(p) {
    const [r, g, b] = this.getColorRGB();
    const screenX = this.x * 50;
    const screenY = this.y * 50;

    // Draw truck body
    p.push();
    p.translate(screenX + 25, screenY + 25);
    
    if (this.crashed) {
      // Crashed animation
      p.fill(255, 0, 0, 150);
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
      p.rect(-15, -15, 30, 30);
      
      // X mark
      p.line(-10, -10, 10, 10);
      p.line(-10, 10, 10, -10);
    } else {
      // Normal truck
      p.fill(r, g, b);
      p.stroke(0);
      p.strokeWeight(2);
      p.rect(-15, -15, 30, 30);
      
      // Cabin
      p.fill(r * 0.7, g * 0.7, b * 0.7);
      p.rect(-10, -10, 20, 12);
      
      // Package indicator
      if (this.hasPackage) {
        const pkgColor = TRUCK_COLORS[this.packageColor] || [200, 200, 200];
        p.fill(pkgColor[0], pkgColor[1], pkgColor[2]);
        p.rect(-8, 5, 16, 8);
      }
    }
    
    p.pop();
  }

  renderPath(p) {
    if (this.path.length === 0) return;

    const [r, g, b] = this.getColorRGB();
    p.stroke(r, g, b, 150);
    p.strokeWeight(4);
    p.noFill();

    p.beginShape();
    p.vertex(this.startX * 50 + 25, this.startY * 50 + 25);
    for (let node of this.path) {
      p.vertex(node.x * 50 + 25, node.y * 50 + 25);
    }
    p.endShape();

    // Draw nodes
    p.fill(r, g, b, 100);
    p.noStroke();
    for (let node of this.path) {
      p.circle(node.x * 50 + 25, node.y * 50 + 25, 8);
    }
  }
}

export class Package {
  constructor(color, x, y) {
    this.color = color;
    this.x = x;
    this.y = y;
    this.pickedUp = false;
  }

  reset() {
    this.pickedUp = false;
  }

  getColorRGB() {
    return TRUCK_COLORS[this.color] || [128, 128, 128];
  }

  render(p) {
    if (this.pickedUp) return;

    const [r, g, b] = this.getColorRGB();
    const screenX = this.x * 50 + 25;
    const screenY = this.y * 50 + 25;

    p.push();
    p.translate(screenX, screenY);
    
    // Package box
    p.fill(r, g, b);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(-12, -12, 24, 24);
    
    // Ribbon
    p.stroke(r * 0.5, g * 0.5, b * 0.5);
    p.strokeWeight(3);
    p.line(-12, 0, 12, 0);
    p.line(0, -12, 0, 12);
    
    p.pop();
  }
}

export class House {
  constructor(color, x, y) {
    this.color = color;
    this.x = x;
    this.y = y;
  }

  getColorRGB() {
    return TRUCK_COLORS[this.color] || [128, 128, 128];
  }

  render(p) {
    const [r, g, b] = this.getColorRGB();
    const screenX = this.x * 50 + 25;
    const screenY = this.y * 50 + 25;

    p.push();
    p.translate(screenX, screenY);
    
    // House base
    p.fill(r, g, b);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(-15, -8, 30, 20);
    
    // Roof
    p.fill(r * 0.6, g * 0.6, b * 0.6);
    p.triangle(-18, -8, 0, -20, 18, -8);
    
    // Door
    p.fill(100, 60, 20);
    p.rect(-5, 2, 10, 10);
    
    p.pop();
  }
}