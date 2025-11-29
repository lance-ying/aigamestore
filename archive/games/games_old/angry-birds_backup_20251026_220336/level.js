// level.js - Level creation and management

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, World } = Matter;

import { gameState, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { Pig, Structure } from './entities.js';

export function createLevel(p) {
  // Create ground
  const ground = Bodies.rectangle(400, CANVAS_HEIGHT - 10, 1600, 20, {
    label: 'ground',
    isStatic: true,
    friction: 0.9
  });
  World.add(gameState.world, ground);
  gameState.groundBody = ground;
  
  // Create simple level - one tower, easier to beat
  const towerX = 400;
  const towerY = CANVAS_HEIGHT - 40;
  
  // Base pillars
  gameState.structures.push(new Structure(p, towerX - 30, towerY, 15, 60, "wood"));
  gameState.structures.push(new Structure(p, towerX + 30, towerY, 15, 60, "wood"));
  
  // Floor platform
  gameState.structures.push(new Structure(p, towerX, towerY - 40, 80, 15, "wood"));
  
  // Pig on floor
  gameState.pigs.push(new Pig(p, towerX, towerY - 60));
  
  // Second level pillars
  gameState.structures.push(new Structure(p, towerX - 25, towerY - 85, 15, 40, "wood"));
  gameState.structures.push(new Structure(p, towerX + 25, towerY - 85, 15, 40, "wood"));
  
  // Top platform
  gameState.structures.push(new Structure(p, towerX, towerY - 115, 70, 15, "wood"));
  
  // Pig on top
  gameState.pigs.push(new Pig(p, towerX, towerY - 135));
  
  // Add all entities to main array
  gameState.entities = [
    ...gameState.pigs,
    ...gameState.structures
  ];
}

export function resetLevel(p) {
  // Clean up existing entities
  for (let entity of gameState.entities) {
    if (entity.cleanup) {
      entity.cleanup();
    }
  }
  
  if (gameState.currentBird) {
    gameState.currentBird.cleanup();
  }
  
  if (gameState.groundBody) {
    World.remove(gameState.world, gameState.groundBody);
  }
  
  // Reset state
  gameState.entities = [];
  gameState.pigs = [];
  gameState.structures = [];
  gameState.currentBird = null;
  gameState.currentBirdIndex = 0;
  gameState.birdsRemaining = 6;
  gameState.birdInFlight = false;
  gameState.abilityUsed = false;
  gameState.isAiming = true;
  gameState.score = 0;
  gameState.levelComplete = false;
  gameState.slingshotAngle = -45;
  gameState.slingshotPower = 50;
  
  // Initialize bird queue with variety of bird types
  gameState.birdQueue = ["RED", "BLUE", "YELLOW", "BLACK", "RED", "BLUE"];
  
  // Recreate level
  createLevel(p);
}