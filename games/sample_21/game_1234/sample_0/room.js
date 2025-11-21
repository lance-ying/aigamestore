// room.js - Room generation and management

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { Enemy } from './entities.js';

export function generateRoom(level, roomNumber) {
  const enemies = [];
  const roomsInLevel = gameState.roomsPerLevel[level - 1];
  const isLastRoom = roomNumber === roomsInLevel;
  const isMidBoss = (level === 3 && roomNumber === 7) || 
                     (level === 4 && (roomNumber === 6 || roomNumber === 9));
  
  if (isLastRoom && level === 5) {
    // Final boss
    enemies.push(createEnemy(CANVAS_WIDTH / 2, 100, 'boss', level));
  } else if (isLastRoom || isMidBoss) {
    // Mini-boss room
    enemies.push(createEnemy(CANVAS_WIDTH / 2, 100, 'miniboss', level));
    
    // Add some regular enemies
    const supportCount = Math.floor(2 + level * 0.5);
    for (let i = 0; i < supportCount; i++) {
      const x = 100 + (CANVAS_WIDTH - 200) * (i / supportCount);
      const y = 150 + Math.random() * 100;
      const type = Math.random() > 0.5 ? 'melee' : 'ranged';
      enemies.push(createEnemy(x, y, type, level));
    }
  } else {
    // Regular room
    const meleeCount = Math.min(2 + level, 6);
    const rangedCount = Math.min(1 + Math.floor(level / 2), 4);
    
    for (let i = 0; i < meleeCount; i++) {
      const x = 50 + Math.random() * (CANVAS_WIDTH - 100);
      const y = 50 + Math.random() * 150;
      enemies.push(createEnemy(x, y, 'melee', level));
    }
    
    for (let i = 0; i < rangedCount; i++) {
      const x = 50 + Math.random() * (CANVAS_WIDTH - 100);
      const y = 50 + Math.random() * 150;
      enemies.push(createEnemy(x, y, 'ranged', level));
    }
  }
  
  return enemies;
}

function createEnemy(x, y, type, level) {
  const enemy = new Enemy(x, y, type, level);
  gameState.enemies.push(enemy);
  gameState.entities.push(enemy);
  return enemy;
}

export function checkRoomCleared() {
  const aliveEnemies = gameState.enemies.filter(e => e.hp > 0);
  return aliveEnemies.length === 0;
}

export function clearRoom() {
  // Award room clear bonus
  const roomBonus = 50 + gameState.roomEnemiesKilled * 10;
  gameState.score += roomBonus;
  
  // Collect gold from defeated enemies
  for (const enemy of gameState.enemies) {
    if (enemy.hp === 0) {
      gameState.gold += enemy.gold;
      gameState.totalGold += enemy.gold;
    }
  }
  
  gameState.roomCleared = true;
  gameState.roomEnemiesKilled = 0;
}

export function advanceRoom(p) {
  const roomsInLevel = gameState.roomsPerLevel[gameState.currentLevel - 1];
  
  if (gameState.currentRoom < roomsInLevel) {
    // Next room in same level
    gameState.currentRoom++;
    loadRoom(p);
  } else {
    // Next level
    const levelBonus = 100 + roomsInLevel * 25;
    gameState.score += levelBonus;
    
    if (gameState.currentLevel < 5) {
      gameState.currentLevel++;
      gameState.currentRoom = 1;
      gameState.levelTransitionTimer = 180; // 3 seconds
      loadRoom(p);
    } else {
      // Victory!
      gameState.victoryTimer = 180;
      gameState.gamePhase = 'GAME_OVER_WIN';
      
      // Update high score
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
      }
    }
  }
}

export function loadRoom(p) {
  // Clear old entities
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.entities = [gameState.player];
  
  // Reset player position
  if (gameState.player) {
    gameState.player.x = CANVAS_WIDTH / 2;
    gameState.player.y = CANVAS_HEIGHT - 50;
    gameState.player.isMoving = false;
  }
  
  // Generate new enemies
  generateRoom(gameState.currentLevel, gameState.currentRoom);
  
  gameState.roomCleared = false;
}