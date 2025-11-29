// game.js - Main game loop and initialization
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, logGameInfo, TARGET_SCORE, TARGET_TOKENS } from './globals.js';
import { setupRenderer, setupScene } from './renderer.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting, updateLighting } from './lighting.js';
import { createTerrain, getCurrentBiome } from './terrain.js';
import { Vehicle, initializeEntities } from './entities.js';
import { handleCollisions } from './physics.js';
import { setupUI, renderUI } from './ui.js';
import { setupInput, handleInput } from './input.js';

// Initialize the game
function init() {
  console.log('Initializing Horizon Racer...');
  
  // Setup Three.js components
  setupScene();
  setupCamera();
  setupRenderer();
  setupLighting();
  
  // Setup UI overlay
  setupUI();
  
  // Create terrain
  createTerrain();
  
  // Create player vehicle
  gameState.player = new Vehicle(0, 0.2, 0);
  gameState.entities.push(gameState.player);
  
  // Initialize game entities
  initializeEntities();
  
  // Setup input handling
  setupInput();
  
  // Set random seed for reproducibility
  Math.seedrandom(42);
  
  // Initialize game state
  gameState.gamePhase = "START";
  gameState.controlMode = "HUMAN";
  
  // Log initial state
  logGameInfo("START", {
    targetScore: TARGET_SCORE,
    targetTokens: TARGET_TOKENS
  });
  
  console.log('Game initialized successfully!');
}

// Update game logic
function updateGame(deltaTime) {
  gameState.deltaTime = deltaTime;
  gameState.frameCount++;
  
  // Handle input
  handleInput();
  
  // Update based on game phase
  if (gameState.gamePhase === "PLAYING") {
    // Update player
    if (gameState.player) {
      gameState.player.update(deltaTime);
      
      // Update biome-based lighting
      const currentBiome = getCurrentBiome(gameState.player.mesh.position);
      updateLighting(currentBiome);
    }
    
    // Update all entities
    gameState.entities.forEach(entity => {
      if (entity !== gameState.player && entity.update) {
        entity.update(deltaTime);
      }
    });
    
    // Handle collisions
    handleCollisions();
    
    // Update camera
    updateCamera();
    
    // Check win/lose conditions
    checkGameConditions();
  }
  
  // Render UI
  renderUI();
}

// Check game conditions
function checkGameConditions() {
  // Check win condition
  if (gameState.score >= TARGET_SCORE && gameState.tokensCollected >= TARGET_TOKENS) {
    gameState.gamePhase = "GAME_OVER_WIN";
    logGameInfo("GAME_OVER_WIN", {
      finalScore: gameState.score,
      tokensCollected: gameState.tokensCollected,
      checkpointsCompleted: gameState.checkpointsCompleted
    });
  }
  
  // No lose condition in this game - it's about exploration and collection
}

// Main game loop
let lastTime = performance.now();

function gameLoop(currentTime) {
  requestAnimationFrame(gameLoop);
  
  // Calculate delta time
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 100ms
  lastTime = currentTime;
  
  // Update game
  updateGame(deltaTime);
  
  // Render scene
  if (gameState.renderer && gameState.scene && gameState.camera) {
    gameState.renderer.render(gameState.scene, gameState.camera);
  }
}

// Start the game
init();
gameLoop(performance.now());

// Expose game instance
window.gameInstance = {
  gameState,
  init,
  updateGame,
  gameLoop
};