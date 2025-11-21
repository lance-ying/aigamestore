// game.js - Main game logic

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CONTAINER_X, CONTAINER_Y, 
         CONTAINER_WIDTH, CONTAINER_HEIGHT, WALL_THICKNESS, FRUIT_TYPES } from './globals.js';
import { Fruit, PreviewFruit } from './entities.js';
import { setupCollisionHandling, processMerges } from './physics.js';
import { renderStartScreen, renderGame, renderPausedOverlay, renderGameOver } from './rendering.js';
import { setupControls, updateControls, updateTestMode } from './controls.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    gameState.engine = Engine.create();
    gameState.world = gameState.engine.world;
    gameState.world.gravity.y = 1;
    
    // Create container walls
    createContainerWalls();
    
    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup collision handling
    setupCollisionHandling(p);
    
    // Setup controls
    setupControls(p);
    
    // Initialize first preview fruit
    createNewPreviewFruit(p);
  };
  
  p.draw = function() {
    // Update physics
    if (gameState.gamePhase === "PLAYING") {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
    // Handle game state
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        updateTestMode(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGameOver(p);
        if (gameState.shouldReset) {
          resetGame(p);
        }
        break;
    }
  };
});

function createContainerWalls() {
  // Bottom wall
  const bottom = Bodies.rectangle(
    CONTAINER_X, 
    CONTAINER_Y + CONTAINER_HEIGHT / 2 + WALL_THICKNESS / 2,
    CONTAINER_WIDTH + WALL_THICKNESS * 2,
    WALL_THICKNESS,
    { isStatic: true, label: 'wall' }
  );
  
  // Left wall
  const left = Bodies.rectangle(
    CONTAINER_X - CONTAINER_WIDTH / 2 - WALL_THICKNESS / 2,
    CONTAINER_Y,
    WALL_THICKNESS,
    CONTAINER_HEIGHT + WALL_THICKNESS,
    { isStatic: true, label: 'wall' }
  );
  
  // Right wall
  const right = Bodies.rectangle(
    CONTAINER_X + CONTAINER_WIDTH / 2 + WALL_THICKNESS / 2,
    CONTAINER_Y,
    WALL_THICKNESS,
    CONTAINER_HEIGHT + WALL_THICKNESS,
    { isStatic: true, label: 'wall' }
  );
  
  World.add(gameState.world, [bottom, left, right]);
}

function createNewPreviewFruit(p) {
  // Determine next fruit type (weighted towards smaller fruits)
  let typeIndex;
  const rand = p.random();
  
  if (rand < 0.4) typeIndex = 0; // Cherry - 40%
  else if (rand < 0.7) typeIndex = 1; // Strawberry - 30%
  else if (rand < 0.85) typeIndex = 2; // Grape - 15%
  else if (rand < 0.95) typeIndex = 3; // Orange - 10%
  else typeIndex = 4; // Apple - 5%
  
  gameState.currentFruit = new PreviewFruit(p, typeIndex);
  gameState.nextFruitType = Math.floor(p.random(0, 5)); // Show next
  gameState.canDrop = true;
}

function dropFruit(p) {
  if (!gameState.canDrop || !gameState.currentFruit) return;
  
  // Create actual fruit at preview position
  const newFruit = new Fruit(
    p,
    gameState.currentFruit.x,
    gameState.currentFruit.y + 30,
    gameState.currentFruit.typeIndex
  );
  
  gameState.fruits.push(newFruit);
  
  // Log player action
  p.logs.player_info.push({
    screen_x: newFruit.body.position.x,
    screen_y: newFruit.body.position.y,
    game_x: newFruit.body.position.x,
    game_y: newFruit.body.position.y,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Reset for next fruit
  gameState.canDrop = false;
  gameState.dropCooldown = 60; // 1 second cooldown
  gameState.currentFruit = null;
}

function updateGame(p) {
  // Update controls
  updateControls(p);
  updateTestMode(p);
  
  // Handle drop
  if (gameState.shouldDrop) {
    dropFruit(p);
    gameState.shouldDrop = false;
  }
  
  // Update drop cooldown
  if (gameState.dropCooldown > 0) {
    gameState.dropCooldown--;
    if (gameState.dropCooldown === 0) {
      createNewPreviewFruit(p);
    }
  }
  
  // Update all fruits
  gameState.fruits.forEach(fruit => {
    fruit.update();
  });
  
  // Process any merges
  processMerges(p);
  
  // Check win condition (watermelon created)
  if (gameState.watermelonCreated) {
    gameState.gamePhase = "GAME_OVER_WIN";
    p.logs.game_info.push({
      data: { gamePhase: "GAME_OVER_WIN", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Check lose condition (fruit above danger line)
  if (gameState.gameOverCheck) {
    // Double check condition after a delay
    setTimeout(() => {
      let stillOver = false;
      gameState.fruits.forEach(fruit => {
        if (fruit.body.position.y < CONTAINER_Y - CONTAINER_HEIGHT / 2 + 60) {
          const velocity = Math.sqrt(
            Math.pow(fruit.body.velocity.x, 2) + 
            Math.pow(fruit.body.velocity.y, 2)
          );
          if (velocity < 0.5) {
            stillOver = true;
          }
        }
      });
      
      if (stillOver && gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({
          data: { gamePhase: "GAME_OVER_LOSE", score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }, 1000);
    
    gameState.gameOverCheck = false;
  }
}

function resetGame(p) {
  // Clear all fruits
  gameState.fruits.forEach(fruit => {
    fruit.destroy();
  });
  gameState.fruits = [];
  
  // Reset game state
  gameState.score = 0;
  gameState.gamePhase = "START";
  gameState.currentFruit = null;
  gameState.canDrop = true;
  gameState.dropCooldown = 0;
  gameState.watermelonCreated = false;
  gameState.gameOverCheck = false;
  gameState.shouldReset = false;
  gameState.shouldDrop = false;
  
  // Reset test state
  gameState.testState = {
    phase: 0,
    timer: 0,
    dropSequence: []
  };
  
  // Create new preview
  createNewPreviewFruit(p);
  
  // Log reset
  p.logs.game_info.push({
    data: { gamePhase: "START", reset: true },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Expose globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  gameState.testState = { phase: 0, timer: 0, dropSequence: [] };
  
  // Update button states
  ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' : 'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};