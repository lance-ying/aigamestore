/**
 * Main game loop and initialization
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, logGameInfo } from './globals.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting, updateLighting } from './lighting.js';
import { setupRenderer, render } from './renderer.js';
import { setupUI, renderUI } from './ui.js';
import { setupInput, processInput } from './input.js';
import { updatePhysics, handleCollisions } from './physics.js';
import { spawnEnemy, spawnTeleporter, createArena } from './spawn.js';
import { Player } from './entities.js';

/**
 * Initialize the game
 */
function init() {
  // Create scene
  gameState.scene = new THREE.Scene();
  gameState.scene.background = new THREE.Color(0x1a1a2e);
  gameState.scene.fog = new THREE.Fog(0x1a1a2e, 20, 50);
  
  // Setup components
  setupCamera();
  setupRenderer();
  setupLighting();
  setupUI();
  setupInput();
  
  // Create arena
  createArena();
  
  // Initialize random seed
  Math.seedrandom(42);
  
  // Initialize game state
  gameState.gamePhase = 'START';
  gameState.frameCount = 0;
  
  // Log initial state
  logGameInfo('START');
  
  // Expose game instance
  if (typeof window !== 'undefined') {
    window.gameInstance = { p5Instance: null }; // No p5.js instance
  }
}

/**
 * Update game logic
 */
function updateGame(deltaTime) {
  gameState.deltaTime = deltaTime;
  gameState.frameCount++;
  
  // Process input
  processInput();
  
  // Update based on game phase
  switch (gameState.gamePhase) {
    case 'START':
      // Waiting for player to start
      break;
      
    case 'PLAYING':
      // Initialize player if not exists
      if (!gameState.player) {
        gameState.player = new Player(0, 2, 0);
      }
      
      // Update game time
      gameState.gameTime += deltaTime;
      
      // Update difficulty
      gameState.difficultyMultiplier = 1 + gameState.gameTime * 0.02;
      
      // Spawn enemies
      gameState.enemySpawnTimer += deltaTime;
      const spawnRate = Math.max(1.5, 3.0 - gameState.difficultyMultiplier * 0.3);
      if (gameState.enemySpawnTimer >= spawnRate) {
        gameState.enemySpawnTimer = 0;
        spawnEnemy();
      }
      
      // Check for teleporter spawn
      spawnTeleporter();
      
      // Update physics
      updatePhysics(deltaTime);
      handleCollisions();
      
      // Update camera
      updateCamera();
      
      // Update lighting effects
      updateLighting();
      break;
      
    case 'PAUSED':
      // Game is paused
      break;
      
    case 'GAME_OVER_WIN':
    case 'GAME_OVER_LOSE':
      // Game over
      if (gameState.frameCount % 60 === 0) {
        logGameInfo(gameState.gamePhase, {
          score: gameState.score,
          killCount: gameState.killCount,
          timeAlive: gameState.gameTime
        });
      }
      break;
  }
  
  // Render UI
  renderUI();
}

/**
 * Main game loop
 */
let lastTime = performance.now();

function gameLoop(currentTime) {
  requestAnimationFrame(gameLoop);
  
  const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 100ms
  lastTime = currentTime;
  
  updateGame(deltaTime);
  render();
}

/**
 * Start the game
 */
init();
gameLoop(performance.now());