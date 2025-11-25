import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, BASE_SPEED, MAX_SPEED, SPEED_INCREMENT, WIN_SCORE } from './globals.js';
import { Player } from './entities.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting } from './lighting.js';
import { setupRenderer, render } from './renderer.js';
import { setupInput } from './input.js';
import { handleCollisions, updateWorldScroll } from './physics.js';
import { updateSpawning } from './spawner.js';
import { initializeWorld, updateWorld } from './world.js';
import { setupUI, renderUI } from './ui.js';
import { updateAI } from './ai.js';

// Initialize logs (write-only, never reset!)
const logs = {
  "game_info": [],
  "player_info": [],
  "inputs": []
};
window.logs = logs;

// Initialize game
function init() {
  // Setup Three.js scene
  gameState.scene = new THREE.Scene();
  gameState.scene.background = new THREE.Color(0x111111);
  gameState.scene.fog = new THREE.Fog(0x111111, 20, 80);
  
  setupCamera();
  setupRenderer();
  setupLighting();
  setupInput();
  setupUI();
  
  // Initialize world
  initializeWorld();
  
  // Set random seed
  Math.seedrandom(42);
  
  // Initialize game state
  gameState.gamePhase = "START";
  gameState.score = 0;
  gameState.distance = 0;
  gameState.currentSpeed = BASE_SPEED;
  
  // Log initial state
  logs.game_info.push({
    game_status: gameState.gamePhase,
    data: {},
    framecount: 0,
    timestamp: Date.now()
  });
}

// Update game logic
function updateGame(deltaTime) {
  gameState.deltaTime = deltaTime;
  gameState.frameCount++;
  
  // Update based on game phase
  switch (gameState.gamePhase) {
    case "START":
      // Wait for ENTER or AI to start
      if (gameState.controlMode !== "HUMAN") {
        // Auto-start for AI tests after 1 second
        if (gameState.frameCount > 60) {
          gameState.gamePhase = "PLAYING";
          initializeGameplay();
        }
      }
      break;
      
    case "PLAYING":
      // Initialize gameplay if not done
      if (!gameState.player) {
        initializeGameplay();
      }
      
      // Update AI
      updateAI();
      
      // Update entities
      if (gameState.player) {
        gameState.player.update(deltaTime);
      }
      
      gameState.obstacles.forEach(obstacle => obstacle.update(deltaTime));
      gameState.coins.forEach(coin => coin.update(deltaTime));
      
      // Update world scrolling
      updateWorldScroll(deltaTime);
      updateWorld(deltaTime);
      
      // Update spawning
      updateSpawning(deltaTime);
      
      // Update physics
      handleCollisions();
      
      // Update camera
      updateCamera();
      
      // Increase speed over time
      gameState.currentSpeed = Math.min(MAX_SPEED, gameState.currentSpeed + SPEED_INCREMENT);
      
      // Check win condition
      if (gameState.score >= WIN_SCORE) {
        gameState.gamePhase = "GAME_OVER_WIN";
        logs.game_info.push({
          game_status: "GAME_OVER_WIN",
          data: { 
            score: gameState.score,
            distance: Math.floor(gameState.distance)
          },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
      break;
      
    case "PAUSED":
      // Game is paused - don't update
      break;
      
    case "GAME_OVER_WIN":
    case "GAME_OVER_LOSE":
      // Wait for restart
      break;
  }
  
  // Render UI
  renderUI();
}

function initializeGameplay() {
  // Clear previous game entities
  cleanupGame();
  
  // Create player
  gameState.player = new Player(0, 1, 0);
  gameState.entities.push(gameState.player);
  
  // Reset game state
  gameState.score = 0;
  gameState.distance = 0;
  gameState.currentSpeed = BASE_SPEED;
  gameState.spawnTimer = 0;
  gameState.spawnInterval = 2.0;
  gameState.coinSpawnTimer = 0;
  gameState.coinSpawnInterval = 1.5;
  
  logs.game_info.push({
    game_status: "PLAYING",
    data: {},
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

function cleanupGame() {
  // Remove all obstacles
  gameState.obstacles.forEach(obstacle => obstacle.destroy());
  gameState.obstacles = [];
  
  // Remove all coins
  gameState.coins.forEach(coin => coin.destroy());
  gameState.coins = [];
  
  // Remove player
  if (gameState.player) {
    gameState.scene.remove(gameState.player.mesh);
    gameState.player = null;
  }
  
  gameState.entities = [];
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

// Handle restart
document.addEventListener('keydown', (event) => {
  if (event.keyCode === 82 && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
    gameState.gamePhase = "START";
    cleanupGame();
    
    logs.game_info.push({
      game_status: "START",
      data: {},
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (event.keyCode === 13 && gameState.gamePhase === "START") {
    gameState.gamePhase = "PLAYING";
    initializeGameplay();
  }
});

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
  
  // Restart game when changing modes
  if (gameState.gamePhase !== "START") {
    gameState.gamePhase = "START";
    cleanupGame();
  }
};

// Start game
init();
gameLoop();

// Expose game instance
window.gameInstance = {
  gameState,
  init,
  updateGame,
  render
};