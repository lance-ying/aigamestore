// levels.js - Level generation and management

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Sushi, Obstacle, Wall } from './entities.js';

export function createLevel(p, levelNum) {
  // Clear previous level entities
  gameState.sushiPieces.forEach(s => {
    if (s.body && !s.collected) {
      try {
        const Matter = window.Matter;
        Matter.World.remove(gameState.world, s.body);
      } catch(e) {}
    }
  });
  
  gameState.obstacles.forEach(o => {
    if (o.body) {
      try {
        const Matter = window.Matter;
        Matter.World.remove(gameState.world, o.body);
      } catch(e) {}
    }
  });
  
  gameState.sushiPieces = [];
  gameState.obstacles = [];
  
  // Create walls
  const wallThickness = 10;
  gameState.obstacles.push(new Wall(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT - wallThickness / 2, CANVAS_WIDTH, wallThickness)); // floor
  gameState.obstacles.push(new Wall(p, wallThickness / 2, CANVAS_HEIGHT / 2, wallThickness, CANVAS_HEIGHT)); // left wall
  gameState.obstacles.push(new Wall(p, CANVAS_WIDTH - wallThickness / 2, CANVAS_HEIGHT / 2, wallThickness, CANVAS_HEIGHT)); // right wall
  
  // Generate level based on level number
  const complexity = Math.min(levelNum, 10);
  
  // Level 1 - Simple introduction
  if (levelNum === 1) {
    // Simple pegs in a grid
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        const x = 150 + i * 100;
        const y = 120 + j * 80;
        gameState.obstacles.push(new Obstacle(p, x, y, 20, 20, 0, 'circle'));
      }
    }
    
    // Scatter sushi
    for (let i = 0; i < 20; i++) {
      const x = 100 + p.random(CANVAS_WIDTH - 200);
      const y = 100 + p.random(250);
      gameState.sushiPieces.push(new Sushi(p, x, y));
    }
  }
  // Level 2 - Platforms
  else if (levelNum === 2) {
    gameState.obstacles.push(new Obstacle(p, 150, 150, 120, 15, -0.3, 'rect'));
    gameState.obstacles.push(new Obstacle(p, 450, 150, 120, 15, 0.3, 'rect'));
    gameState.obstacles.push(new Obstacle(p, 300, 250, 100, 15, 0, 'rect'));
    
    for (let i = 0; i < 25; i++) {
      const x = 80 + p.random(CANVAS_WIDTH - 160);
      const y = 100 + p.random(250);
      gameState.sushiPieces.push(new Sushi(p, x, y));
    }
  }
  // Level 3 - Triangular obstacles
  else if (levelNum === 3) {
    for (let i = 0; i < 4; i++) {
      const x = 120 + i * 120;
      const y = 140 + (i % 2) * 60;
      gameState.obstacles.push(new Obstacle(p, x, y, 40, 40, 0, 'triangle'));
    }
    
    // Circular pegs
    for (let i = 0; i < 5; i++) {
      const x = 100 + i * 100;
      const y = 280;
      gameState.obstacles.push(new Obstacle(p, x, y, 25, 25, 0, 'circle'));
    }
    
    for (let i = 0; i < 30; i++) {
      const x = 70 + p.random(CANVAS_WIDTH - 140);
      const y = 80 + p.random(280);
      gameState.sushiPieces.push(new Sushi(p, x, y));
    }
  }
  // Procedural levels
  else {
    const numPegs = 8 + complexity;
    const numPlatforms = 2 + Math.floor(complexity / 2);
    const numSushi = 15 + complexity * 2;
    
    // Random circular pegs
    for (let i = 0; i < numPegs; i++) {
      const x = 100 + p.random(CANVAS_WIDTH - 200);
      const y = 100 + p.random(200);
      const size = 15 + p.random(15);
      gameState.obstacles.push(new Obstacle(p, x, y, size, size, 0, 'circle'));
    }
    
    // Random platforms
    for (let i = 0; i < numPlatforms; i++) {
      const x = 100 + p.random(CANVAS_WIDTH - 200);
      const y = 120 + p.random(200);
      const width = 60 + p.random(80);
      const angle = p.random(-0.5, 0.5);
      gameState.obstacles.push(new Obstacle(p, x, y, width, 12, angle, 'rect'));
    }
    
    // Scatter sushi
    for (let i = 0; i < numSushi; i++) {
      const x = 60 + p.random(CANVAS_WIDTH - 120);
      const y = 80 + p.random(280);
      gameState.sushiPieces.push(new Sushi(p, x, y));
    }
  }
  
  gameState.totalSushiInLevel = gameState.sushiPieces.length;
  gameState.entities = [...gameState.obstacles, ...gameState.sushiPieces];
}

export function nextLevel(p) {
  gameState.currentLevel++;
  gameState.bellyMeter = 0;
  gameState.dropsRemaining = gameState.maxDrops;
  gameState.catDropped = false;
  gameState.dropPositionX = CANVAS_WIDTH / 2;
  
  if (gameState.player) {
    gameState.player.remove();
    gameState.player = null;
  }
  
  createLevel(p, gameState.currentLevel);
  
  gameState.gamePhase = "PLAYING";
  
  p.logs.game_info.push({
    data: { gamePhase: "PLAYING", level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}