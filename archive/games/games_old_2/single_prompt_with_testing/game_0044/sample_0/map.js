// map.js - Map generation and rendering

import { TILE_SIZE, MAP_COLS, MAP_ROWS } from './globals.js';

export class GameMap {
  constructor(p) {
    this.p = p;
    this.tiles = [];
    this.width = MAP_COLS;
    this.height = MAP_ROWS;
    this.generateMap();
  }
  
  generateMap() {
    // Generate a simple map with grass, paths, and obstacles
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        // Create borders
        if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
          row.push({ type: 'wall', walkable: false });
        }
        // Create some scattered obstacles
        else if (this.p.random() < 0.08) {
          row.push({ type: 'tree', walkable: false });
        }
        // Create paths
        else if ((x % 5 === 2 || y % 5 === 2) && this.p.random() < 0.7) {
          row.push({ type: 'path', walkable: true });
        }
        // Default grass
        else {
          row.push({ type: 'grass', walkable: true });
        }
      }
      this.tiles.push(row);
    }
    
    // Create a clear starting area
    for (let y = 1; y < 4; y++) {
      for (let x = 1; x < 4; x++) {
        this.tiles[y][x] = { type: 'path', walkable: true };
      }
    }
  }
  
  getTile(x, y) {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
      return { type: 'wall', walkable: false };
    }
    return this.tiles[tileY][tileX];
  }
  
  isWalkable(x, y) {
    return this.getTile(x, y).walkable;
  }
  
  render(p, cameraX, cameraY) {
    const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE));
    const endCol = Math.min(this.width, Math.ceil((cameraX + p.width) / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE));
    const endRow = Math.min(this.height, Math.ceil((cameraY + p.height) / TILE_SIZE));
    
    for (let y = startRow; y < endRow; y++) {
      for (let x = startCol; x < endCol; x++) {
        const tile = this.tiles[y][x];
        const screenX = x * TILE_SIZE - cameraX;
        const screenY = y * TILE_SIZE - cameraY;
        
        this.renderTile(p, tile, screenX, screenY);
      }
    }
  }
  
  renderTile(p, tile, x, y) {
    p.push();
    p.noStroke();
    
    switch (tile.type) {
      case 'grass':
        p.fill(80, 140, 60);
        p.rect(x, y, TILE_SIZE, TILE_SIZE);
        // Add some grass detail
        p.fill(70, 130, 55);
        for (let i = 0; i < 3; i++) {
          p.rect(x + i * 10 + 2, y + i * 8 + 3, 2, 4);
        }
        break;
      case 'path':
        p.fill(160, 140, 100);
        p.rect(x, y, TILE_SIZE, TILE_SIZE);
        p.fill(150, 130, 95);
        p.rect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        break;
      case 'tree':
        p.fill(80, 140, 60);
        p.rect(x, y, TILE_SIZE, TILE_SIZE);
        // Tree trunk
        p.fill(100, 70, 40);
        p.rect(x + 12, y + 16, 8, 12);
        // Tree crown
        p.fill(40, 100, 40);
        p.ellipse(x + 16, y + 14, 20, 20);
        p.fill(50, 120, 50);
        p.ellipse(x + 16, y + 12, 16, 16);
        break;
      case 'wall':
        p.fill(80, 80, 90);
        p.rect(x, y, TILE_SIZE, TILE_SIZE);
        p.fill(60, 60, 70);
        p.rect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        break;
    }
    
    p.pop();
  }
}