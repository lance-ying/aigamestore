// game_init.js - Game initialization and setup

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  ASTEROID_COUNT,
  DRONE_COUNT,
  CRYSTAL_COUNT
} from './globals.js';
import { 
  Player, 
  Asteroid, 
  Drone, 
  Crystal 
} from './entities.js';
import { StarField } from './particles.js';
import { randomRange } from './utils.js';

export function initializeGame(p) {
  // Create star field
  gameState.stars = new StarField();
  
  // Initialize empty arrays
  gameState.entities = [];
  gameState.asteroids = [];
  gameState.drones = [];
  gameState.crystals = [];
  gameState.projectiles = [];
  gameState.enemyProjectiles = [];
  gameState.particles = [];
  
  // Reset stats
  gameState.score = 0;
  gameState.crystalsCollected = 0;
  gameState.enemiesDestroyed = 0;
  gameState.asteroidsDestroyed = 0;
  
  // Log initial state
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { 
        gamePhase: gameState.gamePhase,
        controlMode: gameState.controlMode
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function startNewGame() {
  // Create player
  new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Create asteroids
  for (let i = 0; i < ASTEROID_COUNT; i++) {
    let x, y;
    let tooClose = true;
    let attempts = 0;
    
    while (tooClose && attempts < 50) {
      x = randomRange(50, CANVAS_WIDTH - 50);
      y = randomRange(80, CANVAS_HEIGHT - 50);
      
      const dist = Math.sqrt(
        Math.pow(x - CANVAS_WIDTH / 2, 2) + 
        Math.pow(y - CANVAS_HEIGHT / 2, 2)
      );
      
      if (dist > 100) {
        tooClose = false;
      }
      attempts++;
    }
    
    new Asteroid(x, y);
  }
  
  // Create enemy drones
  for (let i = 0; i < DRONE_COUNT; i++) {
    const side = i % 4;
    let x, y;
    
    switch (side) {
      case 0: // Top
        x = randomRange(50, CANVAS_WIDTH - 50);
        y = 80;
        break;
      case 1: // Right
        x = CANVAS_WIDTH - 50;
        y = randomRange(100, CANVAS_HEIGHT - 50);
        break;
      case 2: // Bottom
        x = randomRange(50, CANVAS_WIDTH - 50);
        y = CANVAS_HEIGHT - 50;
        break;
      case 3: // Left
        x = 50;
        y = randomRange(100, CANVAS_HEIGHT - 50);
        break;
    }
    
    new Drone(x, y);
  }
  
  // Create cosmic crystals
  for (let i = 0; i < CRYSTAL_COUNT; i++) {
    let x, y;
    let tooClose = true;
    let attempts = 0;
    
    while (tooClose && attempts < 50) {
      x = randomRange(50, CANVAS_WIDTH - 50);
      y = randomRange(100, CANVAS_HEIGHT - 50);
      
      const dist = Math.sqrt(
        Math.pow(x - CANVAS_WIDTH / 2, 2) + 
        Math.pow(y - CANVAS_HEIGHT / 2, 2)
      );
      
      if (dist > 80) {
        tooClose = false;
      }
      attempts++;
    }
    
    new Crystal(x, y);
  }
}