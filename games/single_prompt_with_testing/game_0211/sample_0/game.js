// game.js - Main game loop and p5.js instance

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_CONFIG, resetGameState, getGameState } from './globals.js';
import { Player, Enemy, GroundTarget, PowerUp } from './entities.js';
import { updateParticles, renderParticles } from './particles.js';
import { updateTargetLock } from './physics.js';
import { handleKeyPress, handleKeyRelease, processPlayerInput, processAutomatedInput } from './input.js';
import { renderStartScreen, renderHUD, renderPausedOverlay, renderGameOver, renderStarfield } from './ui.js';

const p5 = window.p5;
let gameInstance;

// Initialize the game
export function initGame(p) {
  // Create player
  gameState.player = new Player(100, CANVAS_HEIGHT / 2);
  
  // Create initial ground targets
  for (let i = 0; i < GAME_CONFIG.groundTargetCount; i++) {
    const x = 200 + Math.random() * 300;
    const y = CANVAS_HEIGHT - 40 - Math.random() * 30;
    const types = ['tank', 'turret', 'installation'];
    const type = types[Math.floor(Math.random() * types.length)];
    new GroundTarget(x, y, type);
  }
  
  // Spawn initial enemies
  for (let i = 0; i < 3; i++) {
    spawnEnemy(p);
  }
}

// Spawn an enemy
function spawnEnemy(p) {
  if (gameState.enemies.length >= GAME_CONFIG.maxEnemies) return;
  
  const x = CANVAS_WIDTH + 50;
  const y = 50 + Math.random() * (CANVAS_HEIGHT - 150);
  const types = ['fighter', 'bomber', 'interceptor'];
  const type = types[Math.floor(Math.random() * types.length)];
  new Enemy(x, y, type);
}

// Spawn a power-up
function spawnPowerUp(p) {
  const x = CANVAS_WIDTH + 50;
  const y = 50 + Math.random() * (CANVAS_HEIGHT - 100);
  const types = ['health', 'shield', 'missiles', 'score'];
  const type = types[Math.floor(Math.random() * types.length)];
  new PowerUp(x, y, type);
}

// Update game logic
function updateGame(p) {
  // Process input based on control mode
  if (gameState.controlMode === "HUMAN") {
    processPlayerInput(p);
  } else {
    processAutomatedInput(p);
  }
  
  // Update player
  if (gameState.player) {
    gameState.player.update(p);
  }
  
  // Update enemies
  for (let i = gameState.enemies.length - 1; i >= 0; i--) {
    gameState.enemies[i].update(p);
  }
  
  // Update ground targets
  for (let i = gameState.groundTargets.length - 1; i >= 0; i--) {
    gameState.groundTargets[i].update(p);
  }
  
  // Update bullets
  for (let i = gameState.bullets.length - 1; i >= 0; i--) {
    gameState.bullets[i].update(p);
  }
  
  // Update enemy bullets
  for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
    gameState.enemyBullets[i].update(p);
  }
  
  // Update missiles
  for (let i = gameState.missiles.length - 1; i >= 0; i--) {
    gameState.missiles[i].update(p);
  }
  
  // Update power-ups
  for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
    gameState.powerUps[i].update(p);
  }
  
  // Update particles and explosions
  updateParticles();
  
  // Update target lock
  updateTargetLock(p);
  
  // Spawn enemies
  gameState.enemySpawnTimer++;
  if (gameState.enemySpawnTimer >= GAME_CONFIG.enemySpawnRate) {
    spawnEnemy(p);
    gameState.enemySpawnTimer = 0;
  }
  
  // Spawn power-ups
  gameState.powerUpSpawnTimer++;
  if (gameState.powerUpSpawnTimer >= GAME_CONFIG.powerUpSpawnRate) {
    spawnPowerUp(p);
    gameState.powerUpSpawnTimer = 0;
  }
  
  // Missile reload
  if (gameState.player && gameState.player.missiles < gameState.player.maxMissiles) {
    gameState.missileReloadTimer++;
    if (gameState.missileReloadTimer >= GAME_CONFIG.missileReloadTime) {
      gameState.player.missiles++;
      gameState.missileReloadTimer = 0;
    }
  }
  
  // Update mission progress
  gameState.missionProgress = Math.min(100, (gameState.score / GAME_CONFIG.winScore) * 100);
  
  // Check win condition
  if (gameState.score >= GAME_CONFIG.winScore) {
    gameState.gamePhase = "GAME_OVER_WIN";
  }
}

// Render game
function renderGame(p) {
  // Background
  p.background(10, 15, 30);
  renderStarfield(p, true);
  
  // Ground
  p.fill(40, 60, 40);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  
  // Mountains in background
  p.fill(30, 50, 30);
  p.beginShape();
  p.vertex(0, CANVAS_HEIGHT - 50);
  for (let x = 0; x < CANVAS_WIDTH; x += 50) {
    p.vertex(x, CANVAS_HEIGHT - 50 - Math.random() * 40);
  }
  p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT - 50);
  p.endShape(p.CLOSE);
  
  // Render ground targets
  for (const target of gameState.groundTargets) {
    target.render(p);
  }
  
  // Render power-ups
  for (const powerUp of gameState.powerUps) {
    powerUp.render(p);
  }
  
  // Render enemies
  for (const enemy of gameState.enemies) {
    enemy.render(p);
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render bullets
  for (const bullet of gameState.bullets) {
    bullet.render(p);
  }
  
  // Render enemy bullets
  for (const bullet of gameState.enemyBullets) {
    bullet.render(p);
  }
  
  // Render missiles
  for (const missile of gameState.missiles) {
    missile.render(p);
  }
  
  // Render particles
  renderParticles(p);
}

// Main p5.js instance
gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    resetGameState();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
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
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        renderHUD(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderHUD(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderHUD(p);
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPress(p);
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Log mode change
  if (gameInstance && gameInstance.logs && gameInstance.logs.game_info) {
    gameInstance.logs.game_info.push({
      data: { controlMode: mode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
};