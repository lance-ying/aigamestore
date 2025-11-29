// game.js - Main game loop with three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  GAME_PHASES,
  CONTROL_MODES,
  getGameState 
} from './globals.js';

import { Player } from './entities.js';
import { setupRenderer } from './renderer.js';
import { setupCamera, updateCamera } from './camera.js';
import { setupLighting } from './lighting.js';
import { handleInput, setupInputHandlers, isKeyPressed } from './input.js';
import { createLevel } from './level.js';

// Initialize logs
window.logs = {
  game_info: [],
  player_info: [],
  inputs: []
};

// Setup scene
function setupScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 20, 80);
  gameState.scene = scene;
}

// Initialize game
function init() {
  // Seed random
  Math.seedrandom(42);
  
  // Setup three.js
  setupScene();
  setupRenderer();
  setupCamera();
  setupLighting();
  
  // Create UI canvas
  createUICanvas();
  
  // Setup input handlers
  setupInputHandlers();
  
  // Initialize game
  gameState.currentLevel = 1;
  createLevel();
  gameState.player = new Player(0, 2, 5);
  
  // Log initial state
  window.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, level: gameState.currentLevel },
    framecount: 0,
    timestamp: Date.now()
  });
  
  // Log initial player position
  window.logs.player_info.push({
    screen_x: 100,
    screen_y: 300,
    game_x: 0,
    game_y: 2,
    game_z: 5,
    framecount: 0,
    timestamp: Date.now()
  });
}

// Create 2D UI canvas overlay
let uiCanvas, uiContext;
function createUICanvas() {
  uiCanvas = document.createElement('canvas');
  uiCanvas.width = CANVAS_WIDTH;
  uiCanvas.height = CANVAS_HEIGHT;
  uiCanvas.style.position = 'absolute';
  uiCanvas.style.top = '0';
  uiCanvas.style.left = '0';
  uiCanvas.style.pointerEvents = 'none';
  uiCanvas.style.zIndex = '1000';
  uiCanvas.style.margin = '0';
  uiCanvas.style.padding = '0';
  
  gameState.gameContainer.appendChild(uiCanvas);
  uiContext = uiCanvas.getContext('2d');
}

// Handle phase control keys
document.addEventListener('keydown', (event) => {
  if (event.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
    startGame();
  }
  
  if (event.keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      window.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PAUSED },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      window.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  if (event.keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame();
    }
  }
  
  // Gameplay keys
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (event.keyCode === 32) { // SPACE
      if (gameState.player) {
        gameState.player.jump();
      }
    }
    
    if (event.keyCode === 90) { // Z
      if (gameState.player) {
        gameState.player.karateKick();
      }
    }
  }
});

function startGame() {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.testFrameCount = 0;
  gameState.testPhase = 0;
  
  window.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.PLAYING, level: gameState.currentLevel },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

// Update game
function updateGame() {
  gameState.frameCount++;
  
  // Handle input
  handleInput();
  
  // Update player
  if (gameState.player) {
    gameState.player.update();
  }
  
  // Update enemies
  gameState.enemies.forEach(enemy => {
    enemy.update();
  });
  
  // Update coins
  gameState.coins.forEach(coin => {
    coin.update();
  });
  
  // Update checkpoints
  gameState.checkpoints.forEach(checkpoint => {
    checkpoint.update();
  });
  
  // Update swing points
  gameState.swingPoints.forEach(swing => {
    swing.update();
  });
  
  // Update portal
  if (gameState.portal) {
    gameState.portal.update();
  }
  
  // Update camera
  updateCamera();
}

// Render UI
function renderUI() {
  uiContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen();
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderHUD();
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderHUD();
    renderPausedOverlay();
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOver();
  }
}

