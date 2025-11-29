// game.js - Main game loop and initialization

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Events } = Matter;

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Bird, Pig, Block, Ground } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { createLevel1, setupNextBird, checkLevelComplete } from './level.js';
import { renderStartScreen, renderPausedOverlay, renderGameOver, renderUI, renderSlingshot } from './ui.js';
import { handleHumanInput, handleTestMode, launchBird } from './controls.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 1;
    
    gameState.engine = engine;
    gameState.world = world;
    
    // Setup collision handling
    setupCollisionHandling();
    
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
    
    // Initialize level
    createLevel1(p);
  };
  
  p.draw = function() {
    // Update physics
    if (gameState.gamePhase === "PLAYING") {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
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
    
    // Phase controls
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
      }
    }
    
    return false;
  };
  
  function updateGame(p) {
    // Handle input based on control mode
    if (gameState.controlMode === "HUMAN") {
      handleHumanInput(p);
    } else {
      handleTestMode(p);
    }
    
    // Update entities
    gameState.entities.forEach(entity => {
      if (entity.update) {
        entity.update();
      }
    });
    
    // Clean up destroyed entities
    gameState.pigs = gameState.pigs.filter(pig => !pig.destroyed);
    gameState.structures = gameState.structures.filter(block => !block.destroyed);
    
    // Check if bird is done flying
    if (gameState.birdInFlight && gameState.launchedBird) {
      const velocity = Math.sqrt(
        gameState.launchedBird.body.velocity.x * gameState.launchedBird.body.velocity.x +
        gameState.launchedBird.body.velocity.y * gameState.launchedBird.body.velocity.y
      );
      
      // Bird stopped or fell off screen
      if (velocity < 0.5 || gameState.launchedBird.body.position.y > 450) {
        gameState.birdInFlight = false;
        gameState.launchedBird = null;
        
        // Wait a moment then setup next bird
        setTimeout(() => {
          if (gameState.gamePhase === "PLAYING") {
            setupNextBird(p);
          }
        }, 1000);
      }
    }
    
    // Check level completion
    checkLevelComplete();
  }
  
  function renderGame(p) {
    // Sky background
    p.background(135, 206, 235);
    
    // Clouds
    drawClouds(p);
    
    // Render all entities
    gameState.entities.forEach(entity => {
      if (entity.render) {
        entity.render();
      }
    });
    
    // Render slingshot and trajectory
    renderSlingshot(p);
    
    // Render UI
    renderUI(p);
  }
  
  function drawClouds(p) {
    p.fill(255, 255, 255, 180);
    p.noStroke();
    
    // Static clouds for consistent look
    p.ellipse(100, 50, 60, 40);
    p.ellipse(130, 45, 50, 35);
    p.ellipse(110, 40, 40, 30);
    
    p.ellipse(350, 80, 70, 45);
    p.ellipse(380, 75, 60, 40);
    p.ellipse(360, 70, 50, 35);
    
    p.ellipse(500, 60, 65, 42);
    p.ellipse(530, 55, 55, 38);
  }
  
  function resetGame(p) {
    // Clear all bodies from world
    World.clear(gameState.world, false);
    
    // Reset game state
    gameState.score = 0;
    gameState.gamePhase = "START";
    gameState.pigsDestroyed = 0;
    gameState.starsEarned = 0;
    gameState.birdInFlight = false;
    gameState.abilityUsed = false;
    gameState.launchedBird = null;
    gameState.currentBird = null;
    gameState.slingshotAngle = -45;
    gameState.slingshotPower = 50;
    gameState.testCounter = 0;
    gameState.testTimer = 0;
    gameState.testBirdsLaunched = 0;
    
    // Recreate level
    createLevel1(p);
    
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching for testing
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Reset test counters
  gameState.testCounter = 0;
  gameState.testTimer = 0;
  gameState.testBirdsLaunched = 0;
};