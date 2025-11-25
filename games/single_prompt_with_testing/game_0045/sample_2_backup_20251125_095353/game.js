// game.js - Main game loop and initialization
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, logGameInfo, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setupCamera } from './camera.js';
import { setupRenderer, render } from './renderer.js';
import { setupLighting, updateLighting } from './lighting.js';
import { updatePhysics } from './physics.js';
import { Player } from './entities.js';
import { createLevel1, clearLevel } from './level.js';
import { initUI, renderUI } from './ui.js';
import { setupInput, processInput, processTestInput } from './input.js';

// Initialize the game
function init() {
  // Setup Three.js scene
  gameState.scene = new THREE.Scene();
  gameState.scene.background = new THREE.Color(0x0a0a1a);
  gameState.scene.fog = new THREE.Fog(0x0a0a1a, 30, 80);
  
  // Setup camera
  setupCamera();
  
  // Setup renderer
  setupRenderer();
  
  // Setup lighting
  setupLighting();
  
  // Setup UI
  initUI();
  
  // Setup input
  setupInput();
  
  // Initialize random seed
  Math.seedrandom(42);
  
  // Set initial game phase
  gameState.gamePhase = "START";
  
  // Log initial state
  logGameInfo({ action: 'game_initialized' });
  
  // Expose game instance globally
  window.gameInstance = {
    gameState,
    resetGame
  };
}

// Start new game
export function startGame() {
  // Clear any existing level
  clearLevel();
  
  // Create player
  gameState.player = new Player(
    gameState.spawnPosition.x,
    gameState.spawnPosition.y,
    gameState.spawnPosition.z
  );
  
  // Create level
  createLevel1();
  
  // Reset game state
  gameState.score = 0;
  gameState.enemiesKilled = 0;
  gameState.goalReached = false;
  gameState.levelStartTime = performance.now();
}

// Reset game
export function resetGame() {
  // Clear level
  clearLevel();
  
  // Remove player
  if (gameState.player) {
    gameState.scene.remove(gameState.player.mesh);
    gameState.player = null;
  }
  
  // Reset state
  gameState.gamePhase = "START";
  gameState.score = 0;
  gameState.enemiesKilled = 0;
  gameState.goalReached = false;
  gameState.levelStartTime = 0;
  gameState.levelCompleteTime = 0;
  
  logGameInfo({ action: 'game_reset' });
}

// Update game logic
function updateGame(deltaTime) {
  gameState.deltaTime = deltaTime;
  gameState.frameCount++;
  
  // Handle control mode
  if (gameState.controlMode === "HUMAN") {
    processInput();
  } else {
    processTestInput();
  }
  
  // Update based on game phase
  switch (gameState.gamePhase) {
    case "START":
      // Waiting for player to start
      break;
      
    case "PLAYING":
      // Start level if needed
      if (!gameState.player) {
        startGame();
      }
      
      // Update physics
      updatePhysics(deltaTime);
      
      // Update lighting effects
      updateLighting(deltaTime);
      
      // Update other entities
      gameState.entities.forEach(entity => {
        if (entity.update) {
          entity.update(deltaTime);
        }
      });
      
      break;
      
    case "PAUSED":
      // Game is paused, don't update
      break;
      
    case "GAME_OVER_WIN":
    case "GAME_OVER_LOSE":
      // Game over, wait for restart
      break;
  }
  
  // Render UI
  renderUI();
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

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = {
    'HUMAN': document.getElementById('humanModeBtn'),
    'TEST_1': document.getElementById('test_1_ModeBtn'),
    'TEST_2': document.getElementById('test_2_ModeBtn')
  };
  
  Object.keys(buttons).forEach(key => {
    if (buttons[key]) {
      if (key === mode) {
        buttons[key].classList.add('active');
      } else {
        buttons[key].classList.remove('active');
      }
    }
  });
  
  logGameInfo({ action: 'control_mode_changed', mode });
};

// Start the game
init();
gameLoop(performance.now());