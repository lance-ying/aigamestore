// game.js - Main game loop and p5.js instance

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, LEVELS } from './globals.js';
import { Player, Enemy, Gem, Platform, Particle } from './entities.js';
import { handleKeyPress, handleKeyRelease, handlePlayerInput } from './input.js';
import { renderStartScreen, renderUI, renderPausedOverlay, renderGameOver, renderBackground, renderLevelSelect, renderLevelComplete } from './ui.js';
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
    gameState.gamePhase = "LEVEL_SELECT";
    gameState.controlMode = "HUMAN";
    gameState.currentLevel = 1;
    
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
      case "LEVEL_SELECT":
        renderLevelSelect(p);
        break;
        
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        updateCamera();
        renderGame(p);
        renderUI(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
        
      case "LEVEL_COMPLETE":
        renderGame(p);
        renderLevelComplete(p);
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

function initializeLevel(p, levelId) {
  const levelData = LEVELS[levelId - 1];
  if (!levelData) return;
  
  gameState.currentLevelData = levelData;
  gameState.worldWidth = levelData.worldWidth;
  gameState.totalGems = levelData.gemCount;
  
  // Clear all entities
  gameState.entities = [];
  gameState.platforms = [];
  gameState.enemies = [];
  gameState.gems = [];
  gameState.particles = [];
  
  // Create platforms spread across the world
  const platformSpacing = levelData.worldWidth / levelData.platformCount;
  for (let i = 0; i < levelData.platformCount; i++) {
    const x = 50 + i * platformSpacing + (Math.random() - 0.5) * 60;
    const y = 100 + Math.sin(i * 0.5) * 100 + Math.random() * 40;
    const width = 80 + Math.random() * 60;
    new Platform(x, y, width, 20);
  }
  
  // Create player at start
  new Player(100, 200);
  
  // Create enemies distributed across platforms
  const enemyPlatforms = gameState.platforms.slice(1); // Skip first platform (player spawn)
  let basicCount = levelData.enemyTypes.basic;
  let toughCount = levelData.enemyTypes.tough;
  
  for (let i = 0; i < levelData.enemyCount && i < enemyPlatforms.length; i++) {
    const platform = enemyPlatforms[i];
    const isTough = toughCount > 0 && (basicCount === 0 || Math.random() > 0.5);
    
    if (isTough) {
      toughCount--;
    } else {
      basicCount--;
    }
    
    new Enemy(
      platform.x + platform.width / 2,
      platform.y - 15,
      i,
      isTough ? "TOUGH" : "BASIC"
    );
  }
  
  // Create gems scattered across platforms
  for (let i = 0; i < levelData.gemCount; i++) {
    const platformIndex = Math.floor(Math.random() * gameState.platforms.length);
    const platform = gameState.platforms[platformIndex];
    const offsetX = (Math.random() - 0.5) * (platform.width - 20);
    new Gem(
      platform.x + platform.width / 2 + offsetX,
      platform.y - 25
    );
  }
  
  // Reset game state
  gameState.score = 0;
  gameState.gemsCollected = 0;
  gameState.enemiesDefeated = 0;
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  gameState.cameraShakeX = 0;
  gameState.cameraShakeY = 0;
}

function updateCamera() {
  if (!gameState.player) return;
  
  // Smooth camera follow
  const targetX = gameState.player.x - CANVAS_WIDTH / 2;
  gameState.cameraX += (targetX - gameState.cameraX) * 0.1;
  
  // Clamp camera to world bounds
  gameState.cameraX = Math.max(0, Math.min(gameState.cameraX, gameState.worldWidth - CANVAS_WIDTH));
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
  
  // Apply camera offset and shake
  p.translate(-gameState.cameraX + gameState.cameraShakeX, gameState.cameraShakeY);
  
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
  initializeLevel(p, gameState.currentLevel);
}

export function loadLevel(p, levelId) {
  gameState.currentLevel = levelId;
  initializeLevel(p, levelId);
  gameState.gamePhase = "START";
}

export function nextLevel(p) {
  // Mark current level as completed
  gameState.levelsCompleted[gameState.currentLevel - 1] = true;
  
  if (gameState.currentLevel < LEVELS.length) {
    gameState.currentLevel++;
    loadLevel(p, gameState.currentLevel);
  } else {
    // All levels completed!
    gameState.gamePhase = "GAME_OVER_WIN";
  }
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