// levels.js - Level generation and management

import { Platform, Collectible, Hazard, Checkpoint, Goal, PushableBlock } from './entities.js';
import { gameState } from './globals.js';

export function generateLevel(p, levelIndex) {
  const levels = [
    generateLevel1,
    generateLevel2,
    generateLevel3
  ];
  
  if (levelIndex < levels.length) {
    levels[levelIndex](p);
  }
}

function generateLevel1(p) {
  // Level 1: Classic Typography - Simple platforming
  const theme = 'classic';
  
  // Ground platforms
  gameState.platforms.push(new Platform(p, 100, 320, 200, 40, 'A', theme));
  gameState.platforms.push(new Platform(p, 350, 280, 120, 40, 'B', theme));
  gameState.platforms.push(new Platform(p, 550, 240, 100, 40, 'C', theme));
  gameState.platforms.push(new Platform(p, 750, 200, 150, 40, 'D', theme));
  gameState.platforms.push(new Platform(p, 950, 240, 100, 40, 'E', theme));
  gameState.platforms.push(new Platform(p, 1150, 280, 120, 40, 'F', theme));
  gameState.platforms.push(new Platform(p, 1350, 240, 100, 40, 'G', theme));
  gameState.platforms.push(new Platform(p, 1550, 200, 150, 40, 'H', theme));
  gameState.platforms.push(new Platform(p, 1800, 280, 200, 40, 'I', theme));
  gameState.platforms.push(new Platform(p, 2100, 240, 150, 40, 'J', theme));
  
  // Collectibles
  gameState.collectibles.push(new Collectible(p, 350, 220));
  gameState.collectibles.push(new Collectible(p, 550, 180));
  gameState.collectibles.push(new Collectible(p, 750, 140));
  gameState.collectibles.push(new Collectible(p, 1150, 220));
  gameState.collectibles.push(new Collectible(p, 1550, 140));
  gameState.collectibles.push(new Collectible(p, 1800, 220));
  
  // Hazards
  gameState.hazards.push(new Hazard(p, 450, 350, 60, 20));
  gameState.hazards.push(new Hazard(p, 850, 350, 60, 20));
  gameState.hazards.push(new Hazard(p, 1250, 350, 60, 20));
  
  // Checkpoints
  gameState.entities.push(new Checkpoint(p, 750, 160));
  gameState.entities.push(new Checkpoint(p, 1550, 160));
  
  // Goal
  gameState.goal = new Goal(p, 2200, 200);
  gameState.entities.push(gameState.goal);
}

function generateLevel2(p) {
  // Level 2: Modern Typography - More challenging jumps and blocks
  const theme = 'modern';
  
  // Platforms with gaps
  gameState.platforms.push(new Platform(p, 100, 320, 150, 40, 'K', theme));
  gameState.platforms.push(new Platform(p, 350, 280, 100, 40, 'L', theme));
  gameState.platforms.push(new Platform(p, 600, 240, 100, 40, 'M', theme));
  gameState.platforms.push(new Platform(p, 900, 200, 120, 40, 'N', theme));
  gameState.platforms.push(new Platform(p, 1200, 240, 100, 40, 'O', theme));
  gameState.platforms.push(new Platform(p, 1500, 200, 100, 40, 'P', theme));
  gameState.platforms.push(new Platform(p, 1800, 280, 150, 40, 'Q', theme));
  gameState.platforms.push(new Platform(p, 2100, 240, 120, 40, 'R', theme));
  
  // Pushable blocks
  gameState.blocks.push(new PushableBlock(p, 450, 240, 50, 50, '□'));
  gameState.blocks.push(new PushableBlock(p, 750, 160, 50, 50, '□'));
  gameState.blocks.push(new PushableBlock(p, 1350, 160, 50, 50, '□'));
  
  // Collectibles
  gameState.collectibles.push(new Collectible(p, 350, 220));
  gameState.collectibles.push(new Collectible(p, 600, 180));
  gameState.collectibles.push(new Collectible(p, 900, 140));
  gameState.collectibles.push(new Collectible(p, 1200, 180));
  gameState.collectibles.push(new Collectible(p, 1500, 140));
  gameState.collectibles.push(new Collectible(p, 1800, 220));
  
  // Hazards
  gameState.hazards.push(new Hazard(p, 500, 350, 80, 20));
  gameState.hazards.push(new Hazard(p, 1050, 350, 100, 20));
  gameState.hazards.push(new Hazard(p, 1650, 350, 80, 20));
  
  // Checkpoints
  gameState.entities.push(new Checkpoint(p, 900, 160));
  gameState.entities.push(new Checkpoint(p, 1800, 240));
  
  // Goal
  gameState.goal = new Goal(p, 2200, 200);
  gameState.entities.push(gameState.goal);
}

