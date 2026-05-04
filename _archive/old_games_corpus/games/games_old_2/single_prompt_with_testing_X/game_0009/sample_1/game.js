// game.js - Main game file with p5.js instance

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies } = Matter;

import { 
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_FPS,
  GRAVITY,
  GROUND_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  LEVELS,
  BALL_SKINS,
  THEMES
} from './globals.js';

import { Ground, Wall } from './entities.js';
import { setupPhysicsEvents } from './physics.js';
import { loadLevel } from './level.js';
import { handleKeyPressed, handleContinuousInput } from './input.js';
import { updateGameplay, handleTestMode } from './gameplay.js';
import { 
  renderStartScreen, 
  renderGame, 
  renderPausedOverlay, 
  renderGameOver 
} from './render.js';

let gameInstance = new p5(p => {
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    p.rectMode(p.CENTER);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = GRAVITY;
    
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
    
    // Setup physics events
    setupPhysicsEvents();
    
    // Initialize game
    initializeGame(p);
  };
  
  p.draw = function() {
    // Update Matter.js physics
    Engine.update(gameState.engine, 1000 / TARGET_FPS);
    
    // Handle continuous input
    handleContinuousInput(p);
    
    // Update and render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        if (gameState.controlMode !== "HUMAN") {
          handleTestMode(p);
        }
        updateGameplay(p);
        renderGame(p);
        break;
        
      case PHASE_PAUSED:
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    
    // Additional win/lose screen controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
        // Progress to next level
        gameState.currentLevel++;
        if (gameState.currentLevel >= LEVELS.length) {
          gameState.currentLevel = LEVELS.length - 1; // Stay at max level
        }
        startLevel(p);
      } else if (gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        // Retry current level
        startLevel(p);
      }
    }
    
    return false;
  };
});

function initializeGame(p) {
  // Create ground
  const theme = THEMES[gameState.selectedThemeIndex];
  const ground = new Ground(
    p,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT - GROUND_HEIGHT / 2,
    CANVAS_WIDTH,
    GROUND_HEIGHT,
    theme.ground
  );
  gameState.ground = ground;
  gameState.entities.push(ground);
  
  // Create walls
  const leftWall = new Wall(p, -10, CANVAS_HEIGHT / 2, 20, CANVAS_HEIGHT);
  const rightWall = new Wall(p, CANVAS_WIDTH + 10, CANVAS_HEIGHT / 2, 20, CANVAS_HEIGHT);
  gameState.walls = [leftWall, rightWall];
  gameState.entities.push(leftWall, rightWall);
  
  // Load first level
  loadLevel(p, gameState.currentLevel);
}

function startLevel(p) {
  // Clear balls
  gameState.balls.forEach(ball => ball.destroy());
  gameState.balls = [];
  
  // Reset test mode variables
  gameState.testBallDropTimer = 0;
  gameState.testBallsDropped = 0;
  
  // Load level
  loadLevel(p, gameState.currentLevel);
  
  // Set game phase
  gameState.gamePhase = PHASE_PLAYING;
  
  p.logs.game_info.push({
    data: { 
      gamePhase: PHASE_PLAYING,
      level: gameState.currentLevel 
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function resetGame(p) {
  // Clear all entities
  gameState.balls.forEach(ball => ball.destroy());
  gameState.glasses.forEach(glass => glass.destroy());
  gameState.obstacles.forEach(obstacle => obstacle.destroy());
  
  gameState.balls = [];
  gameState.glasses = [];
  gameState.obstacles = [];
  gameState.entities = [];
  
  // Reset to first level (keep progress)
  gameState.currentLevel = 0;
  gameState.testBallDropTimer = 0;
  gameState.testBallsDropped = 0;
  
  // Reinitialize
  initializeGame(p);
}

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const buttonId = mode === "HUMAN" ? "humanModeBtn" : 
                   mode === "TEST_1" ? "test_1_ModeBtn" : 
                   "test_2_ModeBtn";
  document.getElementById(buttonId).classList.add('active');
  
  // Reset test variables
  gameState.testBallDropTimer = 0;
  gameState.testBallsDropped = 0;
};

// Expose game instance globally
window.gameInstance = gameInstance;