function renderStartScreen() {
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.7)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  uiContext.fillStyle = 'white';
  uiContext.font = 'bold 32px Arial';
  uiContext.textAlign = 'center';
  uiContext.fillText('SpongeBob:', CANVAS_WIDTH / 2, 70);
  uiContext.fillText('The Cosmic Shake', CANVAS_WIDTH / 2, 110);
  
  uiContext.font = '14px Arial';
  uiContext.fillText('Navigate cosmic platforms in 3D and collect coins!', CANVAS_WIDTH / 2, 150);
  uiContext.fillText('6 levels of increasing difficulty', CANVAS_WIDTH / 2, 170);
  
  uiContext.font = '12px Arial';
  uiContext.textAlign = 'left';
  uiContext.fillText('Controls:', 200, 205);
  uiContext.fillText('WASD or Arrow Keys - Move in 3D', 200, 225);
  uiContext.fillText('Space - Jump', 200, 245);
  uiContext.fillText('Z - Karate Kick (unlock at 25 coins)', 200, 265);
  uiContext.fillText('Shift - Hook-Swing (unlock at 100 coins)', 200, 285);
  
  uiContext.fillStyle = 'yellow';
  uiContext.textAlign = 'center';
  uiContext.font = '20px Arial';
  if (gameState.frameCount % 60 < 30) {
    uiContext.fillText('PRESS ENTER TO START', CANVAS_WIDTH / 2, 340);
  }
  
  // Show current level
  uiContext.fillStyle = 'lightblue';
  uiContext.font = 'bold 16px Arial';
  uiContext.fillText(`Level ${gameState.currentLevel} of ${gameState.maxLevel}`, CANVAS_WIDTH / 2, 370);
  
  // Show difficulty
  let difficulty = '';
  if (gameState.currentLevel <= 2) difficulty = 'EASY';
  else if (gameState.currentLevel <= 4) difficulty = 'MEDIUM';
  else difficulty = 'HARD';
  uiContext.fillStyle = difficulty === 'EASY' ? 'lightgreen' : difficulty === 'MEDIUM' ? 'yellow' : 'orange';
  uiContext.font = '14px Arial';
  uiContext.fillText(difficulty, CANVAS_WIDTH / 2, 390);
}

