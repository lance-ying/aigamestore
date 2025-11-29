// world.js - World generation and tile management

import { gameState, WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE } from './globals.js';
import { Collectible, HealthPickup, EnergyPickup, HealingCrystal } from './collectibles.js';
import { Enemy } from './enemy.js';
import { Hazard } from './hazards.js';

export class Tile {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type; // 'ground', 'wall', 'void'
  }
}

export function generateWorld(p) {
  const tiles = [];
  const tilesX = Math.floor(WORLD_WIDTH / TILE_SIZE);
  const tilesY = Math.floor(WORLD_HEIGHT / TILE_SIZE);
  
  // Initialize all tiles as ground
  for (let y = 0; y < tilesY; y++) {
    tiles[y] = [];
    for (let x = 0; x < tilesX; x++) {
      tiles[y][x] = new Tile(x * TILE_SIZE, y * TILE_SIZE, 'ground');
    }
  }
  
  // Create rooms and corridors
  const rooms = [];
  const numRooms = 12;
  
  for (let i = 0; i < numRooms; i++) {
    const roomWidth = Math.floor(p.random(8, 15));
    const roomHeight = Math.floor(p.random(6, 12));
    const roomX = Math.floor(p.random(2, tilesX - roomWidth - 2));
    const roomY = Math.floor(p.random(2, tilesY - roomHeight - 2));
    
    // Check for overlap with existing rooms
    let overlaps = false;
    for (const room of rooms) {
      if (
        roomX < room.x + room.width + 2 &&
        roomX + roomWidth + 2 > room.x &&
        roomY < room.y + room.height + 2 &&
        roomY + roomHeight + 2 > room.y
      ) {
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      rooms.push({ x: roomX, y: roomY, width: roomWidth, height: roomHeight });
    }
  }
  
  // Carve out rooms and add walls
  for (const room of rooms) {
    for (let y = room.y - 1; y <= room.y + room.height; y++) {
      for (let x = room.x - 1; x <= room.x + room.width; x++) {
        if (y >= 0 && y < tilesY && x >= 0 && x < tilesX) {
          // Add walls around room perimeter
          if (
            x === room.x - 1 ||
            x === room.x + room.width ||
            y === room.y - 1 ||
            y === room.y + room.height
          ) {
            tiles[y][x].type = 'wall';
          } else {
            tiles[y][x].type = 'ground';
          }
        }
      }
    }
  }
  
  // Connect rooms with corridors
  for (let i = 0; i < rooms.length - 1; i++) {
    const room1 = rooms[i];
    const room2 = rooms[i + 1];
    
    const centerX1 = Math.floor(room1.x + room1.width / 2);
    const centerY1 = Math.floor(room1.y + room1.height / 2);
    const centerX2 = Math.floor(room2.x + room2.width / 2);
    const centerY2 = Math.floor(room2.y + room2.height / 2);
    
    // Horizontal corridor
    const startX = Math.min(centerX1, centerX2);
    const endX = Math.max(centerX1, centerX2);
    for (let x = startX; x <= endX; x++) {
      if (centerY1 >= 0 && centerY1 < tilesY && x >= 0 && x < tilesX) {
        tiles[centerY1][x].type = 'ground';
        if (centerY1 > 0) tiles[centerY1 - 1][x].type = 'wall';
        if (centerY1 < tilesY - 1) tiles[centerY1 + 1][x].type = 'wall';
      }
    }
    
    // Vertical corridor
    const startY = Math.min(centerY1, centerY2);
    const endY = Math.max(centerY1, centerY2);
    for (let y = startY; y <= endY; y++) {
      if (y >= 0 && y < tilesY && centerX2 >= 0 && centerX2 < tilesX) {
        tiles[y][centerX2].type = 'ground';
        if (centerX2 > 0) tiles[y][centerX2 - 1].type = 'wall';
        if (centerX2 < tilesX - 1) tiles[y][centerX2 + 1].type = 'wall';
      }
    }
  }
  
  gameState.worldTiles = tiles;
  gameState.worldRooms = rooms;
  
  // Populate world with entities
  populateWorld(p, rooms);
}

function populateWorld(p, rooms) {
  // Place player in first room
  const startRoom = rooms[0];
  const playerX = (startRoom.x + startRoom.width / 2) * TILE_SIZE;
  const playerY = (startRoom.y + startRoom.height / 2) * TILE_SIZE;
  
  // Create entities in other rooms
  for (let i = 1; i < rooms.length; i++) {
    const room = rooms[i];
    const centerX = (room.x + room.width / 2) * TILE_SIZE;
    const centerY = (room.y + room.height / 2) * TILE_SIZE;
    
    // Determine room type
    const roomType = p.random();
    
    if (roomType < 0.3) {
      // Enemy room
      const numEnemies = Math.floor(p.random(2, 5));
      for (let j = 0; j < numEnemies; j++) {
        const ex = (room.x + p.random(1, room.width - 1)) * TILE_SIZE;
        const ey = (room.y + p.random(1, room.height - 1)) * TILE_SIZE;
        new Enemy(ex, ey, p);
      }
    } else if (roomType < 0.5) {
      // Treasure room
      const numItems = Math.floor(p.random(3, 6));
      for (let j = 0; j < numItems; j++) {
        const cx = (room.x + p.random(1, room.width - 1)) * TILE_SIZE;
        const cy = (room.y + p.random(1, room.height - 1)) * TILE_SIZE;
        const itemType = p.random();
        if (itemType < 0.3) {
          new HealthPickup(cx, cy);
        } else if (itemType < 0.6) {
          new EnergyPickup(cx, cy);
        } else {
          new Collectible(cx, cy, 'artifact');
        }
      }
    } else if (roomType < 0.7) {
      // Hazard room
      const numHazards = Math.floor(p.random(4, 8));
      for (let j = 0; j < numHazards; j++) {
        const hx = (room.x + p.random(1, room.width - 1)) * TILE_SIZE;
        const hy = (room.y + p.random(1, room.height - 1)) * TILE_SIZE;
        const hazardType = p.random() < 0.5 ? 'spike' : 'poison';
        new Hazard(hx, hy, hazardType);
      }
      
      // Add a few enemies too
      const numEnemies = Math.floor(p.random(1, 3));
      for (let j = 0; j < numEnemies; j++) {
        const ex = (room.x + p.random(1, room.width - 1)) * TILE_SIZE;
        const ey = (room.y + p.random(1, room.height - 1)) * TILE_SIZE;
        new Enemy(ex, ey, p);
      }
    } else {
      // Mixed room
      new Enemy(centerX, centerY, p);
      const numItems = Math.floor(p.random(1, 3));
      for (let j = 0; j < numItems; j++) {
        const cx = (room.x + p.random(1, room.width - 1)) * TILE_SIZE;
        const cy = (room.y + p.random(1, room.height - 1)) * TILE_SIZE;
        if (p.random() < 0.5) {
          new HealthPickup(cx, cy);
        } else {
          new EnergyPickup(cx, cy);
        }
      }
    }
  }
  
  // Place healing crystals in specific rooms
  const crystalRooms = [
    rooms[Math.floor(rooms.length * 0.3)],
    rooms[Math.floor(rooms.length * 0.5)],
    rooms[Math.floor(rooms.length * 0.7)],
    rooms[Math.floor(rooms.length * 0.85)],
    rooms[rooms.length - 1]
  ];
  
  for (const room of crystalRooms) {
    const cx = (room.x + room.width / 2) * TILE_SIZE;
    const cy = (room.y + room.height / 2) * TILE_SIZE;
    new HealingCrystal(cx, cy);
  }
  
  return { playerX, playerY };
}

export function getTileAt(worldX, worldY) {
  const tileX = Math.floor(worldX / TILE_SIZE);
  const tileY = Math.floor(worldY / TILE_SIZE);
  
  if (
    tileY >= 0 &&
    tileY < gameState.worldTiles.length &&
    tileX >= 0 &&
    tileX < gameState.worldTiles[0].length
  ) {
    return gameState.worldTiles[tileY][tileX];
  }
  
  return null;
}

export function isWalkable(worldX, worldY) {
  const tile = getTileAt(worldX, worldY);
  return tile && tile.type === 'ground';
}