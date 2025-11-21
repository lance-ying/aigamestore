import { CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_SIZE } from './globals.js';

export class Vehicle {
  constructor(x, y, length, isHorizontal, isTarget = false, color = null) {
    this.gridX = x;
    this.gridY = y;
    this.length = length;
    this.isHorizontal = isHorizontal;
    this.isTarget = isTarget;
    this.color = color || (isTarget ? [220, 50, 50] : this.randomColor());
    this.selected = false;
    this.grabbed = false;
    this.animOffset = 0;
  }

  randomColor() {
    const colors = [
      [100, 150, 200],
      [150, 100, 200],
      [200, 150, 100],
      [100, 200, 150],
      [200, 100, 150],
      [150, 200, 100]
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  canMoveTo(dx, dy, vehicles) {
    // Check if movement is along orientation
    if (this.isHorizontal && dy !== 0) return false;
    if (!this.isHorizontal && dx !== 0) return false;

    const newX = this.gridX + dx;
    const newY = this.gridY + dy;

    // Check grid boundaries
    if (newX < 0 || newY < 0) return false;
    if (this.isHorizontal && newX + this.length > GRID_SIZE) return false;
    if (!this.isHorizontal && newY + this.length > GRID_SIZE) return false;

    // Check collision with other vehicles
    for (let vehicle of vehicles) {
      if (vehicle === this) continue;
      if (this.wouldCollide(newX, newY, vehicle)) return false;
    }

    return true;
  }

  wouldCollide(x, y, other) {
    const cells = this.getCells(x, y);
    const otherCells = other.getCells();

    for (let cell of cells) {
      for (let otherCell of otherCells) {
        if (cell.x === otherCell.x && cell.y === otherCell.y) {
          return true;
        }
      }
    }
    return false;
  }

  getCells(x = this.gridX, y = this.gridY) {
    const cells = [];
    for (let i = 0; i < this.length; i++) {
      if (this.isHorizontal) {
        cells.push({ x: x + i, y: y });
      } else {
        cells.push({ x: x, y: y + i });
      }
    }
    return cells;
  }

  move(dx, dy) {
    this.gridX += dx;
    this.gridY += dy;
  }

  draw(p) {
    const x = GRID_OFFSET_X + this.gridX * CELL_SIZE;
    const y = GRID_OFFSET_Y + this.gridY * CELL_SIZE;
    const w = this.isHorizontal ? this.length * CELL_SIZE : CELL_SIZE;
    const h = this.isHorizontal ? CELL_SIZE : this.length * CELL_SIZE;

    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.rect(x + 3, y + 3, w - 6, h - 6, 5);

    // Main body
    const brightness = this.selected ? 1.3 : (this.grabbed ? 1.5 : 1);
    p.fill(this.color[0] * brightness, this.color[1] * brightness, this.color[2] * brightness);
    p.stroke(255, 255, 255, 150);
    p.strokeWeight(this.selected ? 3 : 2);
    p.rect(x, y, w - 6, h - 6, 5);

    // Highlights
    p.fill(255, 255, 255, 80);
    p.noStroke();
    p.rect(x + 5, y + 5, (w - 16) * 0.3, (h - 16) * 0.3, 2);

    // Target indicator
    if (this.isTarget) {
      p.fill(255, 255, 255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text("BUS", x + w / 2 - 3, y + h / 2 - 3);
    }

    // Grid lines on vehicle
    p.stroke(0, 0, 0, 30);
    p.strokeWeight(1);
    for (let i = 1; i < this.length; i++) {
      if (this.isHorizontal) {
        p.line(x + i * CELL_SIZE, y, x + i * CELL_SIZE, y + h - 6);
      } else {
        p.line(x, y + i * CELL_SIZE, x + w - 6, y + i * CELL_SIZE);
      }
    }
  }

  isAtExit() {
    if (!this.isTarget) return false;
    return this.gridX + this.length >= GRID_SIZE;
  }
}