// levelManager.js - Level setup and management
import { gameState, CANVAS_HEIGHT } from './globals.js';
import { Platform, MovableObject, Enemy, Hazard, ExitPortal } from './entities.js';

export function createLevel(p, levelNum) {
  gameState.platforms = [];
  gameState.movableObjects = [];
  gameState.enemies = [];
  gameState.hazards = [];
  gameState.exitPortal = null;

  if (levelNum === 1) {
    createLevel1(p);
  }
}

function createLevel1(p) {
  // Starting platform
  gameState.platforms.push(new Platform(0, 350, 300, 50, 'normal'));
  
  // Gap with movable block
  gameState.movableObjects.push(new MovableObject(p, 350, 250, 20, 'block'));
  
  // Platform after gap
  gameState.platforms.push(new Platform(450, 350, 200, 50, 'normal'));
  
  // Enemy on platform
  gameState.enemies.push(new Enemy(p, 550, 320, 50));
  
  // Lava pit
  gameState.hazards.push(new Hazard(700, 370, 150, 30, 'lava'));
  
  // High platform with blocks
  gameState.platforms.push(new Platform(900, 280, 180, 30, 'normal'));
  gameState.movableObjects.push(new MovableObject(p, 950, 200, 18, 'metal'));
  gameState.movableObjects.push(new MovableObject(p, 1000, 200, 18, 'metal'));
  
  // Moving platform section
  gameState.platforms.push(new Platform(1150, 300, 100, 20, 'moving'));
  
  // More enemies
  gameState.enemies.push(new Enemy(p, 1300, 320, 80));
  gameState.platforms.push(new Platform(1200, 350, 300, 50, 'normal'));
  
  // Lava pit with blocks to cross
  gameState.hazards.push(new Hazard(1550, 370, 200, 30, 'lava'));
  gameState.movableObjects.push(new MovableObject(p, 1600, 250, 22, 'block'));
  gameState.movableObjects.push(new MovableObject(p, 1680, 250, 22, 'block'));
  
  // Upper section
  gameState.platforms.push(new Platform(1800, 250, 150, 30, 'normal'));
  gameState.enemies.push(new Enemy(p, 1860, 220, 40));
  
  // Final platforming section
  gameState.platforms.push(new Platform(2000, 300, 100, 30, 'normal'));
  gameState.platforms.push(new Platform(2150, 250, 100, 30, 'normal'));
  
  // Exit portal
  gameState.platforms.push(new Platform(2250, 200, 150, 50, 'normal'));
  gameState.exitPortal = new ExitPortal(p, 2280, 120);
}

export function updateCamera() {
  const player = gameState.player;
  if (!player) return;

  const targetX = player.x - 300; // Center player
  gameState.cameraX = Math.max(0, Math.min(targetX, gameState.levelWidth - 600));
}