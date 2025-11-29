// game.js - Main game file with p5.js instance mode and Matter.js integration

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Body, Events } = Matter;

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  GAME_PHASES,
  CONTROL_MODES,
  getGameState 
} from './globals.js';

import { Player } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { handleInput } from './input.js';
import { createLevel } from './level.js';
import { 
  renderStartScreen, 
  renderGame, 
  renderPausedOverlay, 
  renderGameOver 
} from './rendering.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0.8;
    
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
    setupCollisionHandling(engine);
    
    // Initialize game
    initializeGame(p);
  };
  
  p.draw = function() {
    // Update Matter.js physics engine only when playing
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
    // Update and render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        updateGame(p);
        renderGame(p);
        break;
        
      case GAME_PHASES.PAUSED:
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
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
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
      startGame(p);
    }
    
    if (p.keyCode === 27) { // ESC - Pause/Unpause
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
      }
    }
    
    // Gameplay keys
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.keyCode === 32) { // SPACE - Jump
        if (gameState.player) {
          gameState.player.jump();
        }
      }
      
      if (p.keyCode === 90) { // Z - Karate Kick
        if (gameState.player) {
          gameState.player.karateKick();
        }
      }
    }
    
    return false;
  };
});

function initializeGame(p) {
  // Create level
  createLevel(p);
  
  // Create player
  gameState.player = new Player(p, 100, 300);
  
  // Log initial player position
  p.logs.player_info.push({
    screen_x: gameState.player.body.position.x,
    screen_y: gameState.player.body.position.y,
    game_x: gameState.player.body.position.x,
    game_y: gameState.player.body.position.y,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.testFrameCount = 0;
  gameState.testPhase = 0;
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.PLAYING },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function updateGame(p) {
  // Handle input based on control mode
  handleInput(p);
  
  // Update player
  if (gameState.player) {
    gameState.player.update();
  }
  
  // Update enemies
  gameState.enemies.forEach(enemy => {
    if (enemy.update) {
      enemy.update();
    }
  });
  
  // Update coins
  gameState.coins.forEach(coin => {
    coin.update();
  });
  
  // Update checkpoints
  gameState.checkpoints.forEach(checkpoint => {
    checkpoint.update();
  });
  
  // Update swing points
  gameState.swingPoints.forEach(swing => {
    swing.update();
  });
  
  // Update portal
  if (gameState.portal) {
    gameState.portal.update();
  }
}

function resetGame(p) {
  // Clear Matter.js world
  World.clear(gameState.world, false);
  
  // Reset game state
  gameState.score = 0;
  gameState.health = gameState.maxHealth;
  gameState.abilities = {
    doubleJump: false,
    karateKick: false,
    hookSwing: false
  };
  gameState.lastCheckpoint = { x: 100, y: 300 };
  gameState.invincible = false;
  gameState.invincibilityTimer = 0;
  gameState.testFrameCount = 0;
  gameState.testPhase = 0;
  
  // Reinitialize game
  initializeGame(p);
  
  // Return to start screen
  gameState.gamePhase = GAME_PHASES.START;
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.START, event: "reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  gameState.testFrameCount = 0;
  gameState.testPhase = 0;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === CONTROL_MODES.HUMAN) {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === CONTROL_MODES.TEST_1) {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === CONTROL_MODES.TEST_2) {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  console.log(`Control mode switched to: ${mode}`);
};