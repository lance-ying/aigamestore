// game.js - Main game logic

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events, Composite } = Matter;

import { gameState, OBJECT_TYPES, AI_BEHAVIORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Ragdoll, Cannon, Mine, Fan, Wall } from './entities.js';
import { setupPhysics, cleanupPhysics } from './physics.js';
import { renderStartScreen, renderPausedOverlay, renderGameOver, renderUI } from './ui.js';
import { runTestMode } from './testing.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0.5;
    
    gameState.engine = engine;
    gameState.world = world;
    
    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };
    
    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup physics collision detection
    setupPhysics();
    
    // Create ground
    const ground = Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 20, {
      label: 'ground',
      isStatic: true
    });
    World.add(world, ground);
  };
  
  p.draw = function() {
    // Update Matter.js physics
    Engine.update(gameState.engine, 1000 / 60);
    
    // Handle game phases
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
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
        break;
    }
  };
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase control keys
    if (p.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === "GAME_OVER_WIN" || 
          gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
        gameState.gamePhase = "START";
        p.logs.game_info.push({
          data: { gamePhase: "START" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === "PLAYING") {
      handleGameplayInput(p);
    }
    
    return false;
  };
});

function updateGame(p) {
  // Run automated tests if in test mode
  if (gameState.controlMode !== "HUMAN") {
    runTestMode(p);
  }
  
  // Update all entities
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update();
    }
  });
  
  // Remove exploded mines after delay
  gameState.entities = gameState.entities.filter(entity => {
    if (entity.type === 'mine' && entity.exploded) {
      // Keep for a few frames to show explosion
      if (p.frameCount % 30 === 0) {
        entity.destroy();
        return false;
      }
    }
    return true;
  });
  
  // Remove dead ragdolls
  gameState.entities = gameState.entities.filter(entity => {
    if (entity.type === 'ragdoll' && !entity.alive) {
      entity.destroy();
      return false;
    }
    return true;
  });
}

function renderGame(p) {
  // Background
  p.background(135, 206, 235); // Sky blue
  
  // Draw ground
  p.fill(80, 160, 80);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);
  
  // Render all entities
  gameState.entities.forEach(entity => {
    if (entity.render) {
      entity.render();
    }
  });
  
  // Render UI
  renderUI(p);
}

function handleGameplayInput(p) {
  // Quick select keys
  if (p.keyCode === 49) { // 1
    gameState.selectedObjectType = OBJECT_TYPES.RAGDOLL;
    gameState.deleteMode = false;
  }
  if (p.keyCode === 50) { // 2
    gameState.selectedObjectType = OBJECT_TYPES.CANNON;
    gameState.deleteMode = false;
  }
  if (p.keyCode === 51) { // 3
    gameState.selectedObjectType = OBJECT_TYPES.MINE;
    gameState.deleteMode = false;
  }
  if (p.keyCode === 52) { // 4
    gameState.selectedObjectType = OBJECT_TYPES.FAN;
    gameState.deleteMode = false;
  }
  if (p.keyCode === 53) { // 5
    gameState.selectedObjectType = OBJECT_TYPES.WALL;
    gameState.deleteMode = false;
  }
  
  // Delete mode toggle
  if (p.keyCode === 68) { // D
    gameState.deleteMode = !gameState.deleteMode;
  }
  
  // Clear all
  if (p.keyCode === 90) { // Z
    clearAllObjects();
  }
  
  // Arrow keys for cursor movement and property adjustment
  if (p.keyCode === 37) { // LEFT
    if (p.keyIsDown(16)) { // SHIFT - adjust properties
      adjustProperty(p, -0.1);
    } else {
      gameState.cursorX = Math.max(30, gameState.cursorX - 20);
    }
  }
  if (p.keyCode === 39) { // RIGHT
    if (p.keyIsDown(16)) { // SHIFT - adjust properties
      adjustProperty(p, 0.1);
    } else {
      gameState.cursorX = Math.min(CANVAS_WIDTH - 30, gameState.cursorX + 20);
    }
  }
  if (p.keyCode === 38) { // UP
    if (p.keyIsDown(16)) { // SHIFT - cycle AI behavior
      cycleAIBehavior();
    } else {
      gameState.cursorY = Math.max(100, gameState.cursorY - 20);
    }
  }
  if (p.keyCode === 40) { // DOWN
    if (p.keyIsDown(16)) { // SHIFT - cycle AI behavior
      cycleAIBehavior();
    } else {
      gameState.cursorY = Math.min(CANVAS_HEIGHT - 30, gameState.cursorY + 20);
    }
  }
  
  // Space to place object
  if (p.keyCode === 32) { // SPACE
    if (gameState.deleteMode) {
      deleteObjectAtCursor();
    } else {
      placeObject(p);
    }
  }
}