function generateLevel3(p) {
  // Level 3: Serif Typography - Complex puzzles
  const theme = 'serif';
  
  // Multi-level platforms
  gameState.platforms.push(new Platform(p, 100, 320, 150, 40, 'S', theme));
  gameState.platforms.push(new Platform(p, 300, 280, 100, 40, 'T', theme));
  gameState.platforms.push(new Platform(p, 500, 240, 100, 40, 'U', theme));
  gameState.platforms.push(new Platform(p, 700, 200, 100, 40, 'V', theme));
  gameState.platforms.push(new Platform(p, 900, 160, 100, 40, 'W', theme));
  gameState.platforms.push(new Platform(p, 1100, 200, 100, 40, 'X', theme));
  gameState.platforms.push(new Platform(p, 1300, 240, 100, 40, 'Y', theme));
  gameState.platforms.push(new Platform(p, 1500, 200, 100, 40, 'Z', theme));
  gameState.platforms.push(new Platform(p, 1700, 280, 150, 40, '&', theme));
  gameState.platforms.push(new Platform(p, 1950, 240, 150, 40, '@', theme));
  gameState.platforms.push(new Platform(p, 2200, 200, 150, 40, '#', theme));
  
  // Multiple pushable blocks
  gameState.blocks.push(new PushableBlock(p, 400, 200, 50, 50, '■'));
  gameState.blocks.push(new PushableBlock(p, 600, 160, 50, 50, '■'));
  gameState.blocks.push(new PushableBlock(p, 1000, 120, 50, 50, '■'));
  gameState.blocks.push(new PushableBlock(p, 1400, 200, 50, 50, '■'));
  
  // Collectibles
  gameState.collectibles.push(new Collectible(p, 300, 220));
  gameState.collectibles.push(new Collectible(p, 500, 180));
  gameState.collectibles.push(new Collectible(p, 700, 140));
  gameState.collectibles.push(new Collectible(p, 900, 100));
  gameState.collectibles.push(new Collectible(p, 1100, 140));
  gameState.collectibles.push(new Collectible(p, 1300, 180));
  gameState.collectibles.push(new Collectible(p, 1700, 220));
  gameState.collectibles.push(new Collectible(p, 2200, 140));
  
  // Hazards
  gameState.hazards.push(new Hazard(p, 400, 350, 60, 20));
  gameState.hazards.push(new Hazard(p, 800, 350, 80, 20));
  gameState.hazards.push(new Hazard(p, 1200, 350, 60, 20));
  gameState.hazards.push(new Hazard(p, 1600, 350, 80, 20));
  
  // Checkpoints
  gameState.entities.push(new Checkpoint(p, 700, 160));
  gameState.entities.push(new Checkpoint(p, 1300, 200));
  gameState.entities.push(new Checkpoint(p, 1950, 200));
  
  // Goal
  gameState.goal = new Goal(p, 2300, 160);
  gameState.entities.push(gameState.goal);
}

export function cleanupLevel() {
  // Remove all platforms
  gameState.platforms.forEach(platform => platform.cleanup());
  gameState.platforms = [];
  
  // Remove all hazards
  gameState.hazards.forEach(hazard => hazard.cleanup());
  gameState.hazards = [];
  
  // Remove all blocks
  gameState.blocks.forEach(block => block.cleanup());
  gameState.blocks = [];
  
  // Clear collectibles
  gameState.collectibles = [];
  
  // Clear other entities
  gameState.entities.forEach(entity => {
    if (entity.cleanup) {
      entity.cleanup();
    }
  });
  gameState.entities = [];
  
  gameState.goal = null;
}