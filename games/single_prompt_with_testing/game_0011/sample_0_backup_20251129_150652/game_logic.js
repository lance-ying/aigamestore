// game_logic.js - Core game logic

import { gameState, GAME_PHASES, STARTING_LIVES, TILE_SIZE } from './globals.js';
import { LEVELS, getLevelData, isStrawberryTile } from './levels.js';
import { Player } from './player.js';

export function initGame(p) {
  gameState.currentLevel = 0;
  gameState.score = 0;
  gameState.lives = STARTING_LIVES;
  gameState.collectedStrawberries = new Set();
  loadLevel(p, 0);
  
  p.logs.game_info.push({
    data: { event: "game_initialized", level: 0 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function loadLevel(p, levelIndex) {
  const level = getLevelData(levelIndex);
  if (!level) {
    return false;
  }
  
  gameState.currentLevel = levelIndex;
  
  // Create player at start position
  const startX = level.startX * TILE_SIZE + TILE_SIZE / 2;
  const startY = level.startY * TILE_SIZE + TILE_SIZE / 2;
  gameState.player = new Player(startX, startY);
  
  // Store level start position
  gameState.levelStartPosition = { x: startX, y: startY };
  
  // Clear and rebuild entities array
  gameState.entities = [gameState.player];
  
  p.logs.game_info.push({
    data: { event: "level_loaded", level: levelIndex, levelName: level.name },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  return true;
}

export function respawnPlayer(p) {
  if (gameState.player) {
    gameState.player.x = gameState.levelStartPosition.x;
    gameState.player.y = gameState.levelStartPosition.y;
    gameState.player.vx = 0;
    gameState.player.vy = 0;
    gameState.player.dead = false;
    gameState.player.onGround = false;
    gameState.player.hasDoubleJump = true;
    gameState.player.dashesRemaining = 1;
    gameState.player.isDashing = false;
    gameState.player.isClimbing = false;
    gameState.player.onWall = 0;
    
    p.logs.game_info.push({
      data: { event: "player_respawned", lives: gameState.lives },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function checkStrawberryCollection(p, level) {
  if (!gameState.player || !level) return;
  
  const col = Math.floor(gameState.player.x / TILE_SIZE);
  const row = Math.floor(gameState.player.y / TILE_SIZE);
  
  // Check surrounding tiles
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < level.tiles.length && c >= 0 && c < level.tiles[0].length) {
        const tile = level.tiles[r][c];
        const key = `${gameState.currentLevel}-${r}-${c}`;
        
        if (isStrawberryTile(tile) && !gameState.collectedStrawberries.has(key)) {
          const tileX = c * TILE_SIZE + TILE_SIZE / 2;
          const tileY = r * TILE_SIZE + TILE_SIZE / 2;
          const dist = p.dist(gameState.player.x, gameState.player.y, tileX, tileY);
          
          if (dist < 15) {
            gameState.collectedStrawberries.add(key);
            gameState.score += 100;
            
            p.logs.game_info.push({
              data: { event: "strawberry_collected", score: gameState.score },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          }
        }
      }
    }
  }
}

export function updateGame(p, inputs) {
  const level = getLevelData(gameState.currentLevel);
  if (!level || !gameState.player) return;
  
  // Update player
  gameState.player.update(p, level, inputs);
  
  // Check strawberry collection
  checkStrawberryCollection(p, level);
  
  // Log player position periodically
  if (p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
  
  // Check death
  if (gameState.player.dead) {
    gameState.lives--;
    
    p.logs.game_info.push({
      data: { event: "player_died", lives: gameState.lives },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.lives <= 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      
      p.logs.game_info.push({
        data: { event: "game_over", result: "lose", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else {
      respawnPlayer(p);
    }
  }
  
  // Check goal reached
  if (gameState.player.reachedGoal) {
    gameState.score += 500; // Level completion bonus
    
    p.logs.game_info.push({
      data: { event: "level_completed", level: gameState.currentLevel, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Advance to next level
    if (gameState.currentLevel < LEVELS.length - 1) {
      loadLevel(p, gameState.currentLevel + 1);
    } else {
      // Won the game!
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      
      p.logs.game_info.push({
        data: { event: "game_over", result: "win", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}