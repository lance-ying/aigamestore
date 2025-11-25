import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, INITIAL_SPEED, SPEED_INCREMENT, MAX_SPEED, WIN_SCORE } from './globals.js';
import { Player, Track } from './entities.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupRenderer } from './renderer.js';
import { setupLighting } from './lighting.js';
import { handleCollisions } from './physics.js';
import { spawnObstacles, updateEntities } from './spawner.js';
import { setupUI, renderUI } from './ui.js';
import { setupInput } from './input.js';
import { updateAI } from './ai.js';

function init() {
  // Setup Three.js scene
  gameState.scene = new THREE.Scene();
  gameState.scene.background = new THREE.Color(0x87CEEB);
  gameState.scene.fog = new THREE.Fog(0x87CEEB, 20, 80);
  
  setupCamera();
  setupRenderer();
  setupLighting();
  setupUI();
  setupInput();
  
  // Create tracks
  for (let i = 0; i < 3; i++) {
    gameState.tracks.push(new Track(i));
  }
  
  // Create player
  gameState.player = new Player(0, 1, 0);
  
  // Seed random
  Math.seedrandom(42);
  
  // Initialize game state
  gameState.gamePhase = "START";
  gameState.score = 0;
  gameState.distance = 0;
  gameState.gameSpeed = INITIAL_SPEED;
  gameState.frameCount = 0;
  
  // Log initial state
  window.logs.game_info.push({
    game_status: "START",
    data: {},
    framecount: 0,
    timestamp: Date.now()
  });
}

function updateGame(deltaTime) {
  gameState.deltaTime = deltaTime;
  gameState.frameCount++;
  
  if (gameState.gamePhase === "PLAYING") {
    // Update AI
    updateAI();
    
    // Update player
    if (gameState.player) {
      gameState.player.update(deltaTime);
    }
    
    // Update distance
    gameState.distance += gameState.gameSpeed;
    
    // Increase speed gradually
    if (gameState.gameSpeed < MAX_SPEED) {
      gameState.gameSpeed += SPEED_INCREMENT;
    }
    
    // Spawn and update entities
    spawnObstacles();
    updateEntities();
    
    // Check collisions
    handleCollisions();
    
    // Update camera
    updateCamera();
    
    // Check win condition
    if (gameState.score >= WIN_SCORE) {
      gameState.gamePhase = "GAME_OVER_WIN";
      window.logs.game_info.push({
        game_status: "GAME_OVER_WIN",
        data: { score: gameState.score, distance: gameState.distance },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Render
  if (gameState.renderer && gameState.scene && gameState.camera) {
    gameState.renderer.render(gameState.scene, gameState.camera);
  }
  
  // Render UI
  renderUI();
}

let lastTime = performance.now();

function gameLoop(currentTime) {
  requestAnimationFrame(gameLoop);
  
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  
  updateGame(deltaTime);
}

// Start game
init();
gameLoop();

// Expose game instance
window.gameInstance = { gameState };