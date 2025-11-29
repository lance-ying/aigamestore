/**
 * Main game file - entry point and game loop
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, GAME_PHASE, CONTROL_MODE, GAME_CONFIG, logGameEvent } from './globals.js';
import { setupCamera, updateCamera, updateCameraShake } from './camera.js';
import { setupLighting } from './lighting.js';
import { setupRenderer } from './renderer.js';
import { setupWorld } from './world.js';
import { Player, Monster, Track, Scoutfly } from './entities.js';
import { updatePhysics, handleCollisions, isPositionValid } from './physics.js';
import { initInput, updateInput } from './input.js';
import { initUI, renderUI } from './ui.js';

/**
 * Initialize the game
 */
function init() {
  // Seed random for reproducibility
  Math.seedrandom(42);
  
  // Create scene
  gameState.scene = new THREE.Scene();
  gameState.scene.background = new THREE.Color(0x87CEEB);
  gameState.scene.fog = new THREE.Fog(0x87CEEB, 30, 100);
  
  // Setup systems
  setupRenderer();
  setupCamera();
  setupLighting();
  setupWorld();
  initInput();
  initUI();
  
  // Set initial game phase
  gameState.gamePhase = GAME_PHASE.START;
  
  // Log initial state
  logGameEvent('game_init', { 
    control_mode: gameState.controlMode 
  });
  
  console.log('Monster Hunter game initialized');
}

/**
 * Setup a new hunt
 */
function setupHunt() {
  // Clear existing entities
  if (gameState.player) {
    gameState.scene.remove(gameState.player.mesh);
  }
  if (gameState.monster) {
    gameState.scene.remove(gameState.monster.mesh);
  }
  gameState.tracks.forEach(track => {
    gameState.scene.remove(track.mesh);
    gameState.scene.remove(track.glow);
  });
  gameState.scoutflies.forEach(fly => {
    gameState.scene.remove(fly.mesh);
  });
  
  // Reset state
  gameState.tracks = [];
  gameState.scoutflies = [];
  gameState.tracksCollected = 0;
  gameState.monsterRevealed = false;
  gameState.score = 0;
  
  // Create player
  gameState.player = new Player(0, 1, 0);
  
  // Create monster at random location (far from player)
  let monsterX, monsterZ;
  do {
    monsterX = (Math.random() - 0.5) * GAME_CONFIG.WORLD_SIZE * 0.6;
    monsterZ = (Math.random() - 0.5) * GAME_CONFIG.WORLD_SIZE * 0.6;
  } while (Math.sqrt(monsterX * monsterX + monsterZ * monsterZ) < 20 || !isPositionValid(monsterX, monsterZ, 3));
  
  gameState.monster = new Monster(monsterX, 1.5, monsterZ);
  
  // Create tracks scattered around the map
  for (let i = 0; i < GAME_CONFIG.TRACK_COUNT; i++) {
    let trackX, trackZ;
    let attempts = 0;
    
    do {
      // Place tracks in a path from player to monster
      const t = (i + Math.random() * 2) / GAME_CONFIG.TRACK_COUNT;
      trackX = monsterX * t + (Math.random() - 0.5) * 10;
      trackZ = monsterZ * t + (Math.random() - 0.5) * 10;
      attempts++;
    } while (!isPositionValid(trackX, trackZ) && attempts < 10);
    
    if (attempts < 10) {
      const track = new Track(trackX, trackZ);
      gameState.tracks.push(track);
    }
  }
  
  // Create scoutflies
  for (let i = 0; i < 5; i++) {
    const fly = new Scoutfly(gameState.player.mesh.position.clone());
    gameState.scoutflies.push(fly);
  }
  
  logGameEvent('hunt_setup', {
    monster_position: { x: monsterX, z: monsterZ },
    track_count: gameState.tracks.length
  });
}

/**
 * Update game state
 */
function updateGame(deltaTime) {
  gameState.deltaTime = deltaTime;
  gameState.frameCount++;
  
  // Update input
  updateInput(deltaTime);
  
  // Update based on game phase
  switch (gameState.gamePhase) {
    case GAME_PHASE.START:
      // Waiting for player to start
      break;
      
    case GAME_PHASE.PLAYING:
      // Update all entities
      if (gameState.player) {
        gameState.player.update(deltaTime);
      }
      
      if (gameState.monster) {
        gameState.monster.update(deltaTime);
      }
      
      gameState.tracks.forEach(track => track.update(deltaTime));
      gameState.scoutflies.forEach(fly => fly.update(deltaTime));
      
      // Update physics
      updatePhysics(deltaTime);
      handleCollisions();
      
      // Update camera
      updateCamera();
      updateCameraShake(deltaTime);
      break;
      
    case GAME_PHASE.PAUSED:
      // Game is paused, don't update
      break;
      
    case GAME_PHASE.GAME_OVER_WIN:
    case GAME_PHASE.GAME_OVER_LOSE:
      // Game over, don't update
      break;
  }
  
  // Render UI
  renderUI();
}

/**
 * Render the scene
 */
function render() {
  if (gameState.renderer && gameState.scene && gameState.camera) {
    gameState.renderer.render(gameState.scene, gameState.camera);
  }
}

/**
 * Main game loop
 */
let lastTime = performance.now();
let gameInitialized = false;

function gameLoop(currentTime) {
  requestAnimationFrame(gameLoop);
  
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  
  // Clamp delta time to prevent large jumps
  const clampedDelta = Math.min(deltaTime, 0.1);
  
  // Initialize game on first frame
  if (!gameInitialized) {
    init();
    gameInitialized = true;
  }
  
  // Setup hunt when starting to play
  if (gameState.gamePhase === GAME_PHASE.PLAYING && !gameState.player) {
    setupHunt();
  }
  
  // Update and render
  updateGame(clampedDelta);
  render();
}

// Expose game instance globally
window.gameInstance = {
  start: () => {
    gameLoop(performance.now());
  }
};

// Set control mode function
window.setControlMode = (mode) => {
  gameState.controlMode = mode;
  logGameEvent('control_mode_change', { mode });
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(`${mode === CONTROL_MODE.HUMAN ? 'human' : mode.toLowerCase()}ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log('Control mode set to:', mode);
};

// Start the game
window.gameInstance.start();

console.log('Monster Hunter game started');