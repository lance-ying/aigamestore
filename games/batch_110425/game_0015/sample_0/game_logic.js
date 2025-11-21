// game_logic.js - Core game logic and updates

import {
  PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  CANVAS_WIDTH, CANVAS_HEIGHT,
  gameState
} from './globals.js';
import { spawnEnemies } from './enemy.js';
import { dropItem, collectItem } from './items.js';
import { checkCircleCollision } from './utils.js';

export function updateGame(p) {
  const player = gameState.player;
  if (!player) return;
  
  // Update cooldowns
  if (gameState.attackCooldown > 0) gameState.attackCooldown--;
  if (gameState.fireballCooldown > 0) gameState.fireballCooldown--;
  if (gameState.healCooldown > 0) gameState.healCooldown--;
  
  // Update transition timer
  if (gameState.transitionTimer > 0) {
    gameState.transitionTimer--;
    return;
  }
  
  // Update enemies
  gameState.enemies.forEach(enemy => {
    if (enemy.isAlive) {
      enemy.update(player);
    }
  });
  
  // Update projectiles
  gameState.projectiles.forEach(proj => {
    if (proj.active) {
      proj.update();
      
      // Check projectile-enemy collisions
      gameState.enemies.forEach(enemy => {
        if (!enemy.isAlive || !proj.active) return;
        
        if (checkCircleCollision(proj.x, proj.y, proj.size, 
                                 enemy.x, enemy.y, enemy.size / 2)) {
          enemy.takeDamage(proj.damage);
          proj.active = false;
          
          // Drop item on death
          if (!enemy.isAlive) {
            dropItem(enemy.x, enemy.y);
          }
        }
      });
    }
  });
  
  // Clean up inactive projectiles
  gameState.projectiles = gameState.projectiles.filter(p => p.active);
  
  // Check item collection
  gameState.items.forEach(item => {
    if (item.collected) return;
    
    if (checkCircleCollision(player.x, player.y, player.size / 2,
                             item.x, item.y, item.size / 2)) {
      collectItem(player, item);
    }
  });
  
  // Clean up collected items
  gameState.items = gameState.items.filter(i => !i.collected);
  
  // Check if room is cleared
  const aliveEnemies = gameState.enemies.filter(e => e.isAlive).length;
  if (aliveEnemies === 0 && !gameState.roomCleared) {
    gameState.roomCleared = true;
    gameState.roomsCleared++;
    
    // Move to next room or win
    if (gameState.currentRoom < gameState.totalRooms - 1) {
      setTimeout(() => {
        nextRoom(p);
      }, 1000);
    } else if (!gameState.bossDefeated) {
      // Check if boss was defeated
      const boss = gameState.enemies.find(e => e.type === 'boss');
      if (boss && !boss.isAlive) {
        gameState.bossDefeated = true;
        gameState.gamePhase = PHASE_GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { phase: PHASE_GAME_OVER_WIN, reason: 'boss_defeated' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  // Check game over condition
  if (!player.isAlive() && gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_LOSE, reason: 'player_died' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Log player info periodically
  if (p.frameCount % 60 === 0) {
    p.logs.player_info.push({
      screen_x: player.x,
      screen_y: player.y,
      game_x: player.x,
      game_y: player.y,
      framecount: p.frameCount
    });
  }
}

function nextRoom(p) {
  gameState.currentRoom++;
  gameState.roomCleared = false;
  gameState.transitionTimer = 60;
  
  // Reset player position
  gameState.player.x = CANVAS_WIDTH / 2;
  gameState.player.y = CANVAS_HEIGHT / 2;
  
  // Clear entities
  gameState.projectiles = [];
  gameState.items = [];
  
  // Spawn new enemies
  const isBossRoom = gameState.currentRoom === gameState.totalRooms - 1;
  gameState.enemies = spawnEnemies(gameState.currentRoom, isBossRoom);
}