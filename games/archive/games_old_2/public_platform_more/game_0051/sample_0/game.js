// game.js
const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { 
  gameState, 
  getGameState,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  GAME_PHASES,
  CONTROL_MODES,
  POWER_UPS
} from './globals.js';

import { 
  Ball, 
  Hole, 
  Platform, 
  Hazard,
  StickmanGolfer 
} from './entities.js';

import { setupCollisionHandling } from './physics.js';
import { loadCourse } from './courses.js';
import { updateAI } from './ai.js';
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
    world.gravity.y = 0.5;
    
    gameState.engine = engine;
    gameState.world = world;
    
    // Setup collision handling
    setupCollisionHandling(engine);
    
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
    
    // Add walls
    const wallThickness = 50;
    const floor = Bodies.rectangle(
      CANVAS_WIDTH / 2, 
      CANVAS_HEIGHT + wallThickness / 2, 
      CANVAS_WIDTH, 
      wallThickness,
      { isStatic: true, label: 'wall' }
    );
    const ceiling = Bodies.rectangle(
      CANVAS_WIDTH / 2, 
      -wallThickness / 2, 
      CANVAS_WIDTH, 
      wallThickness,
      { isStatic: true, label: 'wall' }
    );
    const leftWall = Bodies.rectangle(
      -wallThickness / 2, 
      CANVAS_HEIGHT / 2, 
      wallThickness, 
      CANVAS_HEIGHT,
      { isStatic: true, label: 'wall' }
    );
    const rightWall = Bodies.rectangle(
      CANVAS_WIDTH + wallThickness / 2, 
      CANVAS_HEIGHT / 2, 
      wallThickness, 
      CANVAS_HEIGHT,
      { isStatic: true, label: 'wall' }
    );
    
    World.add(world, [floor, ceiling, leftWall, rightWall]);
  };
  
  p.draw = function() {
    // Update Matter.js physics
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
    
    // Phase control keys
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
      initializeGame(p);
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
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
        gameState.gamePhase = GAME_PHASES.START;
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === CONTROL_MODES.HUMAN) {
      handleGameplayInput(p);
    }
    
    return false;
  };
  
  function handleGameplayInput(p) {
    // Adjust angle
    if (p.keyCode === 37) { // Left arrow
      gameState.shotAngle = Math.max(-180, gameState.shotAngle - 5);
    }
    if (p.keyCode === 39) { // Right arrow
      gameState.shotAngle = Math.min(180, gameState.shotAngle + 5);
    }
    
    // Adjust power
    if (p.keyCode === 38) { // Up arrow
      gameState.shotPower = Math.min(100, gameState.shotPower + 5);
    }
    if (p.keyCode === 40) { // Down arrow
      gameState.shotPower = Math.max(10, gameState.shotPower - 5);
    }
    
    // Power-ups
    if (p.keyCode === 83 && gameState.powerUps.sticky > 0 && !gameState.ballInMotion) { // S
      gameState.activePowerUp = POWER_UPS.STICKY;
    }
    if (p.keyCode === 87 && gameState.powerUps.boost > 0 && !gameState.ballInMotion) { // W
      gameState.activePowerUp = POWER_UPS.BOOST;
    }
    
    // Take shot
    if (p.keyCode === 32 && !gameState.ballInMotion && gameState.ball) { // SPACE
      gameState.ball.shoot(gameState.shotAngle, gameState.shotPower);
      if (gameState.player) {
        gameState.player.startSwing();
      }
    }
  }
  
  function initializeGame(p) {
    // Clear existing entities
    gameState.entities = [];
    gameState.obstacles = [];
    
    // Clear all non-wall bodies from world
    const bodiesToRemove = gameState.world.bodies.filter(body => 
      body.label !== 'wall'
    );
    bodiesToRemove.forEach(body => World.remove(gameState.world, body));
    
    // Load course
    const courseData = loadCourse(p, gameState.currentCourse);
    
    // Create ball
    gameState.ball = new Ball(p, courseData.ballStart.x, courseData.ballStart.y);
    gameState.startPosition = courseData.ballStart;
    gameState.entities.push(gameState.ball);
    
    // Create hole
    const hole = new Hole(p, courseData.holePos.x, courseData.holePos.y);
    gameState.holePosition = courseData.holePos;
    gameState.entities.push(hole);
    
    // Create stickman golfer
    gameState.player = new StickmanGolfer(
      p, 
      courseData.ballStart.x - 30, 
      courseData.ballStart.y - 15
    );
    
    // Add platforms and hazards
    gameState.obstacles = [...courseData.platforms, ...courseData.hazards];
    
    // Reset game state
    gameState.strokes = 0;
    gameState.ballInMotion = false;
    gameState.shotAngle = -45;
    gameState.shotPower = 50;
    gameState.aimingVisuals.angle = -45;
    gameState.aimingVisuals.power = 50;
    gameState.activePowerUp = null;
    gameState.testState = {
      shotCount: 0,
      lastShotTime: Date.now(),
      testPhase: 0
    };
  }
  
  function updateGame(p) {
    // Update aiming visuals
    gameState.aimingVisuals.angle = gameState.shotAngle;
    gameState.aimingVisuals.power = gameState.shotPower;
    
    // Update AI
    updateAI(p);
    
    // Update all entities
    gameState.entities.forEach(entity => {
      if (entity.update) entity.update();
    });
    
    gameState.obstacles.forEach(obstacle => {
      if (obstacle.update) obstacle.update();
    });
    
    if (gameState.player) {
      gameState.player.update();
    }
    
    // Check for game over (max strokes)
    if (gameState.strokes >= gameState.maxStrokes && !gameState.ballInMotion) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.GAME_OVER_LOSE },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function resetGame(p) {
    // Clear entities
    gameState.entities = [];
    gameState.obstacles = [];
    
    // Clear all non-wall bodies
    const bodiesToRemove = gameState.world.bodies.filter(body => 
      body.label !== 'wall'
    );
    bodiesToRemove.forEach(body => World.remove(gameState.world, body));
    
    // Reset state
    gameState.ball = null;
    gameState.player = null;
    gameState.currentCourse = 0;
    gameState.strokes = 0;
    gameState.ballInMotion = false;
    gameState.shotAngle = -45;
    gameState.shotPower = 50;
    gameState.activePowerUp = null;
    gameState.powerUps.sticky = 3;
    gameState.powerUps.boost = 3;
    gameState.coursesCompleted = 0;
    gameState.testState = {
      shotCount: 0,
      lastShotTime: 0,
      testPhase: 0
    };
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  if (CONTROL_MODES[mode]) {
    gameState.controlMode = mode;
    
    // Update button states
    document.querySelectorAll('.control-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const buttonId = mode === 'HUMAN' ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`;
    const button = document.getElementById(buttonId);
    if (button) {
      button.classList.add('active');
    }
    
    // Reset test state when switching modes
    gameState.testState = {
      shotCount: 0,
      lastShotTime: Date.now(),
      testPhase: 0
    };
  }
};