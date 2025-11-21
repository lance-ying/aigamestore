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
    this.enemySpawns = []; // Track where to spawn moving enemies
    
    this.generateMap(level);
  }

  generateMap(level) {
    // Map sizes that fit in canvas (600x400 with offset 30,105 = 540x295 usable)
    // At 38px tiles = 14x7 max, using 13x7 for margins
    const sizes = [
      { w: 9, h: 5 },    // Level 1 - Easy, small and simple
      { w: 10, h: 5 },   // Level 2 - Easy
      { w: 10, h: 6 },   // Level 3 - Easy
      { w: 11, h: 6 },   // Level 4 - Medium
      { w: 11, h: 6 },   // Level 5 - Medium
      { w: 12, h: 6 },   // Level 6 - Medium
      { w: 12, h: 7 },   // Level 7 - Hard
      { w: 13, h: 7 },   // Level 8 - Hard
      { w: 13, h: 7 },   // Level 9 - Hard
      { w: 13, h: 7 },   // Level 10 - Expert
      { w: 13, h: 7 },   // Level 11 - Expert
      { w: 13, h: 7 },   // Level 12 - Expert
      { w: 13, h: 7 }    // Level 13 - Expert/Final Boss
    ];
    
    const size = sizes[level - 1] || sizes[sizes.length - 1];
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
    // Event distribution with difficulty progression
    const eventConfigs = [
      { walls: 2, events: 4, movingEnemies: 1, weapons: 1, traps: 0 },   // Level 1 - Easy intro
      { walls: 2, events: 5, movingEnemies: 2, weapons: 1, traps: 1 },   // Level 2 - Easy
      { walls: 3, events: 6, movingEnemies: 2, weapons: 1, traps: 1 },   // Level 3 - Easy
      { walls: 4, events: 7, movingEnemies: 3, weapons: 1, traps: 2 },   // Level 4 - Medium
      { walls: 5, events: 8, movingEnemies: 3, weapons: 2, traps: 2 },   // Level 5 - Medium
      { walls: 6, events: 9, movingEnemies: 4, weapons: 2, traps: 2 },   // Level 6 - Medium
      { walls: 7, events: 10, movingEnemies: 5, weapons: 2, traps: 3 },  // Level 7 - Hard
      { walls: 8, events: 11, movingEnemies: 5, weapons: 2, traps: 3 },  // Level 8 - Hard
      { walls: 9, events: 12, movingEnemies: 6, weapons: 2, traps: 4 },  // Level 9 - Hard
      { walls: 10, events: 13, movingEnemies: 6, weapons: 3, traps: 4 }, // Level 10 - Expert
      { walls: 11, events: 14, movingEnemies: 7, weapons: 3, traps: 5 }, // Level 11 - Expert
      { walls: 12, events: 15, movingEnemies: 7, weapons: 3, traps: 5 }, // Level 12 - Expert
      { walls: 13, events: 16, movingEnemies: 8, weapons: 3, traps: 6 }  // Level 13 - Expert/Final
    ];
    
    const config = eventConfigs[level - 1] || eventConfigs[eventConfigs.length - 1];
    
    // Create maze-like structure with walls
    this.addMazeWalls(config.walls);
    
    // Ensure path exists from start to exit
    this.ensurePathExists();
    
    // Add enemy spawn positions for moving enemies
    this.addEnemySpawns(config.movingEnemies);
    
    // Add weapons
    this.addGuaranteedEvents(TILE_TYPES.WEAPON, config.weapons);
    
    // Add specific trap count
    this.addGuaranteedEvents(TILE_TYPES.EVENT_TRAP, config.traps);
    
    // Fill remaining event slots with treasure, NPCs, and mystery
    const remainingEvents = config.events - config.traps;
    for (let i = 0; i < remainingEvents; i++) {
      const rand = Math.random();
      let eventType;
      if (rand < 0.5) {
        eventType = TILE_TYPES.EVENT_TREASURE; // 50% treasure
      } else if (rand < 0.75) {
        eventType = TILE_TYPES.EVENT_NPC; // 25% NPC
      } else {
        eventType = TILE_TYPES.EVENT_MYSTERY; // 25% mystery
      }
      this.addGuaranteedEvents(eventType, 1);
    }
  }

  addEnemySpawns(count) {
    // Collect all available empty tiles away from start and exit
    const validTiles = [];
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        // Don't spawn near start or exit
        const distFromStart = Math.abs(x - this.startX) + Math.abs(y - this.startY);
        const distFromExit = Math.abs(x - this.exitX) + Math.abs(y - this.exitY);
        
        if (this.tiles[y][x].type === TILE_TYPES.EMPTY &&
            distFromStart > 2 && distFromExit > 2) {
          validTiles.push({x, y});
        }
      }
    }
    
    // Shuffle and select spawn positions
    for (let i = validTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validTiles[i], validTiles[j]] = [validTiles[j], validTiles[i]];
    }
    
    const spawnCount = Math.min(count, validTiles.length);
    this.enemySpawns = validTiles.slice(0, spawnCount);
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
      }
      attempts++;
    }
  }

  addGuaranteedEvents(eventType, count) {
    // First, collect all available empty tiles
    const emptyTiles = [];
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.tiles[y][x].type === TILE_TYPES.EMPTY &&
            !(x === this.startX && y === this.startY) &&
            !(x === this.exitX && y === this.exitY)) {
          emptyTiles.push({x, y});
        }
      }
    }
    
    // Shuffle the empty tiles
    for (let i = emptyTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptyTiles[i], emptyTiles[j]] = [emptyTiles[j], emptyTiles[i]];
    }
    
    // Place events on the first N empty tiles
    const placedCount = Math.min(count, emptyTiles.length);
    for (let i = 0; i < placedCount; i++) {
      const tile = emptyTiles[i];
      this.tiles[tile.y][tile.x].type = eventType;
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