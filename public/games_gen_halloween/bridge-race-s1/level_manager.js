// level_manager.js - Level generation and management

import { gameState, PLAYER_COLORS } from './globals.js';
import { Block, Bridge, Platform } from './entities.js';

export function generateLevel(p, levelNumber) {
  gameState.blocks = [];
  gameState.bridges = [];
  gameState.platforms = [];
  
  const colors = [
    PLAYER_COLORS.BLUE,
    PLAYER_COLORS.RED,
    PLAYER_COLORS.GREEN,
    PLAYER_COLORS.YELLOW
  ];
  
  // Starting platform
  gameState.platforms.push(new Platform(p, 100, 200, 150, 80, 0));
  
  // Level layouts based on difficulty
  if (levelNumber === 1) {
    // Simple straight path with one bridge
    
    // First bridge
    gameState.bridges.push(new Bridge(p, 230, 200, 60, 80, 3));
    
    // Blocks before first bridge
    for (let i = 0; i < 4; i++) {
      gameState.blocks.push(new Block(p, 120 + i * 25, 170, colors[i]));
      gameState.blocks.push(new Block(p, 120 + i * 25, 230, colors[i]));
    }
    
    // Middle platform
    gameState.platforms.push(new Platform(p, 330, 200, 100, 80, 0));
    
    // Second bridge
    gameState.bridges.push(new Bridge(p, 420, 200, 60, 80, 4));
    
    // Blocks before second bridge
    for (let i = 0; i < 4; i++) {
      gameState.blocks.push(new Block(p, 310 + i * 20, 180, colors[i]));
      gameState.blocks.push(new Block(p, 310 + i * 20, 220, colors[i]));
    }
    
    // Finish platform
    gameState.platforms.push(new Platform(p, 520, 200, 120, 100, 0, true));
    
  } else if (levelNumber === 2) {
    // Path with elevation changes
    
    // Bridge 1
    gameState.bridges.push(new Bridge(p, 200, 200, 50, 80, 3));
    
    // Blocks scattered
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 4; j++) {
        const blockColor = colors[j];
        gameState.blocks.push(new Block(
          p,
          110 + p.random(-20, 20),
          180 + i * 15,
          blockColor
        ));
      }
    }
    
    // Elevated platform
    gameState.platforms.push(new Platform(p, 280, 200, 80, 80, 1));
    
    // Bridge 2
    gameState.bridges.push(new Bridge(p, 350, 200, 50, 80, 4));
    
    // More blocks
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const blockColor = colors[j];
        gameState.blocks.push(new Block(
          p,
          270 + p.random(-15, 15),
          180 + i * 15,
          blockColor
        ));
      }
    }
    
    // Bridge 3
    gameState.bridges.push(new Bridge(p, 440, 200, 50, 80, 5));
    
    // Final blocks
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        const blockColor = colors[j];
        gameState.blocks.push(new Block(
          p,
          390 + p.random(-10, 10),
          190 + i * 20,
          blockColor
        ));
      }
    }
    
    // Finish
    gameState.platforms.push(new Platform(p, 520, 200, 100, 100, 1, true));
  }
}

export function checkLevelComplete() {
  // Check if player reached finish
  const finish = gameState.platforms.find(p => p.isFinish);
  if (finish && gameState.player) {
    const dist = Math.sqrt(
      (gameState.player.x - finish.x) ** 2 +
      (gameState.player.y - finish.y) ** 2
    );
    
    if (dist < 40 && !gameState.player.hasFinished) {
      gameState.player.hasFinished = true;
      gameState.player.finishTime = Date.now() - gameState.startTime;
      return true;
    }
  }
  
  return false;
}

export function calculateRank() {
  const allRacers = [gameState.player, ...gameState.aiOpponents];
  const finishers = allRacers.filter(r => r.hasFinished)
    .sort((a, b) => a.finishTime - b.finishTime);
  
  const playerIndex = finishers.indexOf(gameState.player);
  gameState.playerRank = playerIndex >= 0 ? playerIndex + 1 : allRacers.length;
}