// game_logic.js - Core game logic

import { 
  PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  ROOM_X, ROOM_Y, ROOM_WIDTH, ROOM_HEIGHT,
  gameState 
} from './globals.js';
import { Player, Tear, Bomb } from './entities.js';
import { generateRoom } from './room_generator.js';
import {
  checkTearEnemyCollisions,
  checkPlayerEnemyCollisions,
  checkPlayerItemCollisions,
  checkPlayerHeartCollisions,
  checkPlayerPortalCollision,
  checkProjectilePlayerCollisions
} from './collision.js';

export function initializeGame(p) {
  // Initialize player
  gameState.player = new Player(
    ROOM_X + ROOM_WIDTH / 2,
    ROOM_Y + ROOM_HEIGHT / 2
  );
  
  // Reset game stats
  gameState.score = 0;
  gameState.currentFloor = 1;
  gameState.roomsCleared = 0;
  gameState.totalEnemiesKilled = 0;
  gameState.itemsCollected = 0;
  gameState.damageTaken = 0;
  
  // Reset player stats
  gameState.playerMaxHealth = 6;
  gameState.playerHealth = 6;
  gameState.playerDamage = 1;
  gameState.playerSpeed = 2.5;
  gameState.playerFireRate = 15;
  gameState.playerBombCount = 3;
  
  // Reset collections
  gameState.entities = [gameState.player];
  gameState.tears = [];
  gameState.enemies = [];
  gameState.items = [];
  gameState.hearts = [];
  gameState.bombs = [];
  gameState.projectiles = [];
  
  // Generate first room
  generateNewRoom(p);
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, event: 'game_started' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function generateNewRoom(p) {
  const room = generateRoom(p, gameState.currentFloor);
  
  gameState.currentRoom = room;
  gameState.enemies = room.enemies;
  gameState.items = room.items;
  gameState.hearts = room.hearts;
  gameState.exitPortal = room.exitPortal;
  gameState.roomCleared = false;
  
  // Reset player position
  if (gameState.player) {
    gameState.player.x = ROOM_X + ROOM_WIDTH / 2;
    gameState.player.y = ROOM_Y + ROOM_HEIGHT / 2;
  }
}

export function updateGame(p, actions) {
  // Update player
  if (gameState.player) {
    updatePlayer(p, actions);
  }
  
  // Update tears
  for (let i = gameState.tears.length - 1; i >= 0; i--) {
    if (!gameState.tears[i].update()) {
      gameState.tears.splice(i, 1);
    }
  }
  
  // Update enemies
  gameState.enemies.forEach(enemy => {
    enemy.update(p, gameState.player);
  });
  
  // Update items
  gameState.items.forEach(item => {
    item.update(p);
  });
  
  // Update hearts
  gameState.hearts.forEach(heart => {
    heart.update(p);
  });
  
  // Update bombs
  for (let i = gameState.bombs.length - 1; i >= 0; i--) {
    const bomb = gameState.bombs[i];
    if (!bomb.update()) {
      bomb.explode(p);
      gameState.bombs.splice(i, 1);
    }
  }
  
  // Update enemy projectiles
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    if (!gameState.projectiles[i].update()) {
      gameState.projectiles.splice(i, 1);
    }
  }
  
  // Update portal
  if (gameState.exitPortal) {
    gameState.exitPortal.update(p);
  }
  
  // Check collisions
  checkTearEnemyCollisions(p);
  checkPlayerEnemyCollisions(p);
  checkPlayerItemCollisions(p);
  checkPlayerHeartCollisions(p);
  checkProjectilePlayerCollisions(p);
  
  // Check if room is cleared
  if (!gameState.roomCleared && gameState.enemies.length === 0) {
    gameState.roomCleared = true;
    gameState.roomsCleared++;
    if (gameState.exitPortal) {
      gameState.exitPortal.activate();
    }
  }
  
  // Check if player enters portal
  if (gameState.roomCleared && checkPlayerPortalCollision(p)) {
    nextFloor(p);
  }
  
  // Check win condition (survived 5 floors)
  if (gameState.currentFloor > 5) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_WIN, event: 'player_won' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Check lose condition
  if (gameState.playerHealth <= 0) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_LOSE, event: 'player_died' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Log player info periodically
  if (p.frameCount % 30 === 0) {
    logPlayerInfo(p);
  }
}

function updatePlayer(p, actions) {
  // Movement
  let dx = 0;
  let dy = 0;
  
  if (actions.moveLeft) dx -= gameState.playerSpeed;
  if (actions.moveRight) dx += gameState.playerSpeed;
  if (actions.moveUp) dy -= gameState.playerSpeed;
  if (actions.moveDown) dy += gameState.playerSpeed;
  
  // Normalize diagonal movement
  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }
  
  gameState.player.move(dx, dy);
  gameState.player.update(p);
  
  // Shooting
  if (actions.shoot) {
    shoot(p);
  }
  
  // Bomb
  if (actions.bomb && gameState.playerBombCount > 0) {
    dropBomb();
  }
}

function shoot(p) {
  const framesSinceLastShot = p.frameCount - gameState.lastShotFrame;
  
  if (framesSinceLastShot >= gameState.playerFireRate) {
    let vx = 0;
    let vy = 0;
    const speed = 6;
    
    switch (gameState.player.facingDirection) {
      case 'up':
        vy = -speed;
        break;
      case 'down':
        vy = speed;
        break;
      case 'left':
        vx = -speed;
        break;
      case 'right':
        vx = speed;
        break;
    }
    
    const tear = new Tear(
      gameState.player.x,
      gameState.player.y,
      vx, vy,
      gameState.playerDamage
    );
    
    gameState.tears.push(tear);
    gameState.lastShotFrame = p.frameCount;
  }
}

function dropBomb() {
  gameState.playerBombCount--;
  const bomb = new Bomb(gameState.player.x, gameState.player.y);
  gameState.bombs.push(bomb);
  gameState.lastBombFrame = gameState.frameCount || 0;
}

function nextFloor(p) {
  gameState.currentFloor++;
  gameState.score += 100;
  generateNewRoom(p);
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, event: 'floor_advanced', floor: gameState.currentFloor },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerInfo(p) {
  if (gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}