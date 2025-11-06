// level_generator.js - Level generation

import { gameState, GROUND_Y, PLATFORM_HEIGHT, MIN_PLATFORM_WIDTH, MAX_PLATFORM_WIDTH, MIN_GAP, MAX_GAP, COLOR_PINK, COLOR_YELLOW } from './globals.js';
import { Platform } from './platform.js';
import { Obstacle } from './obstacle.js';
import { Token } from './token.js';

export function generateLevel(p) {
  gameState.platforms = [];
  gameState.obstacles = [];
  gameState.tokens = [];
  
  let currentX = 100;
  let platformCount = 0;
  const maxPlatforms = 25;
  
  // Starting platform
  const startPlatform = new Platform(p, 0, GROUND_Y, 150, COLOR_PINK);
  gameState.platforms.push(startPlatform);
  currentX = 150;
  
  while (platformCount < maxPlatforms && currentX < gameState.levelLength) {
    // Random gap
    const gap = p.random(MIN_GAP, MAX_GAP);
    currentX += gap;
    
    // Random platform width
    const width = p.random(MIN_PLATFORM_WIDTH, MAX_PLATFORM_WIDTH);
    
    // Random height variation
    const heightVariation = p.random(-80, 0);
    const y = GROUND_Y + heightVariation;
    
    // Alternate colors or random
    const color = p.random() > 0.5 ? COLOR_PINK : COLOR_YELLOW;
    
    const platform = new Platform(p, currentX, y, width, color);
    gameState.platforms.push(platform);
    
    // Add obstacle on some platforms
    if (p.random() > 0.7 && platformCount > 2) {
      const obstacleX = currentX + p.random(20, width - 40);
      const obstacleHeight = p.random(30, 50);
      const obstacle = new Obstacle(p, obstacleX, y - obstacleHeight, 20, obstacleHeight);
      gameState.obstacles.push(obstacle);
    }
    
    // Add token above some platforms
    if (p.random() > 0.6 && platformCount > 1) {
      const tokenX = currentX + width / 2;
      const tokenY = y - p.random(40, 80);
      const token = new Token(p, tokenX, tokenY);
      gameState.tokens.push(token);
    }
    
    currentX += width;
    platformCount++;
  }
  
  // Goal platform at the end
  const goalPlatform = new Platform(p, currentX + 100, GROUND_Y, 200, COLOR_YELLOW);
  gameState.platforms.push(goalPlatform);
  
  // Add tokens along the level
  for (let i = 0; i < 10; i++) {
    const tokenX = p.random(200, gameState.levelLength);
    const tokenY = p.random(200, 300);
    const token = new Token(p, tokenX, tokenY);
    gameState.tokens.push(token);
  }
  
  gameState.totalTokens = gameState.tokens.length;
  gameState.entities = [...gameState.platforms, ...gameState.obstacles, ...gameState.tokens];
}