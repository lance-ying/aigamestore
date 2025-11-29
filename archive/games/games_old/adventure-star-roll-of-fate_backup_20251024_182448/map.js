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
      { w: 5, h: 5 },  // Level 1
      { w: 7, h: 7 },  // Level 2
      { w: 9, h: 9 },  // Level 3
      { w: 10, h: 10 } // Level 4
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
    
    // Set start position (top-left area)
    this.startX = 1;
    this.startY = 1;
    
    // Set exit position (bottom-right area)
    this.exitX = this.width - 2;
    this.exitY = this.height - 2;
    this.tiles[this.exitY][this.exitX].type = TILE_TYPES.EXIT;
    
    // Add walls around the perimeter
    for (let x = 0; x < this.width; x++) {
      this.tiles[0][x].type = TILE_TYPES.WALL;
      this.tiles[this.height - 1][x].type = TILE_TYPES.WALL;
    }
    for (let y = 0; y < this.height; y++) {
      this.tiles[y][0].type = TILE_TYPES.WALL;
      this.tiles[y][this.width - 1].type = TILE_TYPES.WALL;
    }
    
    // Add internal obstacles and events based on level
    this.addLevelFeatures(level);
  }

  addLevelFeatures(level) {
    // Event distribution based on level difficulty
    const eventConfigs = [
      { walls: 2, events: 3, positive: 0.6, negative: 0.1 },  // Level 1
      { walls: 5, events: 6, positive: 0.4, negative: 0.4 },  // Level 2
      { walls: 8, events: 10, positive: 0.2, negative: 0.6 }, // Level 3
      { walls: 12, events: 12, positive: 0.1, negative: 0.8 } // Level 4
    ];
    
    const config = eventConfigs[level - 1] || eventConfigs[0];
    
    // Add walls
    let wallsAdded = 0;
    let attempts = 0;
    while (wallsAdded < config.walls && attempts < 100) {
      const x = Math.floor(Math.random() * (this.width - 2)) + 1;
      const y = Math.floor(Math.random() * (this.height - 2)) + 1;
      
      // Don't block start or exit
      if ((x === this.startX && y === this.startY) || 
          (x === this.exitX && y === this.exitY)) {
        attempts++;
        continue;
      }
      
      if (this.tiles[y][x].type === TILE_TYPES.EMPTY) {
        this.tiles[y][x].type = TILE_TYPES.WALL;
        wallsAdded++;
      }
      attempts++;
    }
    
    // Add events
    const eventTypes = [
      TILE_TYPES.EVENT_TREASURE,
      TILE_TYPES.EVENT_TRAP,
      TILE_TYPES.EVENT_ENEMY,
      TILE_TYPES.EVENT_NPC,
      TILE_TYPES.EVENT_MYSTERY
    ];
    
    let eventsAdded = 0;
    attempts = 0;
    while (eventsAdded < config.events && attempts < 200) {
      const x = Math.floor(Math.random() * (this.width - 2)) + 1;
      const y = Math.floor(Math.random() * (this.height - 2)) + 1;
      
      // Don't place on start or exit
      if ((x === this.startX && y === this.startY) || 
          (x === this.exitX && y === this.exitY)) {
        attempts++;
        continue;
      }
      
      if (this.tiles[y][x].type === TILE_TYPES.EMPTY) {
        // Weight event selection based on difficulty
        const rand = Math.random();
        let eventType;
        
        if (rand < config.positive) {
          eventType = Math.random() < 0.7 ? TILE_TYPES.EVENT_TREASURE : TILE_TYPES.EVENT_NPC;
        } else if (rand < config.positive + config.negative) {
          eventType = Math.random() < 0.6 ? TILE_TYPES.EVENT_TRAP : TILE_TYPES.EVENT_ENEMY;
        } else {
          eventType = TILE_TYPES.EVENT_MYSTERY;
        }
        
        this.tiles[y][x].type = eventType;
        eventsAdded++;
      }
      attempts++;
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