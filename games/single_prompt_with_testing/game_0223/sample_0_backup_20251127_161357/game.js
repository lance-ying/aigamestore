// game.js - Main game loop and three.js setup

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  GAME_DURATION,
  FLASHLIGHT_DRAIN_RATE,
  NOISE_DECAY_RATE,
  MAMA_SPAWN_THRESHOLD
} from './globals.js';
import { Player, Tattletail, Mama } from './entities.js';
import { handleKeyDown, handleKeyUp, updatePlayerInput, processAutomatedAction } from './input.js';
import { renderStartScreen, renderHUD, renderPausedOverlay, renderGameOver } from './ui.js';
import { setupScene, setupWalls } from './renderer.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Initialize logs
window.logs = {
  "game_info": [],
  "inputs": [],
  "player_info": []
};

// Initialize three.js
function initThreeJS() {
  // Create container
  const gameContainer = document.createElement('div');
  gameContainer.id = 'game-container';
  gameContainer.style.width = CANVAS_WIDTH + 'px';
  gameContainer.style.height = CANVAS_HEIGHT + 'px';
  gameContainer.style.position = 'relative';
  gameContainer.style.overflow = 'hidden';
  gameContainer.style.margin = '0';
  gameContainer.style.padding = '0';
  document.body.appendChild(gameContainer);
  
  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0508);
  scene.fog = new THREE.FogExp2(0x0a0508, 0.08);
  
  // Create camera
  const camera = new THREE.PerspectiveCamera(
    75,
    CANVAS_WIDTH / CANVAS_HEIGHT,
    0.1,
    100
  );
  camera.position.set(20, 1.6, 15);
  
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  gameContainer.appendChild(renderer.domElement);
  
  // Create UI canvas overlay
  const uiCanvas = document.createElement('canvas');
  uiCanvas.id = 'ui-canvas';
  uiCanvas.width = CANVAS_WIDTH;
  uiCanvas.height = CANVAS_HEIGHT;
  uiCanvas.style.position = 'absolute';
  uiCanvas.style.top = '0';
  uiCanvas.style.left = '0';
  uiCanvas.style.pointerEvents = 'none';
  uiCanvas.style.zIndex = '1000';
  gameContainer.appendChild(uiCanvas);
  
  const uiContext = uiCanvas.getContext('2d');
  
  // Store in gameState
  gameState.scene = scene;
  gameState.camera = camera;
  gameState.renderer = renderer;
  gameState.gameContainer = gameContainer;
  gameState.uiCanvas = uiCanvas;
  gameState.uiContext = uiContext;
  
  // Setup lighting
  setupLighting();
  
  // Setup scene
  setupScene();
  
  // Setup walls
  setupWalls();
}

function setupLighting() {
  // Ambient light (very dim)
  const ambientLight = new THREE.AmbientLight(0x404060, 0.15);
  gameState.scene.add(ambientLight);
  gameState.ambientLight = ambientLight;
  
  // Player's flashlight (spotlight) - increased parameters for visibility
  const spotLight = new THREE.SpotLight(0xffffee, 0, 30, Math.PI / 4, 0.3, 1.5);
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;
  spotLight.shadow.camera.near = 0.5;
  spotLight.shadow.camera.far = 30;
  gameState.scene.add(spotLight);
  gameState.scene.add(spotLight.target);
  gameState.spotLight = spotLight;
  gameState.lights.push(spotLight);
}

function init() {
  // Seed random
  Math.seedrandom(42);
  
  // Initialize three.js
  initThreeJS();
  
  // Initialize game state
  gameState.gamePhase = "START";
  gameState.controlMode = "HUMAN";
  gameState.frameCount = 0;
  gameState.lastFrameTime = performance.now();
  
  // Setup input handlers
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  
  // Log initial state
  window.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase },
    framecount: 0,
    timestamp: Date.now()
  });
  
  // Start game loop
  gameLoop();
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  
  // Update frame count
  gameState.frameCount++;
  
  // Update delta time
  const currentTime = performance.now();
  gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
  gameState.lastFrameTime = currentTime;
  
  // Update and render based on game phase
  switch (gameState.gamePhase) {
    case "START":
      renderStartScreen();
      break;
      
    case "PLAYING":
      updateGame();
      renderGame();
      break;
      
    case "PAUSED":
      renderGame();
      renderPausedOverlay();
      break;
      
    case "GAME_OVER_WIN":
    case "GAME_OVER_LOSE":
      renderGame();
      renderGameOver();
      break;
  }
}

