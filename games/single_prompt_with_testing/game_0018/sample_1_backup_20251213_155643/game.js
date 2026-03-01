import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_START_Z, GROUND_Y, BASE_SPEED, MAX_SPEED, SPEED_INCREMENT, LEVEL_CONFIG, LEVEL_THEMES } from './globals.js';
import { Player, Track } from './entities.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting, updateLevelTheme } from './lighting.js';
import { setupRenderer, render } from './renderer.js';
import { updatePhysics, handleCollisions } from './physics.js';
import { setupInput, updateAutomatedControl } from './input.js';
import { setupUI, renderUI } from './ui.js';
import { updateSpawner } from './spawner.js';

// Initialize game
function init() {
  // Setup scene
  gameState.scene = new THREE.Scene();
  gameState.scene.background = new THREE.Color(0x1a1a2e);
  gameState.scene.fog = new THREE.Fog(0x1a1a2e, 20, 60);
  
  // Setup three.js components
  setupCamera();
  setupRenderer();
  setupLighting();
  setupUI();
  setupInput();
  
  // Create track
  gameState.track = new Track();
  
  // Seed random
  Math.seedrandom(42);
  
  // Log initial state
  window.logs.game_info.push({
    game_status: gameState.gamePhase,
    data: {},
    framecount: 0,
    timestamp: Date.now()
  });
  
  // Expose game instance
  window.gameInstance = {
    gameState,
    scene: gameState.scene,
    camera: gameState.camera,
    renderer: gameState.renderer
  };
}

// Update game logic
function updateGame(deltaTime) {
  gameState.deltaTime = deltaTime;
  gameState.frameCount++;
  
  switch (gameState.gamePhase) {
    case "START":
      // Create player if not exists
      if (!gameState.player) {
        gameState.player = new Player(0, GROUND_Y + 1.0, PLAYER_START_Z);
      }
      break;
      
    case "PLAYING":
      // Update speed
      gameState.speed = Math.min(MAX_SPEED, BASE_SPEED + gameState.distance * SPEED_INCREMENT);
      
      // Update invincibility timer
      if (gameState.invincibilityTimer > 0) {
        gameState.invincibilityTimer -= deltaTime;
        if (gameState.invincibilityTimer < 0) {
          gameState.invincibilityTimer = 0;
        }
      }
      
      // Update physics
      updatePhysics(deltaTime);
      
      // Handle collisions
      handleCollisions();
      
      // Update spawner
      updateSpawner(deltaTime);
      
      // Update camera
      updateCamera();
      
      // Update automated control
      updateAutomatedControl();
      
      break;
      
    case "LEVEL_COMPLETE":
      // Level complete screen - auto progress after delay
      gameState.levelCompleteTimer += deltaTime;
      if (gameState.levelCompleteTimer >= gameState.levelCompleteDelay) {
        progressToNextLevel();
      }
      break;
      
    case "PAUSED":
      // Don't update game
      break;
      
    case "GAME_OVER_LOSE":
      // Game over
      break;
  }
  
  // Render UI
  renderUI();
}

function progressToNextLevel() {
  // Progress to next level
  gameState.currentLevel++;
  
  if (gameState.currentLevel <= 9) {
    gameState.currentLevelConfig = LEVEL_CONFIG[gameState.currentLevel - 1];
    gameState.spawnInterval = gameState.currentLevelConfig.spawnInterval;
    
    // Apply new level theme
    updateLevelTheme(gameState.currentLevel);
    
    // Clear existing obstacles and coins
    gameState.obstacles.forEach(obstacle => {
      gameState.scene.remove(obstacle.mesh);
    });
    gameState.coins.forEach(coin => {
      gameState.scene.remove(coin.mesh);
    });
    gameState.obstacles = [];
    gameState.coins = [];
    
    // Reset timers
    gameState.levelCompleteTimer = 0;
    gameState.spawnTimer = 0;
    
    // Resume playing
    gameState.gamePhase = "PLAYING";
    
    window.logs.game_info.push({
      game_status: `level_started_${gameState.currentLevel}`,
      data: { level: gameState.currentLevel },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  } else {
    // Game complete!
    gameState.gamePhase = "GAME_OVER_WIN";
  }
}

// Main game loop
let lastTime = performance.now();

function gameLoop(currentTime) {
  requestAnimationFrame(gameLoop);
  
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
  lastTime = currentTime;
  
  updateGame(deltaTime);
  render();
}

// Start game
init();
gameLoop();