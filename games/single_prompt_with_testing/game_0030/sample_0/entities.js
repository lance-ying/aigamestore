// entities.js - Game entity classes

import { GRID_SIZE, CELL_SIZE, gameState } from './globals.js';

export class Ship {
  constructor(name, length, color, isPlayer) {
    this.name = name;
    this.length = length;
    this.color = color;
    this.isPlayer = isPlayer;
    this.positions = []; // Array of {x, y, hit: boolean}
    this.sunk = false;
    this.health = length;
  }
  
  place(startX, startY, horizontal) {
    this.positions = [];
    for (let i = 0; i < this.length; i++) {
      const x = horizontal ? startX + i : startX;
      const y = horizontal ? startY : startY + i;
      this.positions.push({ x, y, hit: false });
    }
  }
  
  checkHit(x, y) {
    for (let pos of this.positions) {
      if (pos.x === x && pos.y === y) {
        if (!pos.hit) {
          pos.hit = true;
          this.health--;
          if (this.health <= 0) {
            this.sunk = true;
          }
          return true;
        }
      }
    }
    return false;
  }
  
  occupies(x, y) {
    return this.positions.some(pos => pos.x === x && pos.y === y);
  }
  
  repair(amount) {
    if (this.sunk) return 0;
    
    let repaired = 0;
    for (let pos of this.positions) {
      if (pos.hit && repaired < amount) {
        pos.hit = false;
        this.health++;
        repaired++;
      }
    }
    return repaired;
  }
}

export class Grid {
  constructor() {
    this.cells = Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill(null).map(() => ({ 
        hit: false, 
        miss: false, 
        revealed: false 
      }))
    );
  }
  
  markHit(x, y) {
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      this.cells[y][x].hit = true;
    }
  }
  
  markMiss(x, y) {
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      this.cells[y][x].miss = true;
    }
  }
  
  reveal(x, y) {
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      this.cells[y][x].revealed = true;
    }
  }
  
  isTargeted(x, y) {
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      return this.cells[y][x].hit || this.cells[y][x].miss;
    }
    return false;
  }
}

export class VisualEffect {
  constructor(x, y, type, duration) {
    this.x = x;
    this.y = y;
    this.type = type; // 'explosion', 'splash', 'sonar'
    this.duration = duration;
    this.age = 0;
    this.alpha = 255;
  }
  
  update() {
    this.age++;
    this.alpha = 255 * (1 - this.age / this.duration);
    return this.age < this.duration;
  }
  
  render(p, offsetX, offsetY) {
    p.push();
    p.noStroke();
    
    if (this.type === 'explosion') {
      const size = (this.age / this.duration) * 30;
      p.fill(255, 100, 0, this.alpha);
      p.circle(offsetX + this.x * CELL_SIZE + CELL_SIZE / 2, 
               offsetY + this.y * CELL_SIZE + CELL_SIZE / 2, size);
      p.fill(255, 200, 0, this.alpha * 0.7);
      p.circle(offsetX + this.x * CELL_SIZE + CELL_SIZE / 2, 
               offsetY + this.y * CELL_SIZE + CELL_SIZE / 2, size * 0.6);
    } else if (this.type === 'splash') {
      const size = (this.age / this.duration) * 20;
      p.fill(100, 150, 255, this.alpha);
      p.circle(offsetX + this.x * CELL_SIZE + CELL_SIZE / 2, 
               offsetY + this.y * CELL_SIZE + CELL_SIZE / 2, size);
    } else if (this.type === 'sonar') {
      const size = (this.age / this.duration) * 40;
      p.stroke(0, 255, 0, this.alpha * 0.5);
      p.strokeWeight(2);
      p.noFill();
      p.circle(offsetX + this.x * CELL_SIZE + CELL_SIZE / 2, 
               offsetY + this.y * CELL_SIZE + CELL_SIZE / 2, size);
    }
    
    p.pop();
  }
}