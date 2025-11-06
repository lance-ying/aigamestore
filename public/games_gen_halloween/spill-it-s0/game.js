// game.js - Main game logic with p5.js and Matter.js

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { 
  gameState, 
  GAME_PHASES, 
  CONTROL_MODES,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  LEVELS,
  getGameState
} from './globals.js';

import { Ball, Glass, Platform } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { handleInput, updateTestMode } from './controls.js';
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
    p.rectMode(p.CENTER);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 1;
    
    gameState.engine = engine;
    gameState.world = world;
    
    // Setup collision handling
    setupCollisionHandling(p);
    
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
    
    // Create boundaries
    createBoundaries();
  };
  
  p.draw = function() {
    // Update Matter.js physics only when playing
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
    // Update game based on phase
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
    
    // Handle phase controls
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
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
          gameState.gamePhase === GAME_PHASES.PAUSED) {
        resetGame(p);
      }
    }
    
    // Handle gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = handleInput(p, p.keyCode);
      if (action && action.action === 'dropBall') {
        dropBall(p);
      }
    }
    
    return false;
  };
  
  function createBoundaries() {
    // Ground
    const ground = Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT + 25, CANVAS_WIDTH, 50, {
      label: 'boundary',
      isStatic: true
    });
    
    // Walls
    const leftWall = Bodies.rectangle(-25, CANVAS_HEIGHT / 2, 50, CANVAS_HEIGHT, {
      label: 'boundary',
      isStatic: true
    });
    
    const rightWall = Bodies.rectangle(CANVAS_WIDTH + 25, CANVAS_HEIGHT / 2, 50, CANVAS_HEIGHT, {
      label: 'boundary',
      isStatic: true
    });
    
    World.add(gameState.world, [ground, leftWall, rightWall]);
  }
  
  function startGame(p) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.testFrameCounter = 0;
    
    // Load current level
    loadLevel(p, gameState.currentLevel);
    
    p.logs.game_info.push({
      data: { 
        gamePhase: GAME_PHASES.PLAYING,
        level: gameState.currentLevel
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function loadLevel(p, levelNumber) {
    // Clear existing entities
    clearEntities();
    
    const levelData = LEVELS[levelNumber - 1];
    if (!levelData) {
      console.error("Level not found:", levelNumber);
      return;
    }
    
    // Set ball count
    gameState.ballsRemaining = levelData.ballsAllowed;
    gameState.totalBalls = levelData.ballsAllowed;
    gameState.glassesToppledCount = 0;
    gameState.coins = 0;
    
    // Create platforms
    levelData.platforms.forEach(platData => {
      const platform = new Platform(
        p,
        platData.x,
        platData.y,
        platData.width,
        platData.height,
        platData.isStatic !== undefined ? platData.isStatic : true,
        platData.angle || 0
      );
      gameState.platforms.push(platform);
      gameState.entities.push(platform);
    });
    
    // Create glasses
    levelData.glasses.forEach(glassData => {
      const glass = new Glass(
        p,
        glassData.x,
        glassData.y,
        glassData.width,
        glassData.height
      );
      gameState.glasses.push(glass);
      gameState.entities.push(glass);
    });
  }
  
  function clearEntities() {
    // Remove all entities from Matter world
    gameState.balls.forEach(ball => ball.remove());
    gameState.glasses.forEach(glass => glass.remove());
    gameState.platforms.forEach(platform => platform.remove());
    
    // Clear arrays
    gameState.balls = [];
    gameState.glasses = [];
    gameState.platforms = [];
    gameState.entities = [];
  }
  
  function dropBall(p) {
    // Check cooldown
    const currentTime = Date.now();
    if (currentTime - gameState.lastBallDropTime < gameState.ballDropCooldown) {
      return;
    }
    
    if (gameState.ballsRemaining <= 0) {
      return;
    }
    
    // Create ball at top center
    const ball = new Ball(p, CANVAS_WIDTH / 2, 30);
    gameState.balls.push(ball);
    gameState.entities.push(ball);
    gameState.ballsRemaining--;
    gameState.lastBallDropTime = currentTime;
    
    p.logs.game_info.push({
      data: { 
        event: 'ball_dropped',
        ballsRemaining: gameState.ballsRemaining
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function updateGame(p) {
    // Check for test mode actions
    const testAction = updateTestMode(p);
    if (testAction && testAction.action === 'dropBall') {
      dropBall(p);
    }
    
    // Update all entities
    gameState.entities.forEach(entity => entity.update());
    
    // Check win condition - all glasses toppled
    const allGlassesToppled = gameState.glasses.every(glass => glass.toppled);
    
    if (allGlassesToppled && gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Win!
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      
      // Calculate coins earned (more balls remaining = more coins)
      gameState.coins = Math.floor(10 + gameState.ballsRemaining * 5);
      gameState.totalCoins += gameState.coins;
      
      // Progress to next level
      if (gameState.currentLevel < gameState.maxLevel) {
        gameState.currentLevel++;
      }
      
      p.logs.game_info.push({
        data: { 
          gamePhase: GAME_PHASES.GAME_OVER_WIN,
          coinsEarned: gameState.coins,
          totalCoins: gameState.totalCoins
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      return;
    }
    
    // Check lose condition - no balls left and not all glasses toppled
    if (gameState.ballsRemaining === 0 && gameState.balls.length > 0) {
      // Check if all balls have settled
      const allBallsSettled = gameState.balls.every(ball => ball.settled);
      
      if (allBallsSettled && !allGlassesToppled) {
        // Lose!
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        
        p.logs.game_info.push({
          data: { 
            gamePhase: GAME_PHASES.GAME_OVER_LOSE,
            glassesToppled: gameState.glassesToppledCount,
            totalGlasses: gameState.glasses.length
          },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  function resetGame(p) {
    clearEntities();
    gameState.gamePhase = GAME_PHASES.START;
    gameState.testFrameCounter = 0;
    gameState.lastBallDropTime = 0;
    
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  if (CONTROL_MODES[mode]) {
    gameState.controlMode = mode;
    gameState.testFrameCounter = 0;
    
    // Update button states
    Object.keys(CONTROL_MODES).forEach(key => {
      const btn = document.getElementById(`${key.toLowerCase()}ModeBtn`);
      if (btn) {
        if (key === mode) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });
    
    console.log("Control mode set to:", mode);
  }
};