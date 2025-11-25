import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, logs, LANE_CENTER } from './globals.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupRenderer, render } from './renderer.js';
import { setupLighting } from './lighting.js';
import { Player, TrackSection } from './entities.js';
import { updatePhysics, handleCollisions } from './physics.js';
import { spawnObstacles, spawnTrack } from './spawner.js';
import { setupUI, renderUI } from './ui.js';
import { setupInput, updateTestMode } from './input.js';

// Initialize game
function init() {
  // Seed random
  Math.seedrandom(42);
  
  // Setup scene
  gameState.scene = new THREE.Scene();
  gameState.scene.background = new THREE.Color(0x87CEEB);
  gameState.scene.fog = new THREE.Fog(0x87CEEB, 20, 60);
  
  // Setup three.js components
  setupCamera();
  setupRenderer();
  setupLighting();
  setupUI();
  setupInput();
  
  // Initialize track
  for (let i = 0; i < 5; i++) {
    const section = new TrackSection(i * 20 - 20);
    gameState.trackSections.push(section);
  }
  
  // Create player
  gameState.player = new Player(LANE_CENTER, 0.75, 0);
  
  // Log initial state
  logs.game_info.push({
    game_status: gameState.gamePhase,
    data: {},
    framecount: 0,
    timestamp: Date.now()
  });
  
  // Expose game instance
  window.gameInstance = {
    gameState,
    logs
  };
}

// Update game logic
function updateGame(deltaTime) {
  gameState.deltaTime = deltaTime;
  gameState.frameCount++;
  
  switch (gameState.gamePhase) {
    case "START":
      // Waiting for player to start
      break;
      
    case "PLAYING":
      // Update test mode AI
      updateTestMode();
      
      // Update physics
      updatePhysics(deltaTime);
      
      // Handle collisions
      handleCollisions();
      
      // Spawn new obstacles and track
      spawnObstacles();
      spawnTrack();
      
      // Update camera
      updateCamera();
      
      break;
      
    case "PAUSED":
      // Game is paused
      break;
      
    case "GAME_OVER_WIN":
    case "GAME_OVER_LOSE":
      // Game over
      if (!logs.game_info.find(log => log.game_status === gameState.gamePhase)) {
        logs.game_info.push({
          game_status: gameState.gamePhase,
          data: { 
            score: gameState.score,
            distance: gameState.distance
          },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
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

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  ['HUMAN', 'TEST_1', 'TEST_2'].forEach(m => {
    const btn = document.getElementById(`${m === 'HUMAN' ? 'human' : m.toLowerCase()}ModeBtn`);
    if (btn) {
      btn.classList.toggle('active', m === mode);
    }
  });
  
  logs.game_info.push({
    game_status: 'CONTROL_MODE_CHANGE',
    data: { mode },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
};

// Start game
init();
gameLoop();