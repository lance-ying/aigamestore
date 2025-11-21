const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Vehicle, AIOpponent } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { createTrack, renderTrack } from './track.js';
import { renderStartScreen, renderPausedOverlay, renderGameOver, renderHUD } from './ui.js';
import { handleKeyPressed, handleKeyReleased, processPlayerInput, processAutomatedInput } from './controls.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0; // Top-down view, no gravity
    
    gameState.engine = engine;
    gameState.world = world;
    
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
    setupCollisionHandling(engine, p);
    
    // Initialize game
    initializeGame(p);
  };
  
  p.draw = function() {
    // Update physics
    if (gameState.gamePhase === "PLAYING") {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
    // Game loop based on phase
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
    const shouldReset = handleKeyPressed(p);
    if (shouldReset) {
      resetGame(p);
    }
    return false;
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
    return false;
  };
});

function initializeGame(p) {
  // Clear entities
  gameState.entities = [];
  gameState.aiOpponents = [];
  
  // Create track
  createTrack(p);
  
  // Create player at start position
  const startPos = gameState.trackPath[0];
  const player = new Vehicle(p, startPos.x, startPos.y, [0, 200, 255], true);
  gameState.player = player;
  gameState.entities.push(player);
  
  // Create AI opponents
  const aiColors = [
    [255, 0, 0],
    [255, 150, 0],
    [200, 0, 200]
  ];
  
  for (let i = 0; i < 3; i++) {
    const offsetX = (i + 1) * 30;
    const ai = new AIOpponent(
      p,
      startPos.x - offsetX,
      startPos.y + (i - 1) * 25,
      aiColors[i],
      0.8 + i * 0.15
    );
    gameState.aiOpponents.push(ai);
    gameState.entities.push(ai);
  }
  
  // Reset game state
  gameState.score = 0;
  gameState.currentCheckpoint = 0;
  gameState.lapCount = 0;
  gameState.playerFinished = false;
  gameState.aiFinishTimes = [];
  gameState.boostCharges = 3;
  gameState.driftScore = 0;
  gameState.raceStartTime = 0;
  gameState.raceEndTime = 0;
}

function updateGame(p) {
  // Process input based on control mode
  if (gameState.controlMode === "HUMAN") {
    processPlayerInput();
  } else {
    processAutomatedInput(p);
  }
  
  // Update player
  if (gameState.player) {
    gameState.player.update();
  }
  
  // Update AI opponents
  for (let ai of gameState.aiOpponents) {
    ai.updateAI();
    ai.update();
  }
  
  // Update camera to follow player
  if (gameState.player) {
    gameState.cameraOffset.x = gameState.player.body.position.x - CANVAS_WIDTH / 2;
    gameState.cameraOffset.y = gameState.player.body.position.y - CANVAS_HEIGHT / 2;
  }
}

function renderGame(p) {
  // Background - grass
  p.background(80, 140, 60);
  
  const offsetX = gameState.cameraOffset.x;
  const offsetY = gameState.cameraOffset.y;
  
  // Render track
  renderTrack(p, offsetX, offsetY);
  
  // Render walls
  for (let wall of gameState.walls) {
    wall.render(p, offsetX, offsetY);
  }
  
  // Render checkpoints
  for (let checkpoint of gameState.checkpoints) {
    checkpoint.render(p, offsetX, offsetY);
  }
  
  // Render AI opponents
  for (let ai of gameState.aiOpponents) {
    ai.render(p, offsetX, offsetY);
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p, offsetX, offsetY);
  }
  
  // Render HUD
  renderHUD(p);
}

function resetGame(p) {
  // Clear world
  World.clear(gameState.world, false);
  Engine.clear(gameState.engine);
  
  // Re-initialize
  gameState.gamePhase = "START";
  initializeGame(p);
  
  p.logs.game_info.push({
    data: { gamePhase: "START", action: "reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Expose globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
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
};