// game.js - Main game loop and p5.js instance

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TOTAL_GEMS_TO_WIN, 
         ENEMY_COUNT, PLATFORM_COUNT } from './globals.js';
import { Player, Enemy, Gem, Platform, Particle } from './entities.js';
import { handleKeyPress, handleKeyRelease, handlePlayerInput } from './input.js';
import { renderStartScreen, renderUI, renderPausedOverlay, renderGameOver, renderBackground } from './ui.js';
import { get_automated_testing_action } from './automated_testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize the logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42); // Set seed ONCE in setup
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.totalGems = TOTAL_GEMS_TO_WIN;
    
    // Initialize game
    initializeGame(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { 
        gamePhase: gameState.gamePhase,
        controlMode: gameState.controlMode 
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update frame count
    gameState.frameCount = p.frameCount;
    
    // Update delta time
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // CRITICAL: Exactly one background() call
    p.background(20, 20, 30);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        simulateKeyPress(p, action.keyCode);
      }
    }
    
    // Update and render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        renderUI(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
    
    // Update camera shake
    if (gameState.cameraShakeX !== 0 || gameState.cameraShakeY !== 0) {
      gameState.cameraShakeX *= 0.8;
      gameState.cameraShakeY *= 0.8;
      
      if (Math.abs(gameState.cameraShakeX) < 0.1) gameState.cameraShakeX = 0;
      if (Math.abs(gameState.cameraShakeY) < 0.1) gameState.cameraShakeY = 0;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPress(p);
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
});

function initializeGame(p) {
  // Clear all entities
  gameState.entities = [];
  gameState.platforms = [];
  gameState.enemies = [];
  gameState.gems = [];
  gameState.particles = [];
  
  // Create platforms
  const platformData = [
    { x: 50, y: 300, width: 100, height: 20 },
    { x: 200, y: 260, width: 120, height: 20 },
    { x: 380, y: 220, width: 100, height: 20 },
    { x: 120, y: 180, width: 100, height: 20 },
    { x: 300, y: 140, width: 120, height: 20 },
    { x: 480, y: 180, width: 100, height: 20 },
    { x: 50, y: 100, width: 100, height: 20 },
    { x: 400, y: 80, width: 150, height: 20 }
  ];
  
  platformData.forEach(data => {
    new Platform(data.x, data.y, data.width, data.height);
  });
  
  // Create player
  new Player(100, 330);
  
  // Create enemies on platforms
  const enemyPlatforms = [1, 2, 4, 5, 7];
  for (let i = 0; i < Math.min(ENEMY_COUNT, enemyPlatforms.length); i++) {
    const platform = platformData[enemyPlatforms[i]];
    new Enemy(
      platform.x + platform.width / 2,
      platform.y - 15,
      enemyPlatforms[i]
    );
  }
  
  // Create gems scattered on platforms
  const gemPlatforms = [0, 1, 2, 3, 4, 5, 6, 7];
  for (let i = 0; i < TOTAL_GEMS_TO_WIN; i++) {
    const platformIndex = gemPlatforms[i % gemPlatforms.length];
    const platform = platformData[platformIndex];
    const offsetX = (i % 3 - 1) * 30;
    new Gem(
      platform.x + platform.width / 2 + offsetX,
      platform.y - 25
    );
  }
  
  // Reset game state
  gameState.score = 0;
  gameState.gemsCollected = 0;
  gameState.enemiesDefeated = 0;
  gameState.cameraShakeX = 0;
  gameState.cameraShakeY = 0;
}

function updateGame(p) {
  // Handle player input
  if (gameState.controlMode === "HUMAN") {
    handlePlayerInput(gameState.player);
  }
  
  // Update player
  if (gameState.player) {
    gameState.player.update(p);
  }
  
  // Update enemies
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    gameState.enemies[i].update(p);
  }
  
  // Update gems
  for (let i = gameState.gems.length - 1; i >= 0; i--) {
    gameState.gems[i].update(p);
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    gameState.particles[i].update();
    if (gameState.particles[i].isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
}

function renderGame(p) {
  p.push();
  
  // Apply camera shake
  p.translate(gameState.cameraShakeX, gameState.cameraShakeY);
  
  // Render background
  renderBackground(p);
  
  // Render platforms
  gameState.platforms.forEach(platform => platform.render(p));
  
  // Render gems
  gameState.gems.forEach(gem => gem.render(p));
  
  // Render enemies
  gameState.enemies.forEach(enemy => enemy.render(p));
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render particles
  gameState.particles.forEach(particle => particle.render(p));
  
  p.pop();
}

export function resetGame(p) {
  initializeGame(p);
}

function simulateKeyPress(p, keyCode) {
  // Simulate a key press for automated testing
  p.keyCode = keyCode;
  
  switch(keyCode) {
    case 37: p.key = 'ArrowLeft'; break;
    case 38: p.key = 'ArrowUp'; break;
    case 39: p.key = 'ArrowRight'; break;
    case 40: p.key = 'ArrowDown'; break;
    case 32: p.key = ' '; break;
    case 90: p.key = 'z'; break;
    default: p.key = String.fromCharCode(keyCode);
  }
  
  handleKeyPress(p);
  
  // Auto-release after a short delay (simulate key tap)
  setTimeout(() => {
    handleKeyRelease(p);
  }, 50);
}

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button styles
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const btnId = mode === "HUMAN" ? "humanModeBtn" : 
                mode === "TEST_1" ? "test_1_ModeBtn" : 
                "test_2_ModeBtn";
  const btn = document.getElementById(btnId);
  if (btn) {
    btn.classList.add('active');
  }
  
  // Log control mode change
  if (gameInstance && gameInstance.logs) {
    gameInstance.logs.game_info.push({
      data: { controlMode: mode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
};

// Expose the game instance globally
window.gameInstance = gameInstance;