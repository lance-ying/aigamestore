// level.js - Level creation and management

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, World } = Matter;

import { gameState, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { Pig, Structure } from './entities.js';

const LEVELS = {
  1: {
    name: "Simple Tower",
    birdsAllowed: 6,
    birdQueue: ["RED", "BLUE", "YELLOW", "BLACK", "RED", "BLUE"],
    setup: (p) => {
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
    }
  },
  2: {
    name: "Double Trouble",
    birdsAllowed: 6,
    birdQueue: ["RED", "BLUE", "YELLOW", "BLACK", "RED", "BLUE"],
    setup: (p) => {
      const groundY = CANVAS_HEIGHT - 40;
      
      // Left tower
      const leftX = 320;
      gameState.structures.push(new Structure(p, leftX - 20, groundY, 15, 80, "wood"));
      gameState.structures.push(new Structure(p, leftX + 20, groundY, 15, 80, "wood"));
      gameState.structures.push(new Structure(p, leftX, groundY - 50, 60, 15, "stone"));
      gameState.pigs.push(new Pig(p, leftX, groundY - 70));
      
      // Right tower
      const rightX = 480;
      gameState.structures.push(new Structure(p, rightX - 25, groundY, 15, 100, "stone"));
      gameState.structures.push(new Structure(p, rightX + 25, groundY, 15, 100, "stone"));
      gameState.structures.push(new Structure(p, rightX, groundY - 60, 70, 15, "wood"));
      gameState.pigs.push(new Pig(p, rightX, groundY - 80));
      
      // Middle pig with protection
      gameState.structures.push(new Structure(p, 400, groundY, 20, 40, "wood"));
      gameState.pigs.push(new Pig(p, 400, groundY - 35));
    }
  },
  3: {
    name: "Fortress",
    birdsAllowed: 6,
    birdQueue: ["RED", "BLUE", "YELLOW", "BLACK", "RED", "BLUE"],
    setup: (p) => {
      const groundY = CANVAS_HEIGHT - 40;
      const fortX = 420;
      
      // Outer walls
      gameState.structures.push(new Structure(p, fortX - 60, groundY, 20, 100, "stone"));
      gameState.structures.push(new Structure(p, fortX + 60, groundY, 20, 100, "stone"));
      
      // Roof beams
      gameState.structures.push(new Structure(p, fortX - 30, groundY - 60, 70, 15, "stone"));
      gameState.structures.push(new Structure(p, fortX + 30, groundY - 60, 70, 15, "stone"));
      
      // Inner structure
      gameState.structures.push(new Structure(p, fortX - 30, groundY - 20, 15, 50, "wood"));
      gameState.structures.push(new Structure(p, fortX + 30, groundY - 20, 15, 50, "wood"));
      gameState.structures.push(new Structure(p, fortX, groundY - 55, 80, 15, "wood"));
      
      // Pigs at different levels
      gameState.pigs.push(new Pig(p, fortX, groundY - 15));
      gameState.pigs.push(new Pig(p, fortX - 30, groundY - 75));
      gameState.pigs.push(new Pig(p, fortX + 30, groundY - 75));
      
      // Top protection
      gameState.structures.push(new Structure(p, fortX, groundY - 100, 140, 15, "stone"));
    }
  }
};

export function createLevel(p) {
  // Create ground
  const ground = Bodies.rectangle(400, CANVAS_HEIGHT - 10, 1600, 20, {
    label: 'ground',
    isStatic: true,
    friction: 0.9
  });
  World.add(gameState.world, ground);
  gameState.groundBody = ground;
  
  // Load current level
  const level = LEVELS[gameState.currentLevel];
  if (level) {
    level.setup(p);
  } else {
    // Fallback to level 1
    LEVELS[1].setup(p);
  }
  
  // Add all entities to main array
  gameState.entities = [
    ...gameState.pigs,
    ...gameState.structures
  ];
}

export function loadLevel(p, levelNumber) {
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
  gameState.birdInFlight = false;
  gameState.abilityUsed = false;
  gameState.isAiming = true;
  gameState.levelComplete = false;
  gameState.slingshotAngle = -45;
  gameState.slingshotPower = 50;
  
  // Set level
  gameState.currentLevel = levelNumber;
  const level = LEVELS[levelNumber];
  
  if (level) {
    gameState.birdsRemaining = level.birdsAllowed;
    gameState.birdQueue = [...level.birdQueue];
  } else {
    gameState.birdsRemaining = 6;
    gameState.birdQueue = ["RED", "BLUE", "YELLOW", "BLACK", "RED", "BLUE"];
  }
  
  // Recreate level
  createLevel(p);
}

export function resetLevel(p) {
  loadLevel(p, 1);
}

export function nextLevel(p) {
  const nextLevelNum = gameState.currentLevel + 1;
  if (nextLevelNum <= gameState.totalLevels) {
    loadLevel(p, nextLevelNum);
    return true;
  }
  return false;
}