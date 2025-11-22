// map.js - Map generation and tile management

import { TILE_TYPES } from './globals.js';

export class GameMap {
  constructor(level) {
    this.level = level;
    this.width = 0;
    this.height = 0;
    this.tiles = [];
    this.startX = 0;
    this.startY = 0;
    this.exitX = 0;
    this.exitY = 0;
    
    this.generateMap(level);
  }

  generateMap(level) {
    // Map sizes based on level
    const sizes = [
      { w: 6, h: 5 },  // Level 1
      { w: 8, h: 6 },  // Level 2
      { w: 9, h: 7 },  // Level 3
      { w: 10, h: 8 } // Level 4
    ];
    
    const size = sizes[level - 1] || sizes[0];
    this.width = size.w;
    this.height = size.h;
    
    // Initialize empty grid
    this.tiles = [];
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = {
          type: TILE_TYPES.EMPTY,
          visited: false,
          interacted: false
        };
      }
    }
    
    // Add walls around the perimeter
    for (let x = 0; x < this.width; x++) {
      this.tiles[0][x].type = TILE_TYPES.WALL;
      this.tiles[this.height - 1][x].type = TILE_TYPES.WALL;
    }
    for (let y = 0; y < this.height; y++) {
      this.tiles[y][0].type = TILE_TYPES.WALL;
      this.tiles[y][this.width - 1].type = TILE_TYPES.WALL;
    }
    
    // Set start position (top-left area)
    this.startX = 1;
    this.startY = 1;
    
    // Set exit position (bottom-right area)
    this.exitX = this.width - 2;
    this.exitY = this.height - 2;
    this.tiles[this.exitY][this.exitX].type = TILE_TYPES.EXIT;
    
    // Add internal obstacles and events based on level
    this.addLevelFeatures(level);
  }

  addLevelFeatures(level) {
    // Event distribution based on level difficulty - more challenging
    const eventConfigs = [
      { walls: 4, events: 5, enemies: 2, traps: 1 },   // Level 1
      { walls: 8, events: 8, enemies: 3, traps: 2 },   // Level 2
      { walls: 12, events: 12, enemies: 5, traps: 4 }, // Level 3
      { walls: 16, events: 15, enemies: 7, traps: 5 }  // Level 4
    ];
    
    const config = eventConfigs[level - 1] || eventConfigs[0];
    
    // Create maze-like structure with walls
    this.addMazeWalls(config.walls);
    
    // Ensure path exists from start to exit
    this.ensurePathExists();
    
    // Add specific enemy count
    this.addSpecificEvents(TILE_TYPES.EVENT_ENEMY, config.enemies);
    
    // Add specific trap count
    this.addSpecificEvents(TILE_TYPES.EVENT_TRAP, config.traps);
    
    // Fill remaining event slots with variety
    const remainingEvents = config.events - config.enemies - config.traps;
    for (let i = 0; i < remainingEvents; i++) {
      const rand = Math.random();
      let eventType;
      if (rand < 0.4) {
        eventType = TILE_TYPES.EVENT_TREASURE; // 40% treasure
      } else if (rand < 0.6) {
        eventType = TILE_TYPES.EVENT_NPC; // 20% NPC
      } else {
        eventType = TILE_TYPES.EVENT_MYSTERY; // 20% mystery
      }
      this.addSpecificEvents(eventType, 1);
    }
  }

  addMazeWalls(wallCount) {
    let wallsAdded = 0;
    let attempts = 0;
    
    while (wallsAdded < wallCount && attempts < 150) {
      const x = Math.floor(Math.random() * (this.width - 2)) + 1;
      const y = Math.floor(Math.random() * (this.height - 2)) + 1;
      
      // Don't block start or exit
      if ((x === this.startX && y === this.startY) || 
          (x === this.exitX && y === this.exitY)) {
        attempts++;
        continue;
      }
      
      // Don't block immediate neighbors of start or exit
      if (Math.abs(x - this.startX) <= 1 && Math.abs(y - this.startY) <= 1) {
        attempts++;
        continue;
      }
      if (Math.abs(x - this.exitX) <= 1 && Math.abs(y - this.exitY) <= 1) {
        attempts++;
        continue;
      }
      
      if (this.tiles[y][x].type === TILE_TYPES.EMPTY) {
        this.tiles[y][x].type = TILE_TYPES.WALL;
        wallsAdded++;
        
        // Sometimes add connected walls to create corridors
        if (Math.random() < 0.4 && wallsAdded < wallCount) {
          const directions = [[0,1], [1,0], [0,-1], [-1,0]];
          const dir = directions[Math.floor(Math.random() * directions.length)];
          const nx = x + dir[0];
          const ny = y + dir[1];
          
          if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1) {
            if (this.tiles[ny][nx].type === TILE_TYPES.EMPTY &&
                !(nx === this.startX && ny === this.startY) &&
                !(nx === this.exitX && ny === this.exitY)) {
              this.tiles[ny][nx].type = TILE_TYPES.WALL;
              wallsAdded++;
            }
          }
        }
      }
      attempts++;
    }
  }

  addSpecificEvents(eventType, count) {
    let eventsAdded = 0;
    let attempts = 0;
    
    while (eventsAdded < count && attempts < 100) {
      const x = Math.floor(Math.random() * (this.width - 2)) + 1;
      const y = Math.floor(Math.random() * (this.height - 2)) + 1;
      
      // Don't place on start or exit
      if ((x === this.startX && y === this.startY) || 
          (x === this.exitX && y === this.exitY)) {
        attempts++;
        continue;
      }
      
      if (this.tiles[y][x].type === TILE_TYPES.EMPTY) {
        this.tiles[y][x].type = eventType;
        eventsAdded++;
      }
      attempts++;
    }
  }

  ensurePathExists() {
    // Simple flood fill to ensure path exists
    const visited = Array(this.height).fill(null).map(() => Array(this.width).fill(false));
    const queue = [{x: this.startX, y: this.startY}];
    visited[this.startY][this.startX] = true;
    
    while (queue.length > 0) {
      const current = queue.shift();
      
      if (current.x === this.exitX && current.y === this.exitY) {
        return; // Path exists
      }
      
      const neighbors = [
        {x: current.x - 1, y: current.y},
        {x: current.x + 1, y: current.y},
        {x: current.x, y: current.y - 1},
        {x: current.x, y: current.y + 1}
      ];
      
      for (const n of neighbors) {
        if (n.x > 0 && n.x < this.width - 1 && n.y > 0 && n.y < this.height - 1) {
          if (!visited[n.y][n.x] && this.tiles[n.y][n.x].type !== TILE_TYPES.WALL) {
            visited[n.y][n.x] = true;
            queue.push(n);
          }
        }
      }
    }
    
    // If no path exists, clear a simple path
    this.clearPathToExit();
  }

  clearPathToExit() {
    let x = this.startX;
    let y = this.startY;
    
    while (x !== this.exitX || y !== this.exitY) {
      if (this.tiles[y][x].type === TILE_TYPES.WALL) {
        this.tiles[y][x].type = TILE_TYPES.EMPTY;
      }
      
      if (x < this.exitX) x++;
      else if (x > this.exitX) x--;
      else if (y < this.exitY) y++;
      else if (y > this.exitY) y--;
    }
  }

  getTileAt(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.tiles[y][x];
  }

  isEventTile(type) {
    return type === TILE_TYPES.EVENT_TREASURE ||
           type === TILE_TYPES.EVENT_TRAP ||
           type === TILE_TYPES.EVENT_ENEMY ||
           type === TILE_TYPES.EVENT_NPC ||
           type === TILE_TYPES.EVENT_MYSTERY;
  }
}