// levelManager.js - Level progression and configuration

import { gameState } from './globals.js';

export function getLevelConfig(level) {
  // Progressive difficulty
  let lanes = 2;
  let trafficSpeed = 3;
  let trafficDensity = 0.015;
  
  if (level >= 3) lanes = 3;
  if (level >= 5) lanes = 4;
  if (level >= 8) lanes = 5;
  
  trafficSpeed = 3 + (level - 1) * 0.3;
  trafficSpeed = Math.min(trafficSpeed, 8); // Cap at 8
  
  trafficDensity = 0.015 + (level - 1) * 0.003;
  trafficDensity = Math.min(trafficDensity, 0.04); // Cap density
  
  return {
    lanes,
    trafficSpeed,
    trafficDensity,
    laneWidth: 40
  };
}

export function setupLevel(level) {
  const config = getLevelConfig(level);
  gameState.levelConfig = config;
  
  // Calculate intersection bounds
  const totalLaneHeight = config.lanes * config.laneWidth;
  const intersectionY = 200; // Center of screen
  
  gameState.intersectionBounds = {
    start: intersectionY - totalLaneHeight / 2,
    end: intersectionY + totalLaneHeight / 2
  };
  
  console.log(`Level ${level} configured:`, config);
}

export function completeLevel(p) {
  // Award coins
  const coinsEarned = 10;
  gameState.coins += coinsEarned;
  gameState.score += coinsEarned;
  gameState.level++;
  
  p.logs.game_info.push({
    data: { 
      event: 'level_complete',
      level: gameState.level - 1,
      coinsEarned,
      totalCoins: gameState.coins
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  console.log(`Level ${gameState.level - 1} complete! Coins: ${gameState.coins}`);
  
  // Setup next level
  setupLevel(gameState.level);
  
  // Reset player position
  if (gameState.player) {
    const Matter = window.Matter;
    const { Body } = Matter;
    Body.setPosition(gameState.player.body, { 
      x: 300, 
      y: gameState.intersectionBounds.end + 80 
    });
    Body.setVelocity(gameState.player.body, { x: 0, y: 0 });
  }
}