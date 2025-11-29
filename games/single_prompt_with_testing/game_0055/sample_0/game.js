// game.js - Main game loop and p5.js instance setup

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_CONSTANTS, initializeStars } from './globals.js';
import { Player } from './entities.js';
import { setupInput, handlePlayerInput, isKeyPressed } from './input.js';
import { updateParticles, renderParticles } from './particles.js';
import { updateSpawning, spawnInitialEnemies } from './spawning.js';
import { renderStartScreen, renderPausedOverlay, renderGameOver, renderGameUI, renderBackground } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    // Initialize background stars
    initializeStars();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup input handlers
    setupInput(p);
  };
  
  p.draw = function() {
    // Update frame count and delta time
    gameState.frameCount = p.frameCount;
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Apply slow motion effect
    const updateSpeed = gameState.slowMotion ? GAME_CONSTANTS.SLOW_MO_FACTOR : 1;
    
    // Background
    p.background(10, 10, 20);
    
    // Handle game phases
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        // Update game
        updateGame(p, updateSpeed);
        
        // Render game
        renderGame(p);
        
        // Render UI
        renderGameUI(p);
        break;
        
      case "PAUSED":
        // Render game (frozen)
        renderGame(p);
        renderGameUI(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
    
    // Handle automated testing
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode !== "HUMAN") {
      handleAutomatedTesting(p);
    }
  };
});

// Initialize game
export function initializeGame() {
  // Clear existing entities
  gameState.entities = [];
  gameState.enemies = [];
  gameState.powerups = [];
  gameState.particles = [];
  gameState.slashEffects = [];
  
  // Reset game metrics
  gameState.score = 0;
  gameState.enemiesDefeated = 0;
  gameState.survivalTime = 0;
  gameState.waveNumber = 1;
  gameState.enemySpawnTimer = 0;
  gameState.powerupSpawnTimer = 0;
  gameState.gameTimeSeconds = 0;
  gameState.difficultyMultiplier = 1.0;
  gameState.enemySpawnInterval = GAME_CONSTANTS.ENEMY_SPAWN_INTERVAL;
  gameState.screenShake = 0;
  gameState.slowMotion = false;
  gameState.slowMoCharge = GAME_CONSTANTS.SLOW_MO_MAX;
  
  // Create player
  new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Spawn initial enemies
  spawnInitialEnemies(3);
  
  // Log game start
  if (gameInstance.logs && gameInstance.logs.game_info) {
    gameInstance.logs.game_info.push({
      data: { event: "game_initialized" },
      framecount: gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
}

function updateGame(p, speed) {
  // Handle input
  if (gameState.controlMode === "HUMAN") {
    handlePlayerInput(p);
  }
  
  // Update survival time
  gameState.survivalTime += gameState.deltaTime;
  gameState.gameTimeSeconds = Math.floor(gameState.survivalTime);
  
  // Update wave number
  gameState.waveNumber = Math.floor(gameState.survivalTime / 20) + 1;
  
  // Apply speed multiplier for updates
  for (let i = 0; i < speed; i += 0.1) {
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
      logPlayerInfo(p);
    }
    
    // Update enemies
    gameState.enemies.forEach(enemy => enemy.update(p));
    
    // Update power-ups
    gameState.powerups.forEach(powerup => powerup.update(p));
    
    // Update particles
    updateParticles();
    
    // Update spawning
    updateSpawning();
    
    // Update screen shake
    if (gameState.screenShake > 0) {
      gameState.screenShake--;
    }
  }
  
  // Check win condition (survive 120 seconds)
  if (gameState.survivalTime >= 120) {
    gameState.gamePhase = "GAME_OVER_WIN";
  }
}

function renderGame(p) {
  p.push();
  
  // Apply screen shake
  if (gameState.screenShake > 0) {
    const shakeX = (Math.random() - 0.5) * gameState.screenShake;
    const shakeY = (Math.random() - 0.5) * gameState.screenShake;
    p.translate(shakeX, shakeY);
  }
  
  // Render background
  renderBackground(p);
  
  // Render power-ups
  gameState.powerups.forEach(powerup => powerup.render(p));
  
  // Render enemies
  gameState.enemies.forEach(enemy => enemy.render(p));
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render particles and effects
  renderParticles(p);
  
  // Slow motion visual effect
  if (gameState.slowMotion) {
    p.fill(100, 150, 255, 30);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  
  p.pop();
}

function logPlayerInfo(p) {
  if (!gameState.player) return;
  
  // Log player position every 10 frames
  if (gameState.frameCount % 10 === 0 && p.logs && p.logs.player_info) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      health: gameState.player.health,
      score: gameState.score,
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleAutomatedTesting(p) {
  const action = get_automated_testing_action(gameState);
  
  if (action && action.keyCode) {
    // Simulate key press
    const keyCode = action.keyCode;
    
    // Execute action based on keyCode
    if (!gameState.player) return;
    
    switch (keyCode) {
      case 37: // Left
        gameState.player.move(-1, 0);
        break;
      case 38: // Up
        gameState.player.move(0, -1);
        break;
      case 39: // Right
        gameState.player.move(1, 0);
        break;
      case 40: // Down
        gameState.player.move(0, 1);
        break;
      case 32: // Space - Dash
        gameState.player.dash();
        break;
      case 90: // Z - Attack
        gameState.player.attack(p);
        break;
      case 16: // Shift - Slow motion
        if (gameState.slowMoCharge > 0) {
          gameState.slowMotion = true;
        }
        break;
    }
    
    // Log automated action
    if (p.logs && p.logs.inputs) {
      p.logs.inputs.push({
        input_type: 'automated',
        data: { keyCode: keyCode, mode: gameState.controlMode },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switcher
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                   mode === 'TEST_1' ? 'test_1_ModeBtn' : 'test_2_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};