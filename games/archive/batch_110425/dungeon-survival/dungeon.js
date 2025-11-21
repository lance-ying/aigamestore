// dungeon.js - Dungeon generation and management

import { TILE_SIZE, DUNGEON_WIDTH, DUNGEON_HEIGHT } from './globals.js';
import { Enemy, Item } from './entities.js';

export class Dungeon {
  constructor(level, p) {
    this.level = level;
    this.width = DUNGEON_WIDTH;
    this.height = DUNGEON_HEIGHT;
    this.tiles = [];
    this.enemies = [];
    this.items = [];
    this.p = p;
    this.generate();
  }

  generate() {
    // Initialize tiles as walls
    for (let y = 0; y < this.height; y++) {
      this.tiles[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.tiles[y][x] = { type: "wall", explored: false };
      }
    }

    // Create rooms
    const rooms = [];
    const numRooms = 4 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < numRooms; i++) {
      const w = 3 + Math.floor(Math.random() * 4);
      const h = 3 + Math.floor(Math.random() * 4);
      const x = 1 + Math.floor(Math.random() * (this.width - w - 2));
      const y = 1 + Math.floor(Math.random() * (this.height - h - 2));
      
      rooms.push({ x, y, w, h });
      
      // Carve room
      for (let ry = y; ry < y + h; ry++) {
        for (let rx = x; rx < x + w; rx++) {
          this.tiles[ry][rx] = { type: "floor", explored: false };
        }
      }
    }

    // Connect rooms with corridors
    for (let i = 0; i < rooms.length - 1; i++) {
      const room1 = rooms[i];
      const room2 = rooms[i + 1];
      const x1 = Math.floor(room1.x + room1.w / 2);
      const y1 = Math.floor(room1.y + room1.h / 2);
      const x2 = Math.floor(room2.x + room2.w / 2);
      const y2 = Math.floor(room2.y + room2.h / 2);
      
      // Horizontal corridor
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        if (this.tiles[y1] && this.tiles[y1][x]) {
          this.tiles[y1][x] = { type: "floor", explored: false };
        }
      }
      
      // Vertical corridor
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        if (this.tiles[y] && this.tiles[y][x2]) {
          this.tiles[y][x2] = { type: "floor", explored: false };
        }
      }
    }

    // Place starting position
    const startRoom = rooms[0];
    this.startX = Math.floor(startRoom.x + startRoom.w / 2);
    this.startY = Math.floor(startRoom.y + startRoom.h / 2);
    this.tiles[this.startY][this.startX].type = "start";

    // Place stairs
    const endRoom = rooms[rooms.length - 1];
    this.stairsX = Math.floor(endRoom.x + endRoom.w / 2);
    this.stairsY = Math.floor(endRoom.y + endRoom.h / 2);
    this.tiles[this.stairsY][this.stairsX].type = "stairs";

    // Place enemies
    const numEnemies = 5 + this.level * 2;
    for (let i = 0; i < numEnemies; i++) {
      const room = rooms[1 + Math.floor(Math.random() * (rooms.length - 1))];
      const x = room.x + Math.floor(Math.random() * room.w);
      const y = room.y + Math.floor(Math.random() * room.h);
      
      if (this.tiles[y][x].type === "floor" && !this.getEnemyAt(x, y)) {
        const isBoss = (this.level === 5 && i === 0);
        this.enemies.push(new Enemy(this.level, x, y, isBoss));
      }
    }

    // Place chests
    const numChests = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numChests; i++) {
      const room = rooms[Math.floor(Math.random() * rooms.length)];
      const x = room.x + Math.floor(Math.random() * room.w);
      const y = room.y + Math.floor(Math.random() * room.h);
      
      if (this.tiles[y][x].type === "floor") {
        this.tiles[y][x].type = "chest";
        this.tiles[y][x].opened = false;
      }
    }
  }

  getTile(x, y) {
    if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
      return this.tiles[y][x];
    }
    return null;
  }

  isWalkable(x, y) {
    const tile = this.getTile(x, y);
    return tile && tile.type !== "wall";
  }

  getEnemyAt(x, y) {
    return this.enemies.find(e => e.x === x && e.y === y && e.alive);
  }

  removeEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
    }
  }

  revealArea(centerX, centerY, radius) {
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      for (let x = centerX - radius; x <= centerX + radius; x++) {
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (dist <= radius) {
          const tile = this.getTile(x, y);
          if (tile) {
            tile.explored = true;
          }
        }
      }
    }
  }
}