function updateGame() {
  // Process automated testing input
  if (gameState.controlMode !== "HUMAN") {
    const action = get_automated_testing_action(gameState);
    if (action) {
      processAutomatedAction(action);
    }
  }
  
  // Update player input
  updatePlayerInput();
  
  // Update entities
  if (gameState.player) {
    gameState.player.update();
  }
  
  if (gameState.tattletail) {
    gameState.tattletail.update();
  }
  
  if (gameState.mama) {
    gameState.mama.update();
  }
  
  // Update flashlight
  updateFlashlight();
  
  // Update flashlight battery
  if (gameState.flashlightOn) {
    gameState.flashlightBattery -= FLASHLIGHT_DRAIN_RATE;
    if (gameState.flashlightBattery <= 0) {
      gameState.flashlightBattery = 0;
      gameState.flashlightOn = false;
    }
  }
  
  // Decay noise level
  gameState.noiseLevel = Math.max(0, gameState.noiseLevel - NOISE_DECAY_RATE);
  
  // Spawn Mama if noise is too high
  if (gameState.noiseLevel > MAMA_SPAWN_THRESHOLD && !gameState.mamaSpawned) {
    if (gameState.mama && gameState.player) {
      // Spawn Mama in a random location away from player
      const angle = Math.random() * Math.PI * 2;
      const distance = 15;
      const spawnX = gameState.player.mesh.position.x + Math.cos(angle) * distance;
      const spawnZ = gameState.player.mesh.position.z + Math.sin(angle) * distance;
      gameState.mama.spawn(spawnX, spawnZ);
    }
  }
  
  // Update timer
  if (gameState.gameStartTime > 0) {
    const elapsed = (Date.now() - gameState.gameStartTime) / 1000;
    gameState.timeRemaining = Math.max(0, GAME_DURATION - elapsed);
    
    // Check win condition
    if (gameState.timeRemaining <= 0) {
      gameState.gamePhase = "GAME_OVER_WIN";
      window.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_WIN" },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function updateFlashlight() {
  if (gameState.player && gameState.spotLight) {
    const player = gameState.player;
    
    // Position light at player position (eye level)
    gameState.spotLight.position.copy(player.mesh.position);
    gameState.spotLight.position.y = 1.6;
    
    // Point light in camera direction
    const direction = new THREE.Vector3();
    gameState.camera.getWorldDirection(direction);
    const targetPos = player.mesh.position.clone().add(direction.multiplyScalar(5));
    gameState.spotLight.target.position.copy(targetPos);
    gameState.spotLight.target.updateMatrixWorld();
    
    // Set intensity based on flashlight state and battery
    if (gameState.flashlightOn && gameState.flashlightBattery > 0) {
      const batteryFactor = gameState.flashlightBattery / 100;
      // Significantly increased intensity from 2.5 to 20 for visibility
      gameState.spotLight.intensity = 20 * batteryFactor;
    } else {
      gameState.spotLight.intensity = 0;
    }
  }
}

function renderGame() {
  // Render 3D scene
  gameState.renderer.render(gameState.scene, gameState.camera);
  
  // Render HUD
  renderHUD();
}

// Initialize game entities
export function initGame() {
  // Clear entities
  gameState.entities.forEach(entity => {
    if (entity.mesh) {
      gameState.scene.remove(entity.mesh);
    }
  });
  gameState.entities = [];
  
  // Create player in center of house
  gameState.player = new Player(20, 15);
  
  // Create Tattletail in living room
  gameState.tattletail = new Tattletail(7.5, 22.5);
  
  // Create Mama (inactive)
  gameState.mama = new Mama();
  
  // Reset game variables
  gameState.score = 0;
  gameState.timeRemaining = GAME_DURATION;
  gameState.noiseLevel = 0;
  gameState.flashlightOn = false;
  gameState.flashlightBattery = 100;
  gameState.mamaSpawned = false;
  gameState.mamaActive = false;
  gameState.gameStartTime = Date.now();
}

// Reset game
export function resetGame() {
  gameState.entities.forEach(entity => {
    if (entity.mesh) {
      gameState.scene.remove(entity.mesh);
    }
  });
  gameState.entities = [];
  gameState.player = null;
  gameState.tattletail = null;
  gameState.mama = null;
  gameState.score = 0;
  gameState.timeRemaining = GAME_DURATION;
  gameState.noiseLevel = 0;
  gameState.flashlightOn = false;
  gameState.flashlightBattery = 100;
  gameState.mamaSpawned = false;
  gameState.mamaActive = false;
  gameState.gameStartTime = 0;
  gameState.keys = {};
}

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' :
                    mode === 'TEST_1' ? 'test_1_ModeBtn' :
                    mode === 'TEST_2' ? 'test_2_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
};

// Start game
init();