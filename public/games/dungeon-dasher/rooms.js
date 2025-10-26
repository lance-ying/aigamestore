// rooms.js - Room generation and management

import { GRID_COLS, GRID_ROWS, ENTITY_TYPES, gameState } from './globals.js';
import { MeleeEnemy, RangedEnemy, TankEnemy, BossEnemy } from './entities.js';

export function generateRoom(level, roomNumber) {
  const walls = [];
  const enemies = [];

  // Add border walls
  for (let x = 0; x < GRID_COLS; x++) {
    walls.push({ x, y: 0 });
    walls.push({ x, y: GRID_ROWS - 1 });
  }
  for (let y = 1; y < GRID_ROWS - 1; y++) {
    walls.push({ x: 0, y });
    walls.push({ x: GRID_COLS - 1, y });
  }

  // Add some interior obstacles
  const obstacleCount = Math.min(level * 2, 8);
  for (let i = 0; i < obstacleCount; i++) {
    const x = Math.floor(Math.random() * (GRID_COLS - 4)) + 2;
    const y = Math.floor(Math.random() * (GRID_ROWS - 4)) + 2;
    if (!walls.some(w => w.x === x && w.y === y)) {
      walls.push({ x, y });
    }
  }

  // Spawn enemies based on level
  const isBossRoom = level === 5 && roomNumber === gameState.roomsPerLevel[level - 1];
  
  if (isBossRoom) {
    // Boss room
    const boss = new BossEnemy(Math.floor(GRID_COLS / 2), Math.floor(GRID_ROWS / 2));
    enemies.push(boss);
    
    // Add some regular enemies
    for (let i = 0; i < 3; i++) {
      const ex = Math.floor(Math.random() * (GRID_COLS - 4)) + 2;
      const ey = Math.floor(Math.random() * (GRID_ROWS - 4)) + 2;
      if (!isPositionBlocked(ex, ey, walls, enemies)) {
        enemies.push(new MeleeEnemy(ex, ey));
      }
    }
  } else {
    // Regular rooms
    const enemyCount = Math.min(2 + level + roomNumber, 8);
    for (let i = 0; i < enemyCount; i++) {
      const ex = Math.floor(Math.random() * (GRID_COLS - 4)) + 2;
      const ey = Math.floor(Math.random() * (GRID_ROWS - 4)) + 2;
      
      if (!isPositionBlocked(ex, ey, walls, enemies)) {
        let enemy;
        const rand = Math.random();
        
        if (level >= 4 && rand < 0.3) {
          enemy = new TankEnemy(ex, ey);
          enemy.hp *= (1 + level * 0.2);
          enemy.maxHp = enemy.hp;
          enemy.atk *= (1 + level * 0.2);
        } else if (level >= 2 && rand < 0.6) {
          enemy = new RangedEnemy(ex, ey);
          enemy.hp *= (1 + level * 0.15);
          enemy.maxHp = enemy.hp;
          enemy.atk *= (1 + level * 0.15);
        } else {
          enemy = new MeleeEnemy(ex, ey);
          enemy.hp *= (1 + level * 0.2);
          enemy.maxHp = enemy.hp;
          enemy.atk *= (1 + level * 0.2);
        }
        
        enemies.push(enemy);
      }
    }
  }

  return { walls, enemies };
}

function isPositionBlocked(x, y, walls, enemies) {
  // Check if too close to player spawn
  if (Math.abs(x - 2) < 2 && Math.abs(y - 2) < 2) return true;
  
  // Check walls
  if (walls.some(w => w.x === x && w.y === y)) return true;
  
  // Check enemies
  if (enemies.some(e => e.gridX === x && e.gridY === y)) return true;
  
  return false;
}

export function loadRoom(level, roomNumber) {
  const room = generateRoom(level, roomNumber);
  gameState.walls = room.walls;
  gameState.enemies = room.enemies;
  gameState.entities = [gameState.player, ...room.enemies];
  gameState.projectiles = [];
  gameState.roomCleared = false;
}