// game.js - Main game file

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World } = Matter;

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_PHASES,
  CONTROL_MODES,
  EMERGENCY_TYPES,
  getGameState
} from './globals.js';

import { Aircraft, Runway, Ground } from './entities.js';
import { setupPhysicsEvents, checkBoundaries } from './physics.js';
import { 
  renderStartScreen, 
  renderHUD, 
  renderAttitudeIndicator,
  renderILS,
  renderPausedOverlay, 
  renderGameOver 
} from './ui.js';
import { updateAutomation } from './automation.js';

let gameInstance = new p5(p => {
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0.5; // Reduced gravity for aircraft flight
    
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
    // Update physics engine
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
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      // ENTER - Start game
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.testFrameCount = 0;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (p.keyCode === 27) {
      // ESC - Pause/Unpause
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
    
    if (p.keyCode === 82) {
      // R - Restart
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
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.keys[p.keyCode] = true;
      
      // System controls (toggle on press)
      if (p.keyCode === 32) {
        // SPACE - Landing gear
        gameState.gearDeployed = !gameState.gearDeployed;
      }
      
      if (p.keyCode === 16) {
        // SHIFT - Flaps (cycle through settings)
        gameState.flapSetting = (gameState.flapSetting + 1) % 5;
      }
      
      if (p.keyCode === 90) {
        // Z - Spoilers
        gameState.spoilersDeployed = !gameState.spoilersDeployed;
      }
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
    
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.keys[p.keyCode] = false;
    }
    
    return false;
  };
  
});

function initializeGame(p) {
  // Create runway
  gameState.runway = new Runway(p);
  gameState.entities.push(gameState.runway);
  
  // Create ground
  const ground = new Ground(p);
  gameState.entities.push(ground);
  
  // Create aircraft
  gameState.player = new Aircraft(p, 150, 150);
  gameState.entities.push(gameState.player);
  
  // Reset game state
  gameState.score = 0;
  gameState.missionTime = 0;
  gameState.fuel = 100;
  gameState.throttle = 0.5;
  gameState.flapSetting = 0;
  gameState.gearDeployed = false;
  gameState.spoilersDeployed = false;
  gameState.engine1Running = true;
  gameState.engine2Running = true;
  gameState.activeEmergencies = [];
  gameState.emergencyTimer = 0;
  gameState.touchdownSpeed = 0;
  gameState.touchdownVerticalSpeed = 0;
  gameState.touchdownAlignment = 0;
  gameState.landedSafely = false;
  gameState.crashReason = "";
  gameState.keys = {};
  gameState.testFrameCount = 0;
  gameState.testPhase = 0;
}

function resetGame(p) {
  // Clear all entities from physics world
  World.clear(gameState.world, false);
  
  // Clear entities array
  gameState.entities = [];
  
  // Reinitialize
  initializeGame(p);
}

function updateGame(p) {
  // Update automation if in test mode
  updateAutomation(p);
  
  // Handle player input
  handleInput();
  
  // Update entities
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update();
    }
  });
  
  // Update mission time
  gameState.missionTime += 1 / 60;
  
  // Random emergency generation
  if (p.random() < 0.0001 && gameState.activeEmergencies.length === 0) {
    const emergency = p.random(EMERGENCY_TYPES);
    gameState.activeEmergencies.push(emergency);
    
    // Apply emergency effect
    if (emergency === "ENGINE_FAILURE") {
      if (p.random() < 0.5) {
        gameState.engine1Running = false;
      } else {
        gameState.engine2Running = false;
      }
    }
  }
  
  // Check boundaries and other fail conditions
  checkBoundaries();
}

function handleInput() {
  const aircraft = gameState.player;
  if (!aircraft) return;
  
  // Pitch control (W/S)
  let pitchInput = 0;
  if (gameState.keys[87]) pitchInput -= 1; // W - pitch up
  if (gameState.keys[83]) pitchInput += 1; // S - pitch down
  aircraft.setPitchInput(pitchInput);
  
  // Roll control (A/D)
  let rollInput = 0;
  if (gameState.keys[65]) rollInput -= 1; // A - roll left
  if (gameState.keys[68]) rollInput += 1; // D - roll right
  aircraft.setRollInput(rollInput);
  
  // Rudder control (Arrow Left/Right)
  let yawInput = 0;
  if (gameState.keys[37]) yawInput -= 1; // Left arrow
  if (gameState.keys[39]) yawInput += 1; // Right arrow
  aircraft.setYawInput(yawInput);
  
  // Throttle control (Arrow Up/Down)
  if (gameState.keys[38]) {
    gameState.throttle = Math.min(1, gameState.throttle + 0.01);
  }
  if (gameState.keys[40]) {
    gameState.throttle = Math.max(0, gameState.throttle - 0.01);
  }
}

function renderGame(p) {
  // Sky background
  p.background(135, 206, 235);
  
  // Draw clouds
  p.fill(255, 255, 255, 180);
  p.noStroke();
  p.ellipse(100, 80, 60, 30);
  p.ellipse(300, 60, 80, 40);
  p.ellipse(500, 90, 70, 35);
  
  // Render entities
  gameState.entities.forEach(entity => {
    if (entity.render) {
      entity.render();
    }
  });
  
  // Render UI elements
  renderAttitudeIndicator(p);
  renderILS(p);
  renderHUD(p);
}

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  if (CONTROL_MODES[mode]) {
    gameState.controlMode = mode;
    gameState.testFrameCount = 0;
    gameState.testPhase = 0;
    
    // Update button states
    Object.keys(CONTROL_MODES).forEach(m => {
      const btn = document.getElementById(`${m === 'HUMAN' ? 'humanModeBtn' : m.toLowerCase() + '_ModeBtn'}`);
      if (btn) {
        if (m === mode) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });
    
    // Reset game when changing modes
    if (gameState.gamePhase !== GAME_PHASES.START) {
      const p = gameInstance;
      resetGame(p);
      gameState.gamePhase = GAME_PHASES.START;
    }
  }
};