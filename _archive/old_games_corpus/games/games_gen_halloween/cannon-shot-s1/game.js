const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { gameState, getGameState, GAME_PHASES, PLACEMENT_STATE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Cannon, Ball, Bucket, PlaceableObject, Obstacle } from './entities.js';
import { getLevelConfig, checkCannonUnlock, OBJECT_TYPES } from './levels.js';
import { setupPhysicsEvents, checkBallsInBuckets, checkLevelComplete } from './physics.js';
import { handleGameInput, handleKeyPress } from './input.js';
import { renderStartScreen, renderGame, renderPausedOverlay, renderGameOver } from './renderer.js';
import { runAIControl } from './ai.js';

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
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup physics events
    setupPhysicsEvents();
    
    // Create walls
    createWalls();
  };
  
  p.draw = function() {
    if (gameState.engine) {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        if (gameState.controlMode !== "HUMAN") {
          runAIControl(p);
        } else {
          handleGameInput(p);
        }
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
    
    // Phase controls
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.placementState = PLACEMENT_STATE.PLACING;
      initializeLevel(p);
      
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING, level: gameState.currentLevel },
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
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Game-specific controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      handleKeyPress(p);
    }
    
    return false;
  };
  
  function createWalls() {
    // Ground
    const ground = Bodies.rectangle(CANVAS_WIDTH/2, CANVAS_HEIGHT - 25, CANVAS_WIDTH, 50, {
      isStatic: true,
      label: 'ground'
    });
    World.add(gameState.world, ground);
    
    // Side walls
    const leftWall = Bodies.rectangle(-10, CANVAS_HEIGHT/2, 20, CANVAS_HEIGHT, {
      isStatic: true,
      label: 'wall'
    });
    const rightWall = Bodies.rectangle(CANVAS_WIDTH + 10, CANVAS_HEIGHT/2, 20, CANVAS_HEIGHT, {
      isStatic: true,
      label: 'wall'
    });
    
    World.add(gameState.world, [leftWall, rightWall]);
  }
  
  function initializeLevel(p) {
    // Clean up previous level
    gameState.balls.forEach(ball => ball.destroy());
    gameState.balls = [];
    gameState.buckets.forEach(bucket => bucket.destroy());
    gameState.buckets = [];
    gameState.placedObjects.forEach(obj => obj.destroy());
    gameState.placedObjects = [];
    gameState.availableObjects.forEach(obj => obj.destroy());
    gameState.availableObjects = [];
    gameState.entities = [];
    
    gameState.ballsFired = 0;
    gameState.levelComplete = false;
    gameState.levelFailed = false;
    gameState.testFrameCount = 0;
    gameState.testPhase = 0;
    
    // Get level config
    const config = getLevelConfig(gameState.currentLevel);
    
    // Create cannon
    const cannonSkin = gameState.currentCannonSkin;
    gameState.cannon = new Cannon(p, CANVAS_WIDTH/2, 50, cannonSkin);
    
    // Create buckets
    config.buckets.forEach(bConfig => {
      const bucket = new Bucket(p, bConfig.x, bConfig.y, bConfig.width, bConfig.height, bConfig.color, bConfig.required);
      gameState.buckets.push(bucket);
    });
    
    // Create obstacles
    if (config.obstacles) {
      config.obstacles.forEach(oConfig => {
        const obstacle = new Obstacle(p, oConfig.x, oConfig.y, oConfig.width, oConfig.height, oConfig.angle);
        gameState.entities.push(obstacle);
      });
    }
    
    // Create available objects for placement
    config.availableObjects.forEach(objConfig => {
      for (let i = 0; i < objConfig.count; i++) {
        const obj = new PlaceableObject(p, objConfig.type, 300 + i * 30, 150);
        gameState.availableObjects.push(obj);
      }
    });
    
    gameState.selectedObjectIndex = 0;
    
    // Check for cannon unlock
    const unlockedCannon = checkCannonUnlock(gameState.currentLevel);
    if (unlockedCannon > 0 && !gameState.unlockedCannons.includes(unlockedCannon)) {
      gameState.unlockedCannons.push(unlockedCannon);
      gameState.currentCannonSkin = unlockedCannon;
    }
  }
  
  function updateGame(p) {
    // Cannon firing logic
    if (gameState.placementState === PLACEMENT_STATE.FIRING) {
      gameState.cannonCooldown--;
      
      if (gameState.cannonCooldown <= 0 && gameState.ballsFired < gameState.ballsToFire) {
        const spawnPoint = gameState.cannon.getSpawnPoint();
        const ball = new Ball(p, spawnPoint.x, spawnPoint.y);
        
        // Add initial velocity
        Body.setVelocity(ball.body, {
          x: Math.cos(gameState.cannon.angle) * 5,
          y: Math.sin(gameState.cannon.angle) * 5
        });
        
        gameState.balls.push(ball);
        gameState.ballsFired++;
        gameState.cannonCooldown = 3;
      }
      
      if (gameState.ballsFired >= gameState.ballsToFire) {
        gameState.placementState = PLACEMENT_STATE.COMPLETE;
      }
    }
    
    // Check level completion
    if (gameState.placementState === PLACEMENT_STATE.COMPLETE && !gameState.levelComplete) {
      if (checkLevelComplete()) {
        gameState.levelComplete = true;
        
        p.logs.game_info.push({
          data: { event: "level_complete", level: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Handle level complete transition
    if (gameState.levelComplete) {
      if (p.keyIsDown(32)) { // SPACE
        gameState.currentLevel++;
        gameState.placementState = PLACEMENT_STATE.PLACING;
        initializeLevel(p);
        gameState.levelComplete = false;
      }
    }
    
    // Update ball bucket status
    if (gameState.balls.length > 0) {
      checkBallsInBuckets();
    }
  }
  
  function resetGame(p) {
    // Clean up
    gameState.balls.forEach(ball => ball.destroy());
    gameState.balls = [];
    gameState.buckets.forEach(bucket => bucket.destroy());
    gameState.buckets = [];
    gameState.placedObjects.forEach(obj => obj.destroy());
    gameState.placedObjects = [];
    gameState.availableObjects.forEach(obj => obj.destroy());
    gameState.availableObjects = [];
    gameState.entities.forEach(entity => {
      if (entity.destroy) entity.destroy();
    });
    gameState.entities = [];
    
    gameState.currentLevel = 1;
    gameState.placementState = PLACEMENT_STATE.PLACING;
    gameState.ballsFired = 0;
    gameState.levelComplete = false;
    gameState.levelFailed = false;
    gameState.gamePhase = GAME_PHASES.START;
    gameState.currentCannonSkin = 0;
    gameState.testFrameCount = 0;
    gameState.testPhase = 0;
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  gameState.testFrameCount = 0;
  gameState.testPhase = 0;
  
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
};

export { initializeLevel };