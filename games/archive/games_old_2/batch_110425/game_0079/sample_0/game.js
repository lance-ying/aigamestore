// game.js - Main game logic with p5.js and Matter.js integration
const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, DELIVERY_TYPES } from './globals.js';
import { Batsman, Ball, Bowler, FieldZone } from './entities.js';
import { setupPhysics, checkBatBallContact } from './physics.js';
import { renderStartScreen, renderGame, renderPausedOverlay, renderGameOver } from './ui.js';
import { handleKeyPressed, updateTestAutomation, resetGame } from './input.js';

let gameInstance = new p5(p => {
  let deliveryTimer = 0;
  let deliveryDelay = 180; // 3 seconds between deliveries
  
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
    
    // Setup physics events
    setupPhysics(p);
    
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
    
    // Create ground and boundaries
    createEnvironment();
    
    // Initialize field zones
    initializeFieldZones(p);
  };
  
  p.draw = function() {
    // Update physics
    Engine.update(gameState.engine, 1000 / 60);
    
    // Update test automation
    updateTestAutomation(p);
    
    // Update particles
    gameState.particles = gameState.particles.filter(particle => {
      const alive = particle.update();
      return alive;
    });
    
    // Game phase logic
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        updatePlaying(p);
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
    return handleKeyPressed(p);
  };
  
  function updatePlaying(p) {
    // Initialize game entities if needed
    if (!gameState.player) {
      initializeGame(p);
    }
    
    // Update entities
    if (gameState.player) {
      gameState.player.update();
    }
    
    if (gameState.bowler) {
      gameState.bowler.update();
    }
    
    if (gameState.ball) {
      const stillInPlay = gameState.ball.update();
      if (!stillInPlay) {
        gameState.ballInPlay = false;
      }
      
      // Check bat-ball contact
      checkBatBallContact(p);
    }
    
    // Delivery timer
    if (!gameState.ballInPlay && gameState.wickets > 0 && 
        gameState.gamePhase === GAME_PHASES.PLAYING) {
      deliveryTimer++;
      
      if (deliveryTimer >= deliveryDelay) {
        bowlDelivery(p);
        deliveryTimer = 0;
      }
    }
  }
  
  function initializeGame(p) {
    // Create batsman
    const batsman = new Batsman(p, CANVAS_WIDTH / 2, 320);
    gameState.player = batsman;
    gameState.entities.push(batsman);
    
    // Create bowler
    const bowler = new Bowler(p, CANVAS_WIDTH / 2, 80);
    gameState.bowler = bowler;
    gameState.entities.push(bowler);
    
    // Log player creation
    p.logs.player_info.push({
      screen_x: batsman.x,
      screen_y: batsman.y,
      game_x: batsman.x,
      game_y: batsman.y,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function bowlDelivery(p) {
    // Choose random delivery type
    const types = Object.values(DELIVERY_TYPES);
    const deliveryType = types[Math.floor(Math.random() * types.length)];
    
    // Calculate speed based on type
    let speed = 6 + Math.random() * 2;
    if (deliveryType === DELIVERY_TYPES.FAST) speed *= 1.2;
    if (deliveryType === DELIVERY_TYPES.SPINNER) speed *= 0.7;
    
    // Create ball
    const ball = new Ball(p, CANVAS_WIDTH / 2, 100, deliveryType, speed);
    gameState.ball = ball;
    gameState.entities.push(ball);
    gameState.ballInPlay = true;
    gameState.deliveryType = deliveryType;
    
    // Animate bowler
    if (gameState.bowler) {
      gameState.bowler.bowl(deliveryType);
    }
    
    // Log delivery
    p.logs.game_info.push({
      data: {
        event: "ball_delivered",
        deliveryType: deliveryType,
        speed: speed
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function createEnvironment() {
    // Ground (for ball bounce)
    const ground = Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 5, CANVAS_WIDTH, 10, {
      label: 'ground',
      isStatic: true
    });
    World.add(gameState.world, ground);
    
    // Boundaries
    const boundaryTop = Bodies.rectangle(CANVAS_WIDTH / 2, -5, CANVAS_WIDTH, 10, {
      label: 'boundary',
      isStatic: true
    });
    const boundaryLeft = Bodies.rectangle(-5, CANVAS_HEIGHT / 2, 10, CANVAS_HEIGHT, {
      label: 'boundary',
      isStatic: true
    });
    const boundaryRight = Bodies.rectangle(CANVAS_WIDTH + 5, CANVAS_HEIGHT / 2, 10, CANVAS_HEIGHT, {
      label: 'boundary',
      isStatic: true
    });
    
    World.add(gameState.world, [boundaryTop, boundaryLeft, boundaryRight]);
  }
  
  function initializeFieldZones(p) {
    // Create scoring zones
    gameState.fieldZones = [
      new FieldZone(p, 0, 0, 150, 100, 6), // Deep backward
      new FieldZone(p, 150, 0, 150, 100, 6), // Long on
      new FieldZone(p, 300, 0, 150, 100, 6), // Long off
      new FieldZone(p, 450, 0, 150, 100, 6), // Deep forward
      new FieldZone(p, 0, 100, 100, 150, 4), // Square leg
      new FieldZone(p, 500, 100, 100, 150, 4), // Point
      new FieldZone(p, 0, 250, 150, 150, 2), // Fine leg
      new FieldZone(p, 450, 250, 150, 150, 2), // Third man
      new FieldZone(p, 150, 300, 300, 100, 1) // Infield
    ];
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  gameState.testSequence = [];
  gameState.testIndex = 0;
  gameState.testDelay = 0;
  
  // Update button styles
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const btnId = mode === "HUMAN" ? "humanModeBtn" : 
                mode === "TEST_1" ? "test_1_ModeBtn" : 
                "test_2_ModeBtn";
  const btn = document.getElementById(btnId);
  if (btn) btn.classList.add('active');
  
  console.log(`Control mode set to: ${mode}`);
};