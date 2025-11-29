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
  
  // Create level structures and pigs
  // Tower 1 - Simple wooden tower
  const tower1X = 350;
  const tower1Y = CANVAS_HEIGHT - 40;
  
  // Base
  gameState.structures.push(new Structure(p, tower1X - 30, tower1Y, 15, 60, "wood"));
  gameState.structures.push(new Structure(p, tower1X + 30, tower1Y, 15, 60, "wood"));
  
  // Middle platform
  gameState.structures.push(new Structure(p, tower1X, tower1Y - 40, 80, 15, "wood"));
  
  // Pig on platform
  gameState.pigs.push(new Pig(p, tower1X, tower1Y - 60));
  
  // Top
  gameState.structures.push(new Structure(p, tower1X - 25, tower1Y - 85, 15, 40, "wood"));
  gameState.structures.push(new Structure(p, tower1X + 25, tower1Y - 85, 15, 40, "wood"));
  gameState.structures.push(new Structure(p, tower1X, tower1Y - 115, 70, 15, "wood"));
  
  // Tower 2 - Stone and wood mixed
  const tower2X = 500;
  const tower2Y = CANVAS_HEIGHT - 40;
  
  // Base pillars
  gameState.structures.push(new Structure(p, tower2X - 35, tower2Y, 20, 70, "stone"));
  gameState.structures.push(new Structure(p, tower2X + 35, tower2Y, 20, 70, "stone"));
  
  // First floor
  gameState.structures.push(new Structure(p, tower2X, tower2Y - 50, 90, 15, "wood"));
  gameState.pigs.push(new Pig(p, tower2X, tower2Y - 70));
  
  // Second floor pillars
  gameState.structures.push(new Structure(p, tower2X - 30, tower2Y - 95, 15, 40, "wood"));
  gameState.structures.push(new Structure(p, tower2X + 30, tower2Y - 95, 15, 40, "wood"));
  
  // Second floor platform
  gameState.structures.push(new Structure(p, tower2X, tower2Y - 125, 80, 15, "stone"));
  gameState.pigs.push(new Pig(p, tower2X, tower2Y - 145));
  
  // Roof
  gameState.structures.push(new Structure(p, tower2X - 20, tower2Y - 160, 15, 25, "wood"));
  gameState.structures.push(new Structure(p, tower2X + 20, tower2Y - 160, 15, 25, "wood"));
  gameState.structures.push(new Structure(p, tower2X, tower2Y - 180, 60, 15, "wood"));
  
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
  gameState.birdsRemaining = 3;
  gameState.birdInFlight = false;
  gameState.abilityUsed = false;
  gameState.isAiming = true;
  gameState.score = 0;
  gameState.levelComplete = false;
  gameState.slingshotAngle = -45;
  gameState.slingshotPower = 50;
  gameState.cameraOffsetX = 0;
  
  // Recreate level
  createLevel(p);
}