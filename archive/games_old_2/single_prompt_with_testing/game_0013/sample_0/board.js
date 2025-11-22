// board.js - Board management

import { GRID_SIZE } from './globals.js';
import { Tile } from './tile.js';

export class Board {
  constructor() {
    this.grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
  }
  
  placeTile(x, y, tile) {
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      this.grid[y][x] = tile;
      return true;
    }
    return false;
  }
  
  getTile(x, y) {
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      return this.grid[y][x];
    }
    return null;
  }
  
  isValidPlacement(x, y, player) {
    // Must be adjacent to player's current position
    if (this.getTile(x, y) !== null) return false;
    
    const dx = Math.abs(x - player.boardX);
    const dy = Math.abs(y - player.boardY);
    
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }
  
  getValidPlacements(player) {
    const valid = [];
    const positions = [
      [player.boardX - 1, player.boardY],
      [player.boardX + 1, player.boardY],
      [player.boardX, player.boardY - 1],
      [player.boardX, player.boardY + 1],
    ];
    
    for (let pos of positions) {
      if (this.isValidPlacement(pos[0], pos[1], player)) {
        valid.push({x: pos[0], y: pos[1]});
      }
    }
    
    return valid;
  }
  
  draw(p, cellSize, offsetX, offsetY) {
    // Draw grid
    p.stroke(150);
    p.strokeWeight(1);
    p.noFill();
    
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const px = offsetX + x * cellSize;
        const py = offsetY + y * cellSize;
        p.rect(px, py, cellSize, cellSize);
        
        // Draw tile if present
        if (this.grid[y][x]) {
          this.grid[y][x].draw(p, px, py, cellSize);
        }
      }
    }
  }
}