function renderHUD() {
  // Level indicator
  uiContext.fillStyle = 'white';
  uiContext.textAlign = 'right';
  uiContext.font = 'bold 18px Arial';
  uiContext.fillText(`Level ${gameState.currentLevel}/${gameState.maxLevel}`, CANVAS_WIDTH - 20, 25);
  
  // Health hearts
  uiContext.fillStyle = 'red';
  for (let i = 0; i < gameState.health; i++) {
    uiContext.beginPath();
    const x = 20 + i * 30;
    const y = 20;
    uiContext.moveTo(x, y + 5);
    uiContext.bezierCurveTo(x - 5, y, x - 10, y + 5, x, y + 15);
    uiContext.bezierCurveTo(x + 10, y + 5, x + 5, y, x, y + 5);
    uiContext.fill();
  }
  
  // Score
  uiContext.fillStyle = 'white';
  uiContext.textAlign = 'left';
  uiContext.font = '16px Arial';
  uiContext.fillText(`Coins: ${Math.floor(gameState.score / 10)}`, 20, 60);
  
  // Objective display for Level 1
  if (gameState.currentLevel === 1) {
    uiContext.fillStyle = 'rgba(255, 255, 255, 0.9)';
    uiContext.textAlign = 'center';
    uiContext.font = 'bold 14px Arial';
    uiContext.fillText('OBJECTIVE: Collect coins and reach the portal!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    uiContext.font = '12px Arial';
    uiContext.fillText('Unlock all abilities (25, 50, 100 coins) to enter the portal', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  }
  
  // Abilities
  uiContext.font = '12px Arial';
  uiContext.textAlign = 'left';
  let yOffset = 80;
  
  if (gameState.abilities.karateKick) {
    uiContext.fillStyle = 'yellow';
    uiContext.fillText('✓ Karate Kick (Z)', 20, yOffset);
    yOffset += 20;
  }
  
  if (gameState.abilities.doubleJump) {
    uiContext.fillStyle = 'yellow';
    uiContext.fillText('✓ Double Jump', 20, yOffset);
    yOffset += 20;
  }
  
  if (gameState.abilities.hookSwing) {
    uiContext.fillStyle = 'yellow';
    uiContext.fillText('✓ Hook-Swing (Shift)', 20, yOffset);
    yOffset += 20;
  }
  
  // Next unlock
  if (!gameState.abilities.karateKick) {
    uiContext.fillStyle = 'rgba(255, 255, 255, 0.7)';
    uiContext.fillText(`Next: Karate Kick (${gameState.abilityThresholds.karateKick / 10} coins)`, 20, yOffset);
  } else if (!gameState.abilities.doubleJump) {
    uiContext.fillStyle = 'rgba(255, 255, 255, 0.7)';
    uiContext.fillText(`Next: Double Jump (${gameState.abilityThresholds.doubleJump / 10} coins)`, 20, yOffset);
  } else if (!gameState.abilities.hookSwing) {
    uiContext.fillStyle = 'rgba(255, 255, 255, 0.7)';
    uiContext.fillText(`Next: Hook-Swing (${gameState.abilityThresholds.hookSwing / 10} coins)`, 20, yOffset);
  }
}

function renderPausedOverlay() {
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  uiContext.fillStyle = 'white';
  uiContext.textAlign = 'center';
  uiContext.font = 'bold 40px Arial';
  uiContext.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  uiContext.font = '16px Arial';
  uiContext.fillText('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function renderGameOver() {
  uiContext.fillStyle = 'rgba(0, 0, 0, 0.8)';
  uiContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  uiContext.textAlign = 'center';
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    uiContext.fillStyle = '#00ff00';
    uiContext.font = 'bold 48px Arial';
    
    if (gameState.currentLevel >= gameState.maxLevel) {
      uiContext.fillText('GAME COMPLETE!', CANVAS_WIDTH / 2, 100);
      uiContext.fillStyle = 'white';
      uiContext.font = '20px Arial';
      uiContext.fillText('You finished all levels!', CANVAS_WIDTH / 2, 160);
    } else {
      uiContext.fillText('LEVEL COMPLETE!', CANVAS_WIDTH / 2, 100);
      uiContext.fillStyle = 'white';
      uiContext.font = '20px Arial';
      uiContext.fillText(`Level ${gameState.currentLevel} finished!`, CANVAS_WIDTH / 2, 160);
    }
    
    uiContext.fillText(`Score: ${Math.floor(gameState.score / 10)} coins`, CANVAS_WIDTH / 2, 200);
  } else {
    uiContext.fillStyle = '#ff6464';
    uiContext.font = 'bold 48px Arial';
    uiContext.fillText('GAME OVER', CANVAS_WIDTH / 2, 120);
    
    uiContext.fillStyle = 'white';
    uiContext.font = '20px Arial';
    uiContext.fillText(`You collected: ${Math.floor(gameState.score / 10)} coins`, CANVAS_WIDTH / 2, 180);
  }
  
  uiContext.fillStyle = 'white';
  uiContext.font = '18px Arial';
  uiContext.fillText('Press R to restart', CANVAS_WIDTH / 2, 260);
  
  // Show abilities
  uiContext.font = '14px Arial';
  let yPos = 300;
  uiContext.fillText('Abilities Unlocked:', CANVAS_WIDTH / 2, yPos);
  yPos += 25;
  
  if (gameState.abilities.karateKick) {
    uiContext.fillStyle = 'yellow';
    uiContext.fillText('✓ Karate Kick', CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  }
  if (gameState.abilities.doubleJump) {
    uiContext.fillStyle = 'yellow';
    uiContext.fillText('✓ Double Jump', CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  }
  if (gameState.abilities.hookSwing) {
    uiContext.fillStyle = 'yellow';
    uiContext.fillText('✓ Hook-Swing', CANVAS_WIDTH / 2, yPos);
  }
}

function resetGame() {
  // Clear scene
  while(gameState.scene.children.length > 0) { 
    gameState.scene.remove(gameState.scene.children[0]); 
  }
  
  // If won current level and not at max, advance to next level
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN && gameState.currentLevel < gameState.maxLevel) {
    gameState.currentLevel++;
  } else {
    // Reset to level 1
    gameState.currentLevel = 1;
  }
  
  // Reset game state
  gameState.score = 0;
  gameState.health = gameState.maxHealth;
  gameState.abilities = {
    doubleJump: false,
    karateKick: false,
    hookSwing: false
  };
  gameState.lastCheckpoint = { x: 0, y: 2, z: 5 };
  gameState.invincible = false;
  gameState.invincibilityTimer = 0;
  gameState.testFrameCount = 0;
  gameState.testPhase = 0;
  
  // Recreate lighting
  setupLighting();
  
  // Recreate level and player
  createLevel();
  gameState.player = new Player(0, 2, 5);
  
  // Return to start screen
  gameState.gamePhase = GAME_PHASES.START;
  
  window.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.START, event: "reset", level: gameState.currentLevel },
    framecount: gameState.frameCount,
    timestamp: Date.now()
  });
}

// Main game loop
function gameLoop() {
  requestAnimationFrame(gameLoop);
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    updateGame();
  }
  
  // Render 3D scene
  if (gameState.renderer && gameState.scene && gameState.camera) {
    gameState.renderer.render(gameState.scene, gameState.camera);
  }
  
  // Render UI
  renderUI();
}

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  gameState.testFrameCount = 0;
  gameState.testPhase = 0;
  
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === CONTROL_MODES.HUMAN) {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === CONTROL_MODES.TEST_1) {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === CONTROL_MODES.TEST_2) {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};

// Start game
init();
gameLoop();