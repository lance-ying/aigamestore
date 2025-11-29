/**
 * Input handling and control modes
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, logInput, logGameInfo, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './entities.js';

const keys = {};

/**
 * Setup input listeners
 */
export function setupInput() {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  document.addEventListener('mousemove', handleMouseMove);
}

/**
 * Handle mouse movement for camera control
 */
function handleMouseMove(event) {
  // Get mouse position relative to canvas center
  const canvas = gameState.renderer.domElement;
  const rect = canvas.getBoundingClientRect();
  
  // Calculate normalized mouse position (-1 to 1)
  const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const mouseY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  
  // Update game state with mouse position
  gameState.mouseX = mouseX;
  gameState.mouseY = mouseY;
}

/**
 * Handle key down events
 */
function handleKeyDown(event) {
  logInput('keydown', event.key, event.keyCode);
  keys[event.keyCode] = true;
  
  // Phase control keys
  if (event.keyCode === 13 && gameState.gamePhase === 'START') { // ENTER
    startGame();
  }
  
  if (event.keyCode === 27) { // ESC
    if (gameState.gamePhase === 'PLAYING') {
      gameState.gamePhase = 'PAUSED';
      logGameInfo('PAUSED');
    } else if (gameState.gamePhase === 'PAUSED') {
      gameState.gamePhase = 'PLAYING';
      logGameInfo('PLAYING');
    }
  }
  
  if (event.keyCode === 82) { // R
    if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE' || gameState.gamePhase === 'PAUSED') {
      resetGame();
    }
  }
  
  // Gameplay keys (only in PLAYING phase)
  if (gameState.gamePhase === 'PLAYING' && gameState.player) {
    if (event.keyCode === 32) { // Space
      gameState.player.jump();
    }
    if (event.keyCode === 90) { // Z
      gameState.player.attack();
    }
    if (event.keyCode === 16) { // Shift
      gameState.player.useSpecial();
    }
  }
}

/**
 * Handle key up events
 */
function handleKeyUp(event) {
  logInput('keyup', event.key, event.keyCode);
  keys[event.keyCode] = false;
}

/**
 * Process continuous input (called every frame)
 */
export function processInput() {
  if (gameState.gamePhase !== 'PLAYING' || !gameState.player) return;
  
  // Use TEST mode AI or human input
  if (gameState.controlMode === 'HUMAN') {
    processHumanInput();
  } else if (gameState.controlMode === 'TEST_1') {
    processTest1Input();
  } else if (gameState.controlMode === 'TEST_2') {
    processTest2Input();
  }
}

/**
 * Process human player input
 */
function processHumanInput() {
  const player = gameState.player;
  
  // Movement
  const moveDirection = new THREE.Vector3(0, 0, 0);
  
  if (keys[38] || keys[87]) { // Up Arrow or W
    moveDirection.z -= 1;
  }
  if (keys[40] || keys[83]) { // Down Arrow or S
    moveDirection.z += 1;
  }
  if (keys[37] || keys[65]) { // Left Arrow or A
    moveDirection.x -= 1;
  }
  if (keys[39] || keys[68]) { // Right Arrow or D
    moveDirection.x += 1;
  }
  
  if (moveDirection.lengthSq() > 0) {
    player.move(moveDirection);
  }
}

/**
 * Process TEST_1 input (basic movement and combat testing)
 */
function processTest1Input() {
  const player = gameState.player;
  gameState.testModeTimer += gameState.deltaTime;
  
  // Move in a pattern and attack enemies
  const movePattern = Math.sin(gameState.testModeTimer * 0.5);
  const moveDirection = new THREE.Vector3(movePattern, 0, Math.cos(gameState.testModeTimer * 0.5));
  player.move(moveDirection);
  
  // Attack frequently
  if (gameState.testModeTimer % 0.5 < gameState.deltaTime) {
    player.attack();
  }
  
  // Jump occasionally
  if (gameState.testModeTimer % 3 < gameState.deltaTime && player.onGround) {
    player.jump();
  }
  
  // Use special when available
  if (player.specialCooldown <= 0 && gameState.enemies.length > 2) {
    player.useSpecial();
  }
}

/**
 * Process TEST_2 input (win condition testing)
 */
function processTest2Input() {
  const player = gameState.player;
  gameState.testModeTimer += gameState.deltaTime;
  
  // Find nearest enemy or teleporter
  let target = null;
  let minDistance = Infinity;
  
  // Check for teleporter first
  if (gameState.teleporter) {
    target = gameState.teleporter.mesh.position;
    minDistance = player.mesh.position.distanceTo(target);
  } else {
    // Find nearest enemy
    for (const enemy of gameState.enemies) {
      const distance = player.mesh.position.distanceTo(enemy.mesh.position);
      if (distance < minDistance) {
        minDistance = distance;
        target = enemy.mesh.position;
      }
    }
  }
  
  // Move towards target
  if (target) {
    const direction = new THREE.Vector3()
      .subVectors(target, player.mesh.position)
      .normalize();
    direction.y = 0;
    player.move(direction);
    
    // Attack if enemy is close
    if (!gameState.teleporter && minDistance < 8) {
      player.attack();
    }
    
    // Use special ability aggressively
    if (player.specialCooldown <= 0 && gameState.enemies.length > 0) {
      player.useSpecial();
    }
  }
  
  // Jump occasionally to avoid getting stuck
  if (gameState.testModeTimer % 2 < gameState.deltaTime && player.onGround) {
    player.jump();
  }
}

/**
 * Start the game
 */
function startGame() {
  gameState.gamePhase = 'PLAYING';
  logGameInfo('PLAYING', { controlMode: gameState.controlMode });
}

/**
 * Reset game to start screen
 */
function resetGame() {
  // Clear all entities
  if (gameState.player) {
    gameState.player.destroy();
    gameState.player = null;
  }
  
  gameState.enemies.forEach(enemy => enemy.destroy());
  gameState.enemies = [];
  
  gameState.projectiles.forEach(proj => proj.destroy());
  gameState.projectiles = [];
  
  gameState.items.forEach(item => item.destroy());
  gameState.items = [];
  
  gameState.particles.forEach(particle => particle.destroy());
  gameState.particles = [];
  
  if (gameState.teleporter) {
    gameState.teleporter.destroy();
    gameState.teleporter = null;
  }
  
  // Reset game state
  gameState.score = 0;
  gameState.killCount = 0;
  gameState.difficultyMultiplier = 1.0;
  gameState.enemySpawnTimer = 0;
  gameState.gameTime = 0;
  gameState.testModeTimer = 0;
  gameState.gamePhase = 'START';
  gameState.mouseX = 0;
  gameState.mouseY = 0;
  
  logGameInfo('START');
}

// Expose setControlMode globally
if (typeof window !== 'undefined') {
  window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    logGameInfo('control_mode_changed', { mode });
    
    // Update button states
    const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
    buttons.forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.classList.remove('active');
      }
    });
    
    const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'human' : mode.toLowerCase()}ModeBtn`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  };
}