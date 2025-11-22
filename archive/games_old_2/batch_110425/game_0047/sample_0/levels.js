// levels.js - Level definitions and generation

import { Platform, Spike, Coin, ExitPortal } from './entities.js';
import { gameState } from './globals.js';

export function createLevel(levelNumber) {
  const levels = [
    // Level 1 - Tutorial
    {
      playerStart: { x: 100, y: 200 },
      platforms: [
        { x: 0, y: 350, width: 600, height: 50 },
        { x: 200, y: 280, width: 100, height: 20 },
        { x: 350, y: 220, width: 100, height: 20 },
        { x: 500, y: 160, width: 100, height: 20 }
      ],
      coins: [
        { x: 150, y: 300 },
        { x: 250, y: 250 },
        { x: 400, y: 190 },
        { x: 550, y: 130 }
      ],
      spikes: [
        { x: 300, y: 350, width: 80, pointUp: true }
      ],
      exit: { x: 530, y: 100 }
    },
    // Level 2 - Inflation practice
    {
      playerStart: { x: 50, y: 300 },
      platforms: [
        { x: 0, y: 350, width: 150, height: 50 },
        { x: 450, y: 350, width: 150, height: 50 },
        { x: 200, y: 280, width: 80, height: 20 },
        { x: 320, y: 280, width: 80, height: 20 }
      ],
      coins: [
        { x: 100, y: 300 },
        { x: 300, y: 200 },
        { x: 500, y: 300 }
      ],
      spikes: [
        { x: 150, y: 350, width: 100, pointUp: true },
        { x: 250, y: 280, width: 70, pointUp: false }
      ],
      exit: { x: 520, y: 290 }
    },
    // Level 3 - Moving platforms
    {
      playerStart: { x: 50, y: 300 },
      platforms: [
        { x: 0, y: 350, width: 100, height: 50 },
        { x: 150, y: 280, width: 80, height: 20, movable: true },
        { x: 350, y: 250, width: 80, height: 20, movable: true },
        { x: 500, y: 350, width: 100, height: 50 }
      ],
      coins: [
        { x: 80, y: 300 },
        { x: 200, y: 220 },
        { x: 400, y: 190 },
        { x: 550, y: 300 }
      ],
      spikes: [
        { x: 100, y: 350, width: 50, pointUp: true },
        { x: 280, y: 280, width: 70, pointUp: true }
      ],
      exit: { x: 530, y: 290 }
    },
    // Level 4 - Vertical challenge
    {
      playerStart: { x: 50, y: 350 },
      platforms: [
        { x: 0, y: 380, width: 100, height: 20 },
        { x: 120, y: 320, width: 80, height: 20 },
        { x: 220, y: 260, width: 80, height: 20 },
        { x: 320, y: 200, width: 80, height: 20 },
        { x: 420, y: 140, width: 80, height: 20 },
        { x: 500, y: 80, width: 100, height: 20 }
      ],
      coins: [
        { x: 50, y: 330 },
        { x: 160, y: 280 },
        { x: 260, y: 220 },
        { x: 360, y: 160 },
        { x: 460, y: 100 },
        { x: 550, y: 50 }
      ],
      spikes: [
        { x: 100, y: 380, width: 20, pointUp: true },
        { x: 200, y: 320, width: 20, pointUp: true },
        { x: 300, y: 260, width: 20, pointUp: true }
      ],
      exit: { x: 530, y: 20 }
    },
    // Level 5 - Final challenge
    {
      playerStart: { x: 50, y: 300 },
      platforms: [
        { x: 0, y: 350, width: 120, height: 50 },
        { x: 150, y: 280, width: 60, height: 20, movable: true },
        { x: 250, y: 320, width: 60, height: 20 },
        { x: 340, y: 260, width: 60, height: 20, movable: true },
        { x: 430, y: 200, width: 60, height: 20 },
        { x: 510, y: 350, width: 90, height: 50 }
      ],
      coins: [
        { x: 80, y: 300 },
        { x: 180, y: 220 },
        { x: 280, y: 280 },
        { x: 370, y: 200 },
        { x: 460, y: 160 },
        { x: 550, y: 300 }
      ],
      spikes: [
        { x: 120, y: 350, width: 30, pointUp: true },
        { x: 210, y: 320, width: 40, pointUp: true },
        { x: 310, y: 350, width: 30, pointUp: true },
        { x: 400, y: 260, width: 30, pointUp: false },
        { x: 490, y: 200, width: 20, pointUp: true }
      ],
      exit: { x: 540, y: 290 }
    }
  ];

  if (levelNumber >= levels.length) {
    return null; // No more levels
  }

  const levelData = levels[levelNumber];
  
  // Create platforms
  gameState.platforms = levelData.platforms.map(p => 
    new Platform(p.x, p.y, p.width, p.height, p.movable || false)
  );

  // Create coins
  gameState.coins = levelData.coins.map(c => new Coin(c.x, c.y));
  gameState.totalCoins = gameState.coins.length;
  gameState.coinsCollected = 0;

  // Create spikes
  gameState.hazards = levelData.spikes.map(s => 
    new Spike(s.x, s.y, s.width, s.pointUp)
  );

  // Create exit portal
  gameState.exitPortal = new ExitPortal(levelData.exit.x, levelData.exit.y);

  // Reset entities array
  gameState.entities = [
    ...gameState.platforms,
    ...gameState.coins,
    ...gameState.hazards,
    gameState.exitPortal
  ];

  return levelData.playerStart;
}

export function getTotalLevels() {
  return 5;
}