function adjustProperty(p, delta) {
  switch (gameState.selectedObjectType) {
    case OBJECT_TYPES.RAGDOLL:
      gameState.ragdollScale = Math.max(0.5, Math.min(2.0, gameState.ragdollScale + delta));
      break;
    case OBJECT_TYPES.CANNON:
      gameState.cannonForce = Math.max(0.5, Math.min(2.0, gameState.cannonForce + delta));
      break;
    case OBJECT_TYPES.MINE:
      gameState.mineRadius = Math.max(0.5, Math.min(2.0, gameState.mineRadius + delta));
      break;
    case OBJECT_TYPES.FAN:
      gameState.fanStrength = Math.max(0.5, Math.min(2.0, gameState.fanStrength + delta));
      break;
    case OBJECT_TYPES.WALL:
      gameState.wallLength = Math.max(0.5, Math.min(2.0, gameState.wallLength + delta));
      break;
  }
}

function cycleAIBehavior() {
  const behaviors = [AI_BEHAVIORS.EXPLORER, AI_BEHAVIORS.ATTACKER, AI_BEHAVIORS.SEEKER];
  const currentIndex = behaviors.indexOf(gameState.ragdollBehavior);
  const nextIndex = (currentIndex + 1) % behaviors.length;
  gameState.ragdollBehavior = behaviors[nextIndex];
}

export function placeObject(p) {
  let entity = null;
  
  switch (gameState.selectedObjectType) {
    case OBJECT_TYPES.RAGDOLL:
      entity = new Ragdoll(p, gameState.cursorX, gameState.cursorY, 
                          gameState.ragdollScale, gameState.ragdollBehavior);
      gameState.ragdollCount++;
      break;
      
    case OBJECT_TYPES.CANNON:
      entity = new Cannon(p, gameState.cursorX, gameState.cursorY, gameState.cannonForce);
      break;
      
    case OBJECT_TYPES.MINE:
      entity = new Mine(p, gameState.cursorX, gameState.cursorY, gameState.mineRadius);
      break;
      
    case OBJECT_TYPES.FAN:
      entity = new Fan(p, gameState.cursorX, gameState.cursorY, gameState.fanStrength);
      break;
      
    case OBJECT_TYPES.WALL:
      entity = new Wall(p, gameState.cursorX, gameState.cursorY, gameState.wallLength);
      break;
  }
  
  if (entity) {
    gameState.entities.push(entity);
    gameState.objectCount++;
    gameState.score++;
  }
}

function deleteObjectAtCursor() {
  const threshold = 40;
  
  for (let i = gameState.entities.length - 1; i >= 0; i--) {
    const entity = gameState.entities[i];
    let entityX, entityY;
    
    if (entity.body) {
      entityX = entity.body.position.x;
      entityY = entity.body.position.y;
    } else if (entity.torso) {
      entityX = entity.torso.position.x;
      entityY = entity.torso.position.y;
    } else {
      continue;
    }
    
    const dx = entityX - gameState.cursorX;
    const dy = entityY - gameState.cursorY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < threshold) {
      entity.destroy();
      gameState.entities.splice(i, 1);
      gameState.objectCount--;
      if (entity.type === 'ragdoll') {
        gameState.ragdollCount--;
      }
      break;
    }
  }
}

export function clearAllObjects() {
  gameState.entities.forEach(entity => {
    if (entity.destroy) {
      entity.destroy();
    }
  });
  
  gameState.entities = [];
  gameState.objectCount = 0;
  gameState.ragdollCount = 0;
}

function resetGame(p) {
  // Clear all objects
  clearAllObjects();
  
  // Reset game state
  gameState.score = 0;
  gameState.objectCount = 0;
  gameState.ragdollCount = 0;
  gameState.cursorX = CANVAS_WIDTH / 2;
  gameState.cursorY = CANVAS_HEIGHT / 2;
  gameState.deleteMode = false;
  gameState.selectedObjectType = OBJECT_TYPES.RAGDOLL;
  
  // Reset properties
  gameState.ragdollScale = 1.0;
  gameState.ragdollBehavior = AI_BEHAVIORS.EXPLORER;
  gameState.cannonForce = 1.0;
  gameState.mineRadius = 1.0;
  gameState.fanStrength = 1.0;
  gameState.wallLength = 1.0;
  
  // Clear physics world bodies (except ground)
  const allBodies = Composite.allBodies(gameState.world);
  allBodies.forEach(body => {
    if (body.label !== 'ground') {
      World.remove(gameState.world, body);
    }
  });
}

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button styles
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' : 'test_2_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};