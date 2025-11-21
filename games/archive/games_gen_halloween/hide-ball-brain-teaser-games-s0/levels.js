// levels.js
import { GoodBall, MonsterBall, MovableBlock, Wall } from './entities.js';
import { gameState } from './globals.js';

export const levels = [
  {
    level: 1,
    maxMoves: 8,
    goodBalls: [
      { x: 150, y: 200 }
    ],
    monsterBalls: [
      { x: 450, y: 200 }
    ],
    movableBlocks: [
      { x: 300, y: 200, w: 60, h: 80 },
      { x: 300, y: 100, w: 60, h: 60 }
    ],
    walls: [
      { x: 300, y: 380, w: 600, h: 40 }, // Bottom
      { x: 300, y: 20, w: 600, h: 40 }, // Top
      { x: 20, y: 200, w: 40, h: 400 }, // Left
      { x: 580, y: 200, w: 40, h: 400 } // Right
    ]
  },
  {
    level: 2,
    maxMoves: 10,
    goodBalls: [
      { x: 150, y: 150 },
      { x: 150, y: 250 }
    ],
    monsterBalls: [
      { x: 450, y: 150 },
      { x: 450, y: 250 }
    ],
    movableBlocks: [
      { x: 250, y: 150, w: 50, h: 70 },
      { x: 250, y: 250, w: 50, h: 70 },
      { x: 350, y: 200, w: 80, h: 50 }
    ],
    walls: [
      { x: 300, y: 380, w: 600, h: 40 },
      { x: 300, y: 20, w: 600, h: 40 },
      { x: 20, y: 200, w: 40, h: 400 },
      { x: 580, y: 200, w: 40, h: 400 }
    ]
  },
  {
    level: 3,
    maxMoves: 12,
    goodBalls: [
      { x: 150, y: 120 },
      { x: 150, y: 200 },
      { x: 150, y: 280 }
    ],
    monsterBalls: [
      { x: 450, y: 120 },
      { x: 450, y: 280 }
    ],
    movableBlocks: [
      { x: 250, y: 120, w: 50, h: 60 },
      { x: 250, y: 200, w: 50, h: 60 },
      { x: 250, y: 280, w: 50, h: 60 },
      { x: 350, y: 200, w: 70, h: 120 }
    ],
    walls: [
      { x: 300, y: 380, w: 600, h: 40 },
      { x: 300, y: 20, w: 600, h: 40 },
      { x: 20, y: 200, w: 40, h: 400 },
      { x: 580, y: 200, w: 40, h: 400 },
      { x: 300, y: 200, w: 50, h: 50 } // Center obstacle
    ]
  }
];

export function loadLevel(p, levelNumber) {
  const levelIndex = levelNumber - 1;
  if (levelIndex >= levels.length) {
    // Loop back to level 1 if exceeded
    levelNumber = 1;
    gameState.level = 1;
  }
  
  const levelData = levels[levelNumber - 1];
  
  // Clear existing entities
  gameState.goodBalls = [];
  gameState.monsterBalls = [];
  gameState.movableBlocks = [];
  gameState.walls = [];
  gameState.entities = [];
  
  // Set moves
  gameState.maxMoves = levelData.maxMoves;
  gameState.movesRemaining = levelData.maxMoves;
  gameState.monsterActivated = false;
  gameState.monsterActivationTimer = 0;
  gameState.levelComplete = false;
  gameState.selectedBlock = null;
  
  // Create walls
  levelData.walls.forEach(w => {
    const wall = new Wall(p, w.x, w.y, w.w, w.h);
    gameState.walls.push(wall);
    gameState.entities.push(wall);
  });
  
  // Create good balls
  levelData.goodBalls.forEach(gb => {
    const ball = new GoodBall(p, gb.x, gb.y);
    gameState.goodBalls.push(ball);
    gameState.entities.push(ball);
  });
  
  // Create monster balls
  levelData.monsterBalls.forEach(mb => {
    const ball = new MonsterBall(p, mb.x, mb.y);
    gameState.monsterBalls.push(ball);
    gameState.entities.push(ball);
  });
  
  // Create movable blocks
  levelData.movableBlocks.forEach(bl => {
    const block = new MovableBlock(p, bl.x, bl.y, bl.w, bl.h);
    gameState.movableBlocks.push(block);
    gameState.entities.push(block);
  });
}