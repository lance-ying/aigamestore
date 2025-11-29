// game.js - Main game file
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_PHASES,
  CONTROL_MODES,
  EMERGENCY_TYPES,
  getGameState
} from './globals.js';

import { Aircraft, Runway, Terrain } from './entities.js';
import { updatePhysics, checkCollisions, checkBoundaries } from './physics.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting } from './lighting.js';
import { 
  renderUI,
  renderStartScreen, 
  renderHUD, 
  renderPausedOverlay, 
  renderGameOver 
} from './ui.js';
import { updateAutomation } from './automation.js';

// Initialize logs (write-only, never reset!)
const logs = {
  "game_info": [],
  "player_info": [],
  "inputs": []
};
window.logs = logs;

// Initialize game
function init() {
  // Seed random
  Math.seedrandom(42);
  
  // Create game container
  const gameContainer = document.createElement('div');
  gameContainer.id = 'game-container';
  gameContainer.style.width = CANVAS_WIDTH + 'px';
  gameContainer.style.height = CANVAS_HEIGHT + 'px';
  gameContainer.style.position = 'relative';
  gameContainer.style.overflow = 'hidden';
  gameContainer.style.margin = '0';
  gameContainer.style.padding = '0';
  gameContainer.style.border = 'none';
  
  const existingContainer = document.getElementById('game-container');
  if (existingContainer) {
    existingContainer.parentElement.replaceChild(gameContainer, existingContainer);
  } else {
    document.body.appendChild(gameContainer);
  }
  
  gameState.gameContainer = gameContainer;
  
  // Create scene
  gameState.scene = new THREE.Scene();
  gameState.scene.background = new THREE.Color(0x87CEEB); // Sky blue
  gameState.scene.fog = new THREE.Fog(0x87CEEB, 50, 500);
  
  // Setup camera
  setupCamera();
  
  // Setup renderer
  gameState.renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  gameState.renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  gameState.renderer.shadowMap.enabled = true;
  gameState.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  gameContainer.appendChild(gameState.renderer.domElement);
  
  // Setup lighting
  setupLighting();
  
  // Initialize entities
  initializeGame();
  
  // Setup input handlers
  setupInputHandlers();
  
  // Log initial state
  logs.game_info.push({
    game_status: gameState.gamePhase,
    data: {},
    framecount: 0,
    timestamp: Date.now()
  });
}

function initializeGame() {
  // Clear existing entities
  gameState.entities.forEach(entity => {
    if (entity.mesh) {
      gameState.scene.remove(entity.mesh);
    }
  });
  gameState.entities = [];
  
  // Create terrain
  gameState.terrain = new Terrain();
  gameState.entities.push(gameState.terrain);
  
  // Create runway
  gameState.runway = new Runway();
  gameState.entities.push(gameState.runway);
  
  // Create aircraft
  gameState.player = new Aircraft(0, 300, -150);
  gameState.entities.push(gameState.player);
  gameState.cameraTarget = gameState.player;
  
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
  gameState.pitchInput = 0;
  gameState.rollInput = 0;
  gameState.yawInput = 0;
  
  // Set initial velocity
  gameState.velocity.set(0, 0, 30); // Moving toward runway
  gameState.angularVelocity.set(0, 0, 0);
}

