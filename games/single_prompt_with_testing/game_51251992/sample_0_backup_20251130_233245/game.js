// Main Game Loop and Logic
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Composite } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, initLogs } from './globals.js';
import { createPhysicsEngine, setupCollisionEvents } from './physics.js';
import { Player } from './entities.js';
import { initializeDungeon, updateDungeon } from './dungeon.js';
import { updateCamera } from './camera.js';
import { renderGame, renderStartScreen, renderPaused, renderGameOver } from './renderer.js';

const p5 = window.p5;

// Input State
const keys = {
  up: false, down: false, left: false, right: false,
  attack: false, dash: false
};

function resetGame(p) {
  // Clear physics world
  World.clear(gameState.world);
  Engine.clear(gameState.engine);
  
  // Re-init state
  gameState.entities = [];
  gameState.walls = [];
  gameState.bodiesToRemove = [];
  gameState.score = 0;
  gameState.dungeonY = 0;
  gameState.highestY = 0;
  gameState.camera = { x: 0, y: 0 };
  
  // Re-create core components
  initializeDungeon(p);
  
  // Spawn Player
  gameState.player = new Player(p, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, gameState.selectedClass);
}

function handleInput(p) {
  if (!gameState.player) return;
  
  let dx = 0;
  let dy = 0;
  
  // Automation Override
  if (gameState.controlMode === "TEST_1") {
    // Automated Movement Test
    dx = 1; 
  } else if (gameState.controlMode === "TEST_2") {
    // Suicide Test (Do nothing, let enemies kill)
    dx = 0; dy = 0;
  } else {
    // Human Control
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
  }
  
  // Normalize vector
  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx*dx + dy*dy);
    dx /= len;
    dy /= len;
  }
  
  gameState.player.move(dx, dy);
  
  // Actions
  if (keys.attack || (gameState.controlMode === "TEST_3" && p.frameCount % 60 === 0)) {
    gameState.player.attack();
  }
  
  if (keys.dash) {
    gameState.player.dash();
    keys.dash = false; // Trigger once
  }
}

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.noSmooth(); // Pixel art style
    
    initLogs(p);
    
    // Physics
    gameState.engine = createPhysicsEngine();
    gameState.world = gameState.engine.world;
    setupCollisionEvents(gameState.engine, p);
    
    // Initial Render
    p.background(0);
  };
  
  p.draw = function() {
    const now = Date.now();
    gameState.deltaTime = (now - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = now;
    gameState.frameCount = p.frameCount;
    
    // Game Phase Logic
    switch(gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        // 1. Physics Step
        Engine.update(gameState.engine, 1000/60);
        
        // 2. Game Logic
        handleInput(p);
        if (gameState.player) gameState.player.update();
        
        // Update Entities
        gameState.entities.forEach(e => e.update ? e.update() : null);
        
        // Cleanup dead entities
        if (gameState.bodiesToRemove.length > 0) {
          World.remove(gameState.world, gameState.bodiesToRemove);
          gameState.bodiesToRemove = [];
          
          // Remove from arrays
          gameState.entities = gameState.entities.filter(e => !e.markedForDeletion);
        }
        
        // World Gen & Camera
        updateDungeon(p);
        updateCamera();
        
        // 3. Render
        renderGame(p);
        break;
        
      case "PAUSED":
        renderGame(p); // Draw background game
        renderPaused(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    p.logs.inputs.push({ key: p.key, code: p.keyCode, type: "press", time: Date.now() });
    
    // Global Toggles
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
      else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    
    // Start Screen Inputs
    if (gameState.gamePhase === "START") {
      if (p.key === '1') gameState.selectedClass = "WARRIOR";
      if (p.key === '2') gameState.selectedClass = "WIZARD";
      if (p.keyCode === 13) { // ENTER
        resetGame(p);
        gameState.gamePhase = "PLAYING";
      }
    }
    
    // Game Over Inputs
    if (gameState.gamePhase.includes("GAME_OVER")) {
      if (p.key === 'r' || p.key === 'R') {
        gameState.gamePhase = "START";
      }
    }
    
    // Gameplay Inputs
    if (p.keyCode === 37 || p.key === 'a') keys.left = true;
    if (p.keyCode === 39 || p.key === 'd') keys.right = true;
    if (p.keyCode === 38 || p.key === 'w') keys.up = true;
    if (p.keyCode === 40 || p.key === 's') keys.down = true;
    if (p.key === 'z' || p.key === 'Z') keys.attack = true;
    if (p.keyCode === 32) keys.dash = true; // Space
    
    return false; // Prevent default browser scrolling
  };
  
  p.keyReleased = function() {
    if (p.keyCode === 37 || p.key === 'a') keys.left = false;
    if (p.keyCode === 39 || p.key === 'd') keys.right = false;
    if (p.keyCode === 38 || p.key === 'w') keys.up = false;
    if (p.keyCode === 40 || p.key === 's') keys.down = false;
    if (p.key === 'z' || p.key === 'Z') keys.attack = false;
    if (p.keyCode === 32) keys.dash = false;
    
    return false;
  };
});

window.gameInstance = gameInstance;

// Expose control mode setter for testing
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  console.log("Control Mode set to:", mode);
};