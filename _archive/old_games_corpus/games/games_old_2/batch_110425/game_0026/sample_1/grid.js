// grid.js - Grid management

import { GRID_COLS, GRID_ROWS } from './globals.js';

export class Grid {
  constructor() {
    this.cells = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      this.cells[y] = [];
      for (let x = 0; x < GRID_COLS; x++) {
        this.cells[y][x] = {
          occupied: false,
          attraction: null,
          available: (x < 5 && y < 5) // Start with limited land
        };
      }
    }
  }

  canPlace(x, y, size) {
    if (x < 0 || y < 0 || x + size > GRID_COLS || y + size > GRID_ROWS) {
      return false;
    }
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const cell = this.cells[y + dy][x + dx];
        if (!cell || !cell.available || cell.occupied) {
          return false;
        }
      }
    }
    return true;
  }

  placeAttraction(x, y, size, attraction) {
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        this.cells[y + dy][x + dx].occupied = true;
        this.cells[y + dy][x + dx].attraction = attraction;
      }
    }
  }

  removeAttraction(x, y) {
    const cell = this.cells[y][x];
    if (!cell || !cell.attraction) return null;
    
    const attraction = cell.attraction;
    const size = attraction.size;
    
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const cy = attraction.gridY + dy;
        const cx = attraction.gridX + dx;
        if (cy >= 0 && cy < GRID_ROWS && cx >= 0 && cx < GRID_COLS) {
          this.cells[cy][cx].occupied = false;
          this.cells[cy][cx].attraction = null;
        }
      }
    }
    
    return attraction;
  }

  expandLand(numCells) {
    let expanded = 0;
    for (let y = 0; y < GRID_ROWS && expanded < numCells; y++) {
      for (let x = 0; x < GRID_COLS && expanded < numCells; x++) {
        if (!this.cells[y][x].available) {
          this.cells[y][x].available = true;
          expanded++;
        }
      }
    }
    return expanded;
  }

  getAttractionAt(x, y) {
    if (x < 0 || y < 0 || x >= GRID_COLS || y >= GRID_ROWS) return null;
    return this.cells[y][x].attraction;
  }
}