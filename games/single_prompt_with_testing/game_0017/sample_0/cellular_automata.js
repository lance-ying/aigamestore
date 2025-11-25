// cellular_automata.js - Pixel-based physics simulation

import { ELEMENT_TYPES, CANVAS_WIDTH } from './globals.js';

export class CellularGrid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.nextGrid = [];
    
    for (let i = 0; i < width * height; i++) {
      this.grid.push(ELEMENT_TYPES.EMPTY);
      this.nextGrid.push(ELEMENT_TYPES.EMPTY);
    }
  }
  
  getIndex(x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) return -1;
    return iy * this.width + ix;
  }
  
  get(x, y) {
    const idx = this.getIndex(x, y);
    if (idx === -1) return ELEMENT_TYPES.EARTH;
    return this.grid[idx];
  }
  
  set(x, y, type) {
    const idx = this.getIndex(x, y);
    if (idx !== -1) {
      this.grid[idx] = type;
    }
  }
  
  setNext(x, y, type) {
    const idx = this.getIndex(x, y);
    if (idx !== -1) {
      this.nextGrid[idx] = type;
    }
  }
  
  swap() {
    const temp = this.grid;
    this.grid = this.nextGrid;
    this.nextGrid = temp;
  }
  
  isEmpty(x, y) {
    return this.get(x, y) === ELEMENT_TYPES.EMPTY;
  }
  
  isSolid(x, y) {
    const type = this.get(x, y);
    return type === ELEMENT_TYPES.EARTH || type === ELEMENT_TYPES.ICE;
  }
  
  update() {
    // Copy current to next
    for (let i = 0; i < this.grid.length; i++) {
      this.nextGrid[i] = this.grid[i];
    }
    
    // Update from bottom to top
    for (let y = this.height - 1; y >= 0; y--) {
      for (let x = 0; x < this.width; x++) {
        const type = this.get(x, y);
        
        if (type === ELEMENT_TYPES.WATER) {
          this.updateWater(x, y);
        } else if (type === ELEMENT_TYPES.FIRE) {
          this.updateFire(x, y);
        } else if (type === ELEMENT_TYPES.SMOKE) {
          this.updateSmoke(x, y);
        } else if (type === ELEMENT_TYPES.STEAM) {
          this.updateSteam(x, y);
        }
      }
    }
    
    this.swap();
  }
  
  updateWater(x, y) {
    // Water falls down
    if (y < this.height - 1 && this.isEmpty(x, y + 1)) {
      this.setNext(x, y, ELEMENT_TYPES.EMPTY);
      this.setNext(x, y + 1, ELEMENT_TYPES.WATER);
    } else if (y < this.height - 1) {
      // Spread sideways
      const dir = Math.random() < 0.5 ? -1 : 1;
      if (x + dir >= 0 && x + dir < this.width && this.isEmpty(x + dir, y)) {
        this.setNext(x, y, ELEMENT_TYPES.EMPTY);
        this.setNext(x + dir, y, ELEMENT_TYPES.WATER);
      }
    }
    
    // Extinguish fire
    if (this.get(x, y - 1) === ELEMENT_TYPES.FIRE) {
      this.setNext(x, y - 1, ELEMENT_TYPES.STEAM);
      this.setNext(x, y, ELEMENT_TYPES.EMPTY);
    }
  }
  
  updateFire(x, y) {
    // Fire rises and spreads
    if (Math.random() < 0.3) {
      this.setNext(x, y, ELEMENT_TYPES.SMOKE);
      
      if (y > 0 && this.isEmpty(x, y - 1)) {
        this.setNext(x, y - 1, ELEMENT_TYPES.FIRE);
      }
      
      // Spread to sides occasionally
      const dir = Math.random() < 0.5 ? -1 : 1;
      if (Math.random() < 0.2 && x + dir >= 0 && x + dir < this.width && this.isEmpty(x + dir, y)) {
        this.setNext(x + dir, y, ELEMENT_TYPES.FIRE);
      }
    }
  }
  
  updateSmoke(x, y) {
    // Smoke rises
    if (y > 0 && this.isEmpty(x, y - 1)) {
      this.setNext(x, y, ELEMENT_TYPES.EMPTY);
      this.setNext(x, y - 1, ELEMENT_TYPES.SMOKE);
    } else if (Math.random() < 0.05) {
      this.setNext(x, y, ELEMENT_TYPES.EMPTY);
    }
  }
  
  updateSteam(x, y) {
    // Steam rises faster
    if (y > 0 && this.isEmpty(x, y - 1)) {
      this.setNext(x, y, ELEMENT_TYPES.EMPTY);
      this.setNext(x, y - 1, ELEMENT_TYPES.STEAM);
    } else if (Math.random() < 0.1) {
      this.setNext(x, y, ELEMENT_TYPES.EMPTY);
    }
  }
  
  addCircle(x, y, radius, type) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= radius * radius) {
          this.set(x + dx, y + dy, type);
        }
      }
    }
  }
  
  addRect(x, y, w, h, type) {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        this.set(x + dx, y + dy, type);
      }
    }
  }
}