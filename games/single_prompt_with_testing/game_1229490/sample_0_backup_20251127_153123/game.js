import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, logGameInfo, ARENA_SIZE } from './globals.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupRenderer } from './renderer.js';
import { setupLighting } from './lighting.js';
import { initUI, renderUI } from './ui.js';
import { initInput, processPlayerInput, processAIInput } from './input.js';
import { Player, Platform } from './entities.js';
import { initWaveSystem, updateWaveSystem, startFirstWave } from './waveManager.js';

// Initialize game
function init() {
  // Setup scene
  gameState.scene = new THREE.Scene();
  gameState.scene.background = new THREE.Color(0x1a0a0a);
  gameState.scene.fog = new THREE.Fog(0x1a0a0a, 20, 60);
  
  // Setup three.js components
  setupCamera();
  setupRenderer();
  setupLighting();
  
  // Setup UI
  initUI();
  
  // Setup input
  initInput();
  
  // Create arena
  createArena();
  
  // Initialize game state
  gameState.gamePhase = "START";
  gameState.controlMode = "HUMAN";
  
  // Initialize wave system
  initWaveSystem();
  
  // Seed random
  Math.seedrandom(42);
  
  // Log initial state
  logGameInfo("START", {});
  
  // Expose control mode setter
  window.setControlMode = (mode) => {
    gameState.controlMode = mode;
    updateControlModeButtons();
    
    // Start game if not already started
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      logGameInfo("PLAYING", {});
      
      if (mode === "TEST_2") {
        gameState.testStartTime = performance.now();
        gameState.testEnemiesKilled = 0;
      }
    }
  };
}

// Create arena
function createArena() {
  // Floor
  const floor = new Platform(0, -0.5, 0, ARENA_SIZE, 1, ARENA_SIZE);
  gameState.platforms.push(floor);
  
  // Walls (visual only, not for collision)
  const wallHeight = 5;
  const wallThickness = 0.5;
  
  // North wall
  const northWall = new Platform(0, wallHeight / 2, -ARENA_SIZE / 2, ARENA_SIZE, wallHeight, wallThickness);
  gameState.platforms.push(northWall);
  
  // South wall
  const southWall = new Platform(0, wallHeight / 2, ARENA_SIZE / 2, ARENA_SIZE, wallHeight, wallThickness);
  gameState.platforms.push(southWall);
  
  // East wall
  const eastWall = new Platform(ARENA_SIZE / 2, wallHeight / 2, 0, wallThickness, wallHeight, ARENA_SIZE);
  gameState.platforms.push(eastWall);
  
  // West wall
  const westWall = new Platform(-ARENA_SIZE / 2, wallHeight / 2, 0, wallThickness, wallHeight, ARENA_SIZE);
  gameState.platforms.push(westWall);
}

// Create player
function createPlayer() {
  gameState.player = new Player(0, 1, 0);
}

// Update game logic
function updateGame(deltaTime) {
  gameState.deltaTime = deltaTime;
  gameState.frameCount++;
  
  // Handle input based on control mode
  if (gameState.controlMode === "HUMAN") {
    processPlayerInput();
  } else {
    processAIInput();
  }
  
  // Update based on game phase
  switch (gameState.gamePhase) {
    case "START":
      // Wait for input
      break;
      
    case "PLAYING":
      // Create player if doesn't exist
      if (!gameState.player) {
        createPlayer();
        startFirstWave();
        gameState.testStartTime = performance.now();
        gameState.testEnemiesKilled = 0;
      }
      
      // Update entities
      if (gameState.player) {
        gameState.player.update(deltaTime);
      }
      
      gameState.enemies.forEach(enemy => enemy.update(deltaTime));
      gameState.projectiles.forEach(projectile => projectile.update(deltaTime));
      gameState.bloodParticles.forEach(particle => particle.update(deltaTime));
      
      // Update camera
      updateCamera();
      
      // Update wave system
      updateWaveSystem(deltaTime);
      
      // Update style combo timeout
      const currentTime = performance.now() / 1000;
      if (currentTime - gameState.lastKillTime > 3.0 && gameState.styleCombo > 0) {
        gameState.styleCombo = 0;
      }
      
      break;
      
    case "PAUSED":
      // Paused - don't update
      break;
      
    case "GAME_OVER_WIN":
    case "GAME_OVER_LOSE":
      // Game over
      break;
  }
  
  // Render UI
  renderUI();
}

// Render game
function render() {
  gameState.renderer.render(gameState.scene, gameState.camera);
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

// Reset game
export function resetGame() {
  // Clear entities
  if (gameState.player) {
    gameState.scene.remove(gameState.player.mesh);
    gameState.player = null;
  }
  
  gameState.enemies.forEach(enemy => {
    gameState.scene.remove(enemy.mesh);
  });
  gameState.enemies = [];
  
  gameState.projectiles.forEach(projectile => {
    gameState.scene.remove(projectile.mesh);
  });
  gameState.projectiles = [];
  
  gameState.bloodParticles.forEach(particle => {
    gameState.scene.remove(particle.mesh);
  });
  gameState.bloodParticles = [];
  
  // Reset game state
  gameState.score = 0;
  gameState.currentWave = 0;
  gameState.enemiesKilledThisWave = 0;
  gameState.enemiesSpawnedThisWave = 0;
  gameState.totalEnemiesKilled = 0;
  gameState.styleCombo = 0;
  gameState.stylePoints = 0;
  gameState.currentStyleRank = 'D';
  gameState.lastKillTime = 0;
  
  // Reset camera
  gameState.cameraAngleX = 0;
  gameState.cameraAngleY = 0.3;
  
  // Reset keys
  gameState.keys = {};
}

// Update control mode buttons
function updateControlModeButtons() {
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(button => {
    button.classList.remove('active');
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeButtonId = modeMap[gameState.controlMode];
  if (activeButtonId) {
    const activeButton = document.getElementById(activeButtonId);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }
}

// Start game
init();
gameLoop(performance.now());