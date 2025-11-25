import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, logGameInfo } from './globals.js';
import { Player } from './entities.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting, updateLighting } from './lighting.js';
import { generateLevel, clearLevel } from './levelGenerator.js';
import { setupUI, renderUI } from './ui.js';
import { setupInputHandlers, processInput } from './input.js';
import { AIController } from './aiController.js';

let aiController = null;

// Initialize game
function init() {
  // Setup three.js scene
  gameState.scene = new THREE.Scene();
  gameState.scene.background = new THREE.Color(COLORS.background);
  gameState.scene.fog = new THREE.FogExp2(COLORS.background, 0.02);
  
  // Setup renderer
  setupRenderer();
  
  // Setup camera
  setupCamera();
  
  // Setup lighting
  setupLighting();
  
  // Setup UI
  setupUI();
  
  // Setup input handlers
  setupInputHandlers();
  
  // Initialize AI controller
  aiController = new AIController();
  
  // Initialize game state
  gameState.gamePhase = "START";
  
  // Seed random for reproducibility
  Math.seedrandom(42);
  
  // Log initial state
  logGameInfo("START", {});
  
  // Start game loop
  requestAnimationFrame(gameLoop);
}

function setupRenderer() {
  // Create container div
  const gameContainer = document.createElement('div');
  gameContainer.id = 'game-container';
  gameContainer.style.width = `${CANVAS_WIDTH}px`;
  gameContainer.style.height = `${CANVAS_HEIGHT}px`;
  gameContainer.style.position = 'relative';
  gameContainer.style.overflow = 'hidden';
  gameContainer.style.margin = '0';
  gameContainer.style.padding = '0';
  gameContainer.style.border = 'none';
  document.body.appendChild(gameContainer);
  
  // Set body styles
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.width = `${CANVAS_WIDTH}px`;
  document.body.style.height = `${CANVAS_HEIGHT}px`;
  
  // Create renderer
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
  });
  
  renderer.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  gameContainer.appendChild(renderer.domElement);
  
  gameState.renderer = renderer;
  gameState.gameContainer = gameContainer;
}

// Game loop
let lastTime = performance.now();
function gameLoop(currentTime) {
  requestAnimationFrame(gameLoop);
  
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  gameState.deltaTime = Math.min(deltaTime, 0.1); // Cap delta time
  gameState.frameCount++;
  
  updateGame(gameState.deltaTime);
  render();
}

function updateGame(deltaTime) {
  // Update based on game phase
  switch (gameState.gamePhase) {
    case "START":
      // Waiting for player to start
      break;
      
    case "PLAYING":
      // Process input
      if (gameState.controlMode === "HUMAN") {
        processInput();
      } else {
        aiController.update(deltaTime);
      }
      
      // Update player
      if (gameState.player) {
        gameState.player.update(deltaTime);
      }
      
      // Update demons
      gameState.demons.forEach(demon => demon.update(deltaTime));
      
      // Update cards
      gameState.cards.forEach(card => card.update(deltaTime));
      
      // Update projectiles
      for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        gameState.projectiles[i].update(deltaTime);
      }
      
      // Update particles
      for (let i = gameState.particles.length - 1; i >= 0; i--) {
        gameState.particles[i].update(deltaTime);
      }
      
      // Update camera
      updateCamera();
      
      // Update lighting
      updateLighting();
      
      // Check win condition
      if (gameState.demons.length === 0) {
        winGame();
      }
      
      break;
      
    case "PAUSED":
      // Game is paused, don't update
      break;
      
    case "GAME_OVER_WIN":
    case "GAME_OVER_LOSE":
      // Game over, waiting for restart
      break;
  }
  
  // Render UI
  renderUI();
}

function render() {
  if (gameState.renderer && gameState.scene && gameState.camera) {
    gameState.renderer.render(gameState.scene, gameState.camera);
  }
}

function winGame() {
  gameState.gamePhase = "GAME_OVER_WIN";
  gameState.gameEndTime = Date.now();
  
  logGameInfo("GAME_OVER_WIN", {
    score: gameState.score,
    time: (gameState.gameEndTime - gameState.gameStartTime) / 1000,
    demonsEliminated: gameState.demonsEliminated,
    cardsCollected: gameState.cardsCollected
  });
}

export function resetGame() {
  // Clear level
  clearLevel();
  
  // Remove player
  if (gameState.player) {
    gameState.scene.remove(gameState.player.mesh);
    if (gameState.player.weapon) {
      gameState.camera.remove(gameState.player.weapon);
    }
  }
  
  // Reset game state
  gameState.player = null;
  gameState.score = 0;
  gameState.demonsEliminated = 0;
  gameState.cardsCollected = 0;
  gameState.frameCount = 0;
  gameState.hasJumped = false;
  gameState.lastJumpTime = 0;
  
  // Generate new level
  generateLevel();
  
  // Create new player
  gameState.player = new Player(0, 2, 0);
  
  // Reset camera
  setupCamera();
  
  // Return to start screen
  gameState.gamePhase = "START";
  
  logGameInfo("START", {});
}

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const btnId = mode === "HUMAN" ? "humanModeBtn" : 
                mode === "TEST_1" ? "test_1_ModeBtn" : "test_2_ModeBtn";
  const btn = document.getElementById(btnId);
  if (btn) btn.classList.add('active');
  
  // If switching to test mode during game, ensure game is playing
  if (mode !== "HUMAN" && gameState.gamePhase === "START") {
    resetGame();
    gameState.gamePhase = "PLAYING";
    gameState.gameStartTime = Date.now();
    logGameInfo("PLAYING", {});
  }
};

// Start the game
init();

// Generate initial level
generateLevel();

// Create player
gameState.player = new Player(0, 2, 0);