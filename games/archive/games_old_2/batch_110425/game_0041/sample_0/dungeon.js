// dungeon.js - Dungeon generation and navigation

export class DungeonTile {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // FLOOR, WALL, STAIRS, ENTRANCE
    this.visited = false;
  }
}

export class Dungeon {
  constructor(floor, width = 15, height = 10) {
    this.floor = floor;
    this.width = width;
    this.height = height;
    this.tiles = [];
    this.entranceX = 1;
    this.entranceY = 1;
    this.stairsX = width - 2;
    this.stairsY = height - 2;
    this.encounterRate = 0.15 + floor * 0.05; // Increases per floor
    this.stepsSinceEncounter = 0;
    
    this.generate();
  }
  
  generate() {
    // Initialize with walls
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        row.push(new DungeonTile(x, y, "WALL"));
      }
      this.tiles.push(row);
    }
    
    // Create rooms and corridors
    this.createRooms();
    
    // Set entrance and stairs
    this.tiles[this.entranceY][this.entranceX].type = "ENTRANCE";
    this.tiles[this.stairsY][this.stairsX].type = "STAIRS";
  }
  
  createRooms() {
    // Simple room generation
    const rooms = [
      { x: 1, y: 1, w: 4, h: 3 },
      { x: 6, y: 1, w: 5, h: 4 },
      { x: 1, y: 5, w: 5, h: 3 },
      { x: 7, y: 6, w: 6, h: 3 }
    ];
    
    rooms.forEach(room => {
      for (let y = room.y; y < room.y + room.h && y < this.height; y++) {
        for (let x = room.x; x < room.x + room.w && x < this.width; x++) {
          this.tiles[y][x].type = "FLOOR";
        }
      }
    });
    
    // Connect rooms with corridors
    for (let i = 0; i < rooms.length - 1; i++) {
      const r1 = rooms[i];
      const r2 = rooms[i + 1];
      const x1 = Math.floor(r1.x + r1.w / 2);
      const y1 = Math.floor(r1.y + r1.h / 2);
      const x2 = Math.floor(r2.x + r2.w / 2);
      const y2 = Math.floor(r2.y + r2.h / 2);
      
      // Horizontal corridor
      for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        if (x >= 0 && x < this.width && y1 >= 0 && y1 < this.height) {
          this.tiles[y1][x].type = "FLOOR";
        }
      }
      
      // Vertical corridor
      for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        if (x2 >= 0 && x2 < this.width && y >= 0 && y < this.height) {
          this.tiles[y][x2].type = "FLOOR";
        }
      }
    }
  }
  
  getTile(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.tiles[y][x];
  }
  
  isWalkable(x, y) {
    const tile = this.getTile(x, y);
    return tile && tile.type !== "WALL";
  }
  
  checkEncounter() {
    this.stepsSinceEncounter++;
    if (this.stepsSinceEncounter < 3) return false; // Minimum steps between encounters
    
    const chance = Math.random();
    if (chance < this.encounterRate) {
      this.stepsSinceEncounter = 0;
      return true;
    }
    return false;
  }
}