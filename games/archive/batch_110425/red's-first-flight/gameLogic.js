// gameLogic.js - Core game logic

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, Body, World } = Matter;

import { 
  gameState,
  GAME_PHASES,
  CONTROL_MODES,
  SLINGSHOT_X,
  SLINGSHOT_Y,
  MIN_POWER,
  MAX_POWER,
  POWER_STEP,
  MIN_ANGLE,
  MAX_ANGLE,
  ANGLE_STEP,
  LAUNCH_FORCE_MULTIPLIER,
  STAR_THRESHOLDS,
  BIRD_BONUS
} from './globals.js';

import { 
  Bird, 
  Pig, 
  Block, 
  Ground, 
  Slingshot 
} from './entities.js';

import { removeDestroyedBodies } from './physics.js';
import { getCurrentLevel } from './levels.js';

export function initializeGame(p) {
  const levelData = getCurrentLevel(gameState.level);
  
  // Create ground
  gameState.ground = new Ground(p, 300, 380, 600, 40);
  
  // Create slingshot
  gameState.slingshot = new Slingshot(p, SLINGSHOT_X, SLINGSHOT_Y);
  
  // Create structures
  levelData.structures.forEach(structure => {
    if (structure.type === 'pig') {
      const pig = new Pig(p, structure.x, structure.y);
      gameState.pigs.push(pig);
      gameState.entities.push(pig);
    } else if (structure.type === 'block') {
      const block = new Block(
        p, 
        structure.x, 
        structure.y, 
        structure.width, 
        structure.height, 
        structure.material
      );
      gameState.blocks.push(block);
      gameState.entities.push(block);
    }
  });
  
  // Set initial birds count
  gameState.birdsRemaining = levelData.birds;
  
  // Create first bird
  createNewBird(p);
}

export function createNewBird(p) {
  if (gameState.birdsRemaining > 0) {
    const bird = new Bird(p, SLINGSHOT_X, SLINGSHOT_Y - 30);
    gameState.currentBird = bird;
    gameState.birds.push(bird);
    gameState.entities.push(bird);
    gameState.birdLaunched = false;
    
    // Log player info
    p.logs.player_info.push({
      screen_x: bird.body.position.x,
      screen_y: bird.body.position.y,
      game_x: bird.body.position.x,
      game_y: bird.body.position.y,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function launchBird(p) {
  if (gameState.currentBird && !gameState.birdLaunched) {
    const angleRad = (gameState.slingshotAngle * Math.PI) / 180;
    const power = gameState.slingshotPower;
    
    const forceX = Math.cos(angleRad) * power * LAUNCH_FORCE_MULTIPLIER;
    const forceY = Math.sin(angleRad) * power * LAUNCH_FORCE_MULTIPLIER;
    
    gameState.currentBird.launch(forceX, forceY);
    gameState.birdLaunched = true;
    gameState.birdsRemaining--;
    
    // Reset test state
    gameState.testState.framesSinceLaunch = 0;
    
    // Log launch
    p.logs.player_info.push({
      screen_x: gameState.currentBird.body.position.x,
      screen_y: gameState.currentBird.body.position.y,
      game_x: gameState.currentBird.body.position.x,
      game_y: gameState.currentBird.body.position.y,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateGame(p) {
  // Update all entities
  gameState.entities.forEach(entity => {
    if (entity.update) entity.update();
  });
  
  // Remove destroyed bodies
  removeDestroyedBodies();
  
  // Check if current bird has settled
  if (gameState.birdLaunched && gameState.currentBird && gameState.currentBird.settled) {
    // Check win condition
    if (gameState.pigs.length === 0) {
      winLevel(p);
      return;
    }
    
    // Create new bird or lose
    if (gameState.birdsRemaining > 0) {
      createNewBird(p);
    } else {
      // Check if any birds are still in motion
      const birdsInMotion = gameState.birds.some(bird => 
        !bird.settled && bird.launched
      );
      
      if (!birdsInMotion) {
        if (gameState.pigs.length > 0) {
          loseLevel(p);
        } else {
          winLevel(p);
        }
      }
    }
  }
}

export function winLevel(p) {
  // Calculate bonus for remaining birds
  const bonus = gameState.birdsRemaining * BIRD_BONUS;
  gameState.score += bonus;
  
  // Calculate stars
  gameState.stars = 1;
  if (gameState.score >= STAR_THRESHOLDS[1]) gameState.stars = 2;
  if (gameState.score >= STAR_THRESHOLDS[2]) gameState.stars = 3;
  
  gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  
  p.logs.game_info.push({
    data: { 
      gamePhase: GAME_PHASES.GAME_OVER_WIN,
      score: gameState.score,
      stars: gameState.stars
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function loseLevel(p) {
  gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  
  p.logs.game_info.push({
    data: { 
      gamePhase: GAME_PHASES.GAME_OVER_LOSE,
      pigsRemaining: gameState.pigs.length
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function handleInput(p) {
  if (gameState.controlMode !== CONTROL_MODES.HUMAN) return;
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (!gameState.currentBird || gameState.birdLaunched) return;
  
  // Adjust power
  if (p.keyIsDown(38)) { // UP
    gameState.slingshotPower = Math.min(MAX_POWER, gameState.slingshotPower + POWER_STEP);
  }
  if (p.keyIsDown(40)) { // DOWN
    gameState.slingshotPower = Math.max(MIN_POWER, gameState.slingshotPower - POWER_STEP);
  }
  
  // Adjust angle
  if (p.keyIsDown(37)) { // LEFT
    gameState.slingshotAngle = Math.max(MIN_ANGLE, gameState.slingshotAngle - ANGLE_STEP);
  }
  if (p.keyIsDown(39)) { // RIGHT
    gameState.slingshotAngle = Math.min(MAX_ANGLE, gameState.slingshotAngle + ANGLE_STEP);
  }
}

export function resetGame(p) {
  // Clear all entities
  gameState.entities.forEach(entity => {
    if (entity.body) {
      World.remove(gameState.world, entity.body);
    }
  });
  
  gameState.entities = [];
  gameState.birds = [];
  gameState.pigs = [];
  gameState.blocks = [];
  gameState.currentBird = null;
  gameState.birdLaunched = false;
  gameState.score = 0;
  gameState.stars = 0;
  gameState.slingshotPower = 0.5;
  gameState.slingshotAngle = -45;
  
  // Reset test state
  gameState.testState = {
    framesSinceLaunch: 0,
    testStep: 0,
    testSubStep: 0,
    birdsFired: 0,
    pauseTestActive: false,
    pauseCount: 0
  };
  
  // Reinitialize level
  initializeGame(p);
}