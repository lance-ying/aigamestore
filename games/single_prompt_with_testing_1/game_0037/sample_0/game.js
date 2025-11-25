// game.js - Main game file
const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Events } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, GAME_PHASES } from './globals.js';
import { Player } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { generateLevel } from './level.js';
import { handleControls, handleJumpPress } from './controls.js';
import { renderStartScreen, renderPausedOverlay, renderGameOver, renderHUD } from './ui.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    gameState.engine = Engine.create();
    gameState.world = gameState.engine.world;
    gameState.world.gravity.y = GRAVITY;
    
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
    setupCollisionHandling();
  };
  
  p.draw = function() {
    // Update Matter.js physics
    if (gameState.gamePhase === 'PLAYING') {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
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
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase controls
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
      initializeGame(p);
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (p.keyCode === 27) { // ESC
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
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame(p);
      }
    }
    
    // Track key states
    gameState.keys[p.keyCode] = true;
    
    // Jump handling
    if (p.keyCode === 32 || p.keyCode === 87) { // SPACE or W
      handleJumpPress(p);
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    gameState.keys[p.keyCode] = false;
    return false;
  };
});

function initializeGame(p) {
  // Clear existing entities
  if (gameState.world) {
    World.clear(gameState.world);
  }
  
  // Reset game state
  gameState.entities = [];
  gameState.enemies = [];
  gameState.rings = [];
  gameState.platforms = [];
  gameState.score = 0;
  gameState.ringCount = 0;
  gameState.lives = 3;
  gameState.camera = { x: 0, y: 0 };
  gameState.invincibilityTimer = 0;
  gameState.lastLoggedX = 0;
  gameState.lastLoggedY = 0;
  
  // Create player
  gameState.player = new Player(p, 100, 200);
  gameState.entities.push(gameState.player);
  
  // Generate level
  const level = generateLevel(p);
  gameState.platforms = level.platforms;
  gameState.rings = level.rings;
  gameState.enemies = level.enemies;
  gameState.goalPost = level.goalPost;
  
  gameState.entities.push(...gameState.platforms);
  gameState.entities.push(...gameState.rings);
  gameState.entities.push(...gameState.enemies);
  gameState.entities.push(gameState.goalPost);
  gameState.entities.push(...level.springs);
  
  // Log player initial position
  p.logs.player_info.push({
    screen_x: gameState.player.body.position.x,
    screen_y: gameState.player.body.position.y,
    game_x: gameState.player.body.position.x,
    game_y: gameState.player.body.position.y,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function updateGame(p) {
  // Handle controls
  handleControls(p);
  
  // Update camera to follow player
  if (gameState.player) {
    const targetCameraX = gameState.player.body.position.x - CANVAS_WIDTH / 3;
    gameState.camera.x = Math.max(0, Math.min(targetCameraX, gameState.levelWidth - CANVAS_WIDTH));
  }
  
  // Update invincibility timer
  if (gameState.invincibilityTimer > 0) {
    gameState.invincibilityTimer--;
  }
  
  // Update all entities
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update();
    }
  });
}

function renderGame(p) {
  // Sky background
  const gradient = p.drawingContext.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#98D8E8');
  p.drawingContext.fillStyle = gradient;
  p.drawingContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw clouds
  p.noStroke();
  for (let i = 0; i < 10; i++) {
    const x = (i * 150 - gameState.camera.x * 0.3 + p.frameCount * 0.2) % (CANVAS_WIDTH + 100);
    const y = 50 + (i % 3) * 40;
    p.fill(255, 255, 255, 150);
    p.ellipse(x, y, 60, 30);
    p.ellipse(x + 20, y, 50, 25);
    p.ellipse(x - 20, y, 50, 25);
  }
  
  // Draw all entities
  gameState.entities.forEach(entity => {
    if (entity.render) {
      entity.render();
    }
  });
  
  // Draw HUD
  renderHUD(p);
  
  // Invincibility flicker
  if (gameState.invincibilityTimer > 0 && gameState.invincibilityTimer % 10 < 5) {
    // Player flickers during invincibility (already handled in entity render)
  }
}

function resetGame(p) {
  // Clear world
  if (gameState.world) {
    World.clear(gameState.world);
  }
  
  gameState.gamePhase = GAME_PHASES.START;
  gameState.entities = [];
  gameState.player = null;
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.START },
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
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const btnId = mode.toLowerCase() + 'ModeBtn';
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.add('active');
  }
};