function setupInputHandlers() {
  // Keydown handler
  document.addEventListener('keydown', (event) => {
    // Log input
    logs.inputs.push({
      input_type: "keydown",
      data: { key: event.key, keyCode: event.keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
    
    gameState.keys[event.keyCode] = true;
    
    // Phase control keys
    if (event.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
      // ENTER - Start game
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.testFrameCount = 0;
      logs.game_info.push({
        game_status: GAME_PHASES.PLAYING,
        data: {},
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
    
    if (event.keyCode === 27) {
      // ESC - Pause/Unpause
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        logs.game_info.push({
          game_status: GAME_PHASES.PAUSED,
          data: {},
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        logs.game_info.push({
          game_status: GAME_PHASES.PLAYING,
          data: {},
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (event.keyCode === 82) {
      // R - Restart
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        initializeGame();
        gameState.gamePhase = GAME_PHASES.START;
        logs.game_info.push({
          game_status: GAME_PHASES.START,
          data: {},
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // System controls (toggle on press)
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (event.keyCode === 32 && !event.repeat) {
        // SPACE - Landing gear
        gameState.gearDeployed = !gameState.gearDeployed;
      }
      
      if (event.keyCode === 16 && !event.repeat) {
        // SHIFT - Flaps (cycle through settings)
        gameState.flapSetting = (gameState.flapSetting + 1) % 5;
      }
      
      if (event.keyCode === 90 && !event.repeat) {
        // Z - Spoilers
        gameState.spoilersDeployed = !gameState.spoilersDeployed;
      }
    }
    
    event.preventDefault();
    return false;
  });
  
  // Keyup handler
  document.addEventListener('keyup', (event) => {
    // Log input
    logs.inputs.push({
      input_type: "keyup",
      data: { key: event.key, keyCode: event.keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
    
    gameState.keys[event.keyCode] = false;
    
    event.preventDefault();
    return false;
  });
}

function updateGame() {
  // Update automation if in test mode
  updateAutomation();
  
  // Handle player input
  handleInput();
  
  // Update entities
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update(gameState.deltaTime);
    }
  });
  
  // Update physics
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    updatePhysics(gameState.deltaTime);
    checkCollisions();
    checkBoundaries();
  }
  
  // Update camera
  updateCamera();
  
  // Update mission time
  gameState.missionTime += gameState.deltaTime;
  
  // Random emergency generation
  if (Math.random() < 0.0001 && gameState.activeEmergencies.length === 0) {
    const emergency = EMERGENCY_TYPES[Math.floor(Math.random() * EMERGENCY_TYPES.length)];
    gameState.activeEmergencies.push(emergency);
    
    // Apply emergency effect
    if (emergency === "ENGINE_FAILURE") {
      if (Math.random() < 0.5) {
        gameState.engine1Running = false;
      } else {
        gameState.engine2Running = false;
      }
    }
  }
}

function handleInput() {
  if (!gameState.player || gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Pitch control (W/S)
  gameState.pitchInput = 0;
  if (gameState.keys[87]) gameState.pitchInput -= 1; // W - pitch up
  if (gameState.keys[83]) gameState.pitchInput += 1; // S - pitch down
  
  // Roll control (A/D)
  gameState.rollInput = 0;
  if (gameState.keys[65]) gameState.rollInput -= 1; // A - roll left
  if (gameState.keys[68]) gameState.rollInput += 1; // D - roll right
  
  // Rudder control (Arrow Left/Right)
  gameState.yawInput = 0;
  if (gameState.keys[37]) gameState.yawInput -= 1; // Left arrow
  if (gameState.keys[39]) gameState.yawInput += 1; // Right arrow
  
  // Throttle control (Arrow Up/Down)
  if (gameState.keys[38]) {
    gameState.throttle = Math.min(1, gameState.throttle + 0.01);
  }
  if (gameState.keys[40]) {
    gameState.throttle = Math.max(0, gameState.throttle - 0.01);
  }
}

function render() {
  gameState.renderer.render(gameState.scene, gameState.camera);
  renderUI();
}

// Main game loop
let lastTime = performance.now();
function gameLoop(currentTime) {
  requestAnimationFrame(gameLoop);
  
  // Calculate delta time
  gameState.deltaTime = (currentTime - lastTime) / 1000;
  gameState.deltaTime = Math.min(gameState.deltaTime, 0.1); // Cap at 100ms
  lastTime = currentTime;
  gameState.frameCount++;
  
  // Update and render based on game phase
  switch (gameState.gamePhase) {
    case GAME_PHASES.START:
      render();
      renderStartScreen();
      break;
      
    case GAME_PHASES.PLAYING:
      updateGame();
      render();
      break;
      
    case GAME_PHASES.PAUSED:
      render();
      renderPausedOverlay();
      break;
      
    case GAME_PHASES.GAME_OVER_WIN:
    case GAME_PHASES.GAME_OVER_LOSE:
      render();
      renderGameOver();
      break;
  }
}

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
      initializeGame();
      gameState.gamePhase = GAME_PHASES.START;
    }
  }
};

// Start game
init();
gameLoop(performance.now());