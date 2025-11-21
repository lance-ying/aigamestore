// game.js - Main game logic with p5.js and Matter.js

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Events } = Matter;

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './entities.js';
import { setupCollisionHandling, cleanupCollisionHandling } from './physics.js';
import { generateLevel, cleanupLevel } from './levels.js';
import { createAIController } from './ai.js';

let aiController = null;
let keysPressed = {};

function initializeGame(p) {
  // Create player
  gameState.player = new Player(p, 100, 250);
  
  // Generate first level
  generateLevel(p, gameState.currentLevel);
  
  // Set checkpoint to start
  gameState.checkpoint = { x: 100, y: 250 };
  gameState.levelComplete = false;
  
  // Setup collision handling
  setupCollisionHandling();
}

function resetGame(p) {
  // Cleanup existing entities
  if (gameState.player) {
    gameState.player.cleanup();
    gameState.player = null;
  }
  
  cleanupLevel();
  cleanupCollisionHandling();
  
  // Reset game state
  gameState.score = 0;
  gameState.currentLevel = 0;
  gameState.levelComplete = false;
  gameState.cameraOffsetX = 0;
  
  // Clear Matter.js world
  World.clear(gameState.world, false);
  Engine.clear(gameState.engine);
  
  // Reset AI controller
  aiController = null;
  keysPressed = {};
}

function nextLevel(p) {
  // Cleanup current level
  if (gameState.player) {
    gameState.player.cleanup();
  }
  cleanupLevel();
  
  // Increment level
  gameState.currentLevel++;
  
  if (gameState.currentLevel >= gameState.maxLevels) {
    // Won the game
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.GAME_OVER_WIN, finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    // Load next level
    gameState.player = new Player(p, 100, 250);
    generateLevel(p, gameState.currentLevel);
    gameState.checkpoint = { x: 100, y: 250 };
    gameState.levelComplete = false;
    gameState.cameraOffsetX = 0;
  }
}

function updateGame(p) {
  // Handle AI or human input
  let inputs = { left: false, right: false, jump: false };
  
  if (gameState.controlMode !== 'HUMAN') {
    if (!aiController) {
      aiController = createAIController(gameState.controlMode);
    }
    inputs = aiController.getInputs();
  } else {
    inputs.left = keysPressed[37] || keysPressed[65]; // Left arrow or A
    inputs.right = keysPressed[39] || keysPressed[68]; // Right arrow or D
    inputs.jump = keysPressed[32] || keysPressed[87]; // Space or W
  }
  
  // Update player
  if (gameState.player) {
    if (inputs.left) {
      gameState.player.moveLeft();
    }
    if (inputs.right) {
      gameState.player.moveRight();
    }
    
    gameState.player.update();
  }
  
  // Update camera (follow player)
  if (gameState.player) {
    const center = gameState.player.getCenter();
    const targetOffsetX = center.x - CANVAS_WIDTH / 3;
    gameState.cameraOffsetX = Math.max(0, Math.min(targetOffsetX, gameState.levelWidth - CANVAS_WIDTH));
  }
  
  // Update collectibles
  gameState.collectibles.forEach(collectible => collectible.update());
  
  // Update entities (checkpoints, goal, etc.)
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update();
    }
  });
  
  // Check for level complete
  if (gameState.levelComplete) {
    setTimeout(() => {
      nextLevel(p);
    }, 1000);
    gameState.levelComplete = false; // Prevent multiple triggers
  }
}

function renderStartScreen(p) {
  p.background(40, 40, 60);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('TYPE:RIDER', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 220);
  p.textSize(20);
  p.text('A Journey Through Typography', CANVAS_WIDTH / 2, 130);
  
  // Description
  p.fill(180, 180, 200);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  const desc = 'Navigate two connected dots through levels\nmade of letters and symbols. Collect asterisks,\navoid spikes, and reach the end!';
  p.text(desc, CANVAS_WIDTH / 2, 200);
  
  // Controls
  p.fill(255, 255, 255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text('CONTROLS:', 150, 280);
  p.textSize(14);
  p.text('Arrow Keys / A,D : Move', 150, 305);
  p.text('Space / W : Jump (double jump)', 150, 325);
  p.text('ESC : Pause', 150, 345);
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  const alpha = Math.sin(p.frameCount * 0.1) * 50 + 200;
  p.fill(100, 255, 100, alpha);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
}

function renderGame(p) {
  // Background gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c = p.lerpColor(
      p.color(100, 150, 200),
      p.color(200, 220, 240),
      inter
    );
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Render platforms
  gameState.platforms.forEach(platform => platform.render(gameState.cameraOffsetX));
  
  // Render hazards
  gameState.hazards.forEach(hazard => hazard.render(gameState.cameraOffsetX));
  
  // Render blocks
  gameState.blocks.forEach(block => block.render(gameState.cameraOffsetX));
  
  // Render collectibles
  gameState.collectibles.forEach(collectible => collectible.render(gameState.cameraOffsetX));
  
  // Render other entities
  gameState.entities.forEach(entity => {
    if (entity.render) {
      entity.render(gameState.cameraOffsetX);
    }
  });
  
  // Render player
  if (gameState.player) {
    gameState.player.render(gameState.cameraOffsetX);
  }
  
  // UI
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, 10, 10);
  p.text(`Level: ${gameState.currentLevel + 1}/${gameState.maxLevels}`, 10, 35);
  
  // Level complete message
  if (gameState.levelComplete) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text('LEVEL COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}

function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(20);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function renderGameOver(p) {
  p.background(40, 40, 60);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'CONGRATULATIONS!' : 'GAME OVER', CANVAS_WIDTH / 2, 120);
  
  // Message
  p.fill(255);
  p.textSize(24);
  if (isWin) {
    p.text('You completed all levels!', CANVAS_WIDTH / 2, 180);
  } else {
    p.text('Better luck next time!', CANVAS_WIDTH / 2, 180);
  }
  
  // Score
  p.textSize(28);
  p.fill(255, 215, 0);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  
  // Restart prompt
  p.fill(200, 200, 200);
  p.textSize(20);
  const alpha = Math.sin(p.frameCount * 0.1) * 50 + 200;
  p.fill(200, 200, 200, alpha);
  p.text('Press R to restart', CANVAS_WIDTH / 2, 320);
}

// Create p5 instance
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
    
    // Initialize p.logs
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
    
    // Initialize game
    initializeGame(p);
  };
  
  p.draw = function() {
    // Update Matter.js physics
    Engine.update(gameState.engine, 1000 / 60);
    
    // Handle game phases
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
    
    keysPressed[p.keyCode] = true;
    
    // Handle phase controls
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
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
        initializeGame(p);
        gameState.gamePhase = GAME_PHASES.START;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Handle jump
    if ((p.keyCode === 32 || p.keyCode === 87) && 
        gameState.gamePhase === GAME_PHASES.PLAYING &&
        gameState.player) {
      gameState.player.jump();
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    keysPressed[p.keyCode] = false;
    
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;