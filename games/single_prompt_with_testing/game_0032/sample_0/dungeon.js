// dungeon.js - Dungeon generation

import { DUNGEON_WIDTH, DUNGEON_HEIGHT } from './globals.js';

export class Room {
  constructor(x, y, type = 'normal') {
    this.x = x;
    this.y = y;
    this.type = type; // 'normal', 'boss', 'treasure', 'start'
    this.cleared = false;
    this.visited = false;
    this.doors = { top: false, right: false, bottom: false, left: false };
    this.enemies = [];
    this.items = [];
    this.pickups = [];
  }
}

export class Dungeon {
  constructor(floor, p) {
    this.floor = floor;
    this.rooms = [];
    this.generate(p);
  }

  generate(p) {
    // Initialize grid
    for (let y = 0; y < DUNGEON_HEIGHT; y++) {
      this.rooms[y] = [];
      for (let x = 0; x < DUNGEON_WIDTH; x++) {
        this.rooms[y][x] = null;
      }
    }

    // Start room in center
    const startX = 2;
    const startY = 2;
    this.rooms[startY][startX] = new Room(startX, startY, 'start');

    // Generate paths using random walk
    let roomsToGenerate = 8 + this.floor * 2;
    let branches = [{ x: startX, y: startY }];

    while (roomsToGenerate > 0 && branches.length > 0) {
      const branchIdx = Math.floor(p.random(branches.length));
      const current = branches[branchIdx];

      // Try to add adjacent room
      const directions = [
        { dx: 0, dy: -1 }, // up
        { dx: 1, dy: 0 },  // right
        { dx: 0, dy: 1 },  // down
        { dx: -1, dy: 0 }  // left
      ];

      p.shuffle(directions, true);

      let added = false;
      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        if (nx >= 0 && nx < DUNGEON_WIDTH && ny >= 0 && ny < DUNGEON_HEIGHT && !this.rooms[ny][nx]) {
          this.rooms[ny][nx] = new Room(nx, ny, 'normal');
          branches.push({ x: nx, y: ny });
          roomsToGenerate--;
          added = true;
          break;
        }
      }

      if (!added) {
        branches.splice(branchIdx, 1);
      }
    }

    // Add boss room at furthest point from start
    let maxDist = 0;
    let bossPos = { x: startX, y: startY };
    for (let y = 0; y < DUNGEON_HEIGHT; y++) {
      for (let x = 0; x < DUNGEON_WIDTH; x++) {
        if (this.rooms[y][x] && this.rooms[y][x].type === 'normal') {
          const dist = Math.abs(x - startX) + Math.abs(y - startY);
          if (dist > maxDist) {
            maxDist = dist;
            bossPos = { x, y };
          }
        }
      }
    }
    if (this.rooms[bossPos.y][bossPos.x]) {
      this.rooms[bossPos.y][bossPos.x].type = 'boss';
    }

    // Add treasure room
    for (let y = 0; y < DUNGEON_HEIGHT; y++) {
      for (let x = 0; x < DUNGEON_WIDTH; x++) {
        if (this.rooms[y][x] && this.rooms[y][x].type === 'normal' && p.random() < 0.15) {
          this.rooms[y][x].type = 'treasure';
          break;
        }
      }
    }

    // Connect rooms with doors
    for (let y = 0; y < DUNGEON_HEIGHT; y++) {
      for (let x = 0; x < DUNGEON_WIDTH; x++) {
        if (this.rooms[y][x]) {
          if (y > 0 && this.rooms[y - 1][x]) {
            this.rooms[y][x].doors.top = true;
          }
          if (x < DUNGEON_WIDTH - 1 && this.rooms[y][x + 1]) {
            this.rooms[y][x].doors.right = true;
          }
          if (y < DUNGEON_HEIGHT - 1 && this.rooms[y + 1][x]) {
            this.rooms[y][x].doors.bottom = true;
          }
          if (x > 0 && this.rooms[y][x - 1]) {
            this.rooms[y][x].doors.left = true;
          }
        }
      }
    }
  }

  getRoom(x, y) {
    if (x < 0 || x >= DUNGEON_WIDTH || y < 0 || y >= DUNGEON_HEIGHT) {
      return null;
    }
    return this.rooms[y][x];
  }
}