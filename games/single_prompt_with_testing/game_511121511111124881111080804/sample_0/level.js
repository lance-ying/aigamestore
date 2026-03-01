// level.js - Level generation and management

import {
  gameState,
  LEVEL_CONFIG,
  CANVAS_WIDTH
} from './globals.js';
import {
  Platform,
  GrapplePoint,
  Collectible,
  Player
} from './entities.js';

// Load level from configuration
export function loadLevel(levelNumber) {
  const config = LEVEL_CONFIG[levelNumber];
  
  if (!config) {
    console.error(`Level ${levelNumber} not found`);
    return false;
  }
  
  // Clear existing entities
  gameState.platforms = [];
  gameState.grapplePoints = [];
  gameState.collectibles = [];
  gameState.particles = [];
  gameState.entities = [];
  
  // Create platforms
  config.platforms.forEach(platConfig => {
    new Platform(
      platConfig.x,
      platConfig.y,
      platConfig.width,
      platConfig.height,
      platConfig.decay !== false,
      platConfig.isGoal || false
    );
  });
  
  // Create grapple points
  config.grapplePoints.forEach(pointConfig => {
    new GrapplePoint(pointConfig.x, pointConfig.y);
  });
  
  // Create collectibles
  config.stars.forEach(starConfig => {
    new Collectible(starConfig.x, starConfig.y);
  });
  
  // Create player
  const playerStart = config.playerStart || { x: 100, y: 300 };
  gameState.player = new Player(playerStart.x, playerStart.y);
  
  // Reset level state
  gameState.score = 0;
  gameState.starsCollected = 0;
  gameState.levelTime = 0;
  gameState.isGrappling = false;
  gameState.grappleTarget = null;
  gameState.showTutorial = true;
  
  return true;
}

// Generate procedural level (for future expansion)
export function generateProceduralLevel(difficulty = 1) {
  // Clear existing entities
  gameState.platforms = [];
  gameState.grapplePoints = [];
  gameState.collectibles = [];
  gameState.particles = [];
  gameState.entities = [];
  
  // Starting platform
  new Platform(50, 350, 150, 20, false);
  
  // Generate platforms with increasing difficulty
  let currentX = 150;
  let currentY = 300;
  const platformCount = 8 + difficulty * 2;
  
  for (let i = 0; i < platformCount; i++) {
    // Random platform placement
    const xOffset = 80 + Math.random() * 100;
    const yOffset = -30 - Math.random() * 40;
    
    currentX += xOffset;
    currentY += yOffset;
    
    // Wrap X position
    if (currentX > CANVAS_WIDTH) {
      currentX -= CANVAS_WIDTH - 100;
      currentY -= 80;
    }
    
    // Clamp Y position
    currentY = Math.max(50, Math.min(300, currentY));
    
    const platformWidth = 80 + Math.random() * 60;
    const isGoal = i === platformCount - 1;
    
    new Platform(
      currentX - platformWidth / 2,
      currentY,
      platformWidth,
      20,
      !isGoal,
      isGoal
    );
    
    // Add grapple point between platforms
    if (i > 0 && Math.random() > 0.3) {
      const grappleX = currentX - xOffset / 2;
      const grappleY = currentY + yOffset / 2 - 40;
      new GrapplePoint(grappleX, grappleY);
    }
    
    // Add collectible
    if (Math.random() > 0.4) {
      const starX = currentX - platformWidth / 2 + Math.random() * platformWidth;
      const starY = currentY - 40 - Math.random() * 30;
      new Collectible(starX, starY);
    }
  }
  
  // Create player at start
  gameState.player = new Player(125, 300);
  
  // Reset level state
  gameState.score = 0;
  gameState.starsCollected = 0;
  gameState.levelTime = 0;
  gameState.isGrappling = false;
  gameState.grappleTarget = null;
  gameState.showTutorial = true;
}