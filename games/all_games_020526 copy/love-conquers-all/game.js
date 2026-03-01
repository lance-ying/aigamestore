// game.js - Main game loop and p5.js instance

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { Player, Boss } from './entities.js';
import { updateParticles, renderParticles } from './particles.js';
import { updatePhysics } from './physics.js';
import { handleKeyPress, handleKeyRelease, handleGameplayInput, handleMenuInput, generatePowerUpSelection } from './input.js';
import { renderStartScreen, renderBossSelect, renderPowerUpSelect, renderGameUI, renderGameOver } from './ui.js';

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
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update frame tracking
    gameState.frameCount = p.frameCount;
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Screen shake effect
    if (gameState.screenShake > 0) {
      p.translate(
        (Math.random() - 0.5) * gameState.screenShake,
        (Math.random() - 0.5) * gameState.screenShake
      );
      gameState.screenShake *= 0.9;
      if (gameState.screenShake < 0.1) gameState.screenShake = 0;
    }
    
    // Background
    p.background(10, 5, 20);
    
    // Flash effect
    if (gameState.flashIntensity > 0) {
      p.fill(255, 255, 255, gameState.flashIntensity);
      p.noStroke();
      p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      gameState.flashIntensity *= 0.8;
      if (gameState.flashIntensity < 1) gameState.flashIntensity = 0;
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "BOSS_SELECT":
        renderBossSelect(p);
        handleMenuInput(p);
        break;
        
      case "POWER_UP":
        // Generate power-ups if not already done
        if (gameState.availablePowerUps.length === 0) {
          generatePowerUpSelection();
        }
        renderPowerUpSelect(p);
        handleMenuInput(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        renderGameUI(p);
        handleGameplayInput(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderGameUI(p);
        // Removed: renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameUI(p);
        renderGameOver(p);
        break;
    }
  };
  
  function updateGame(p) {
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
    }
    
    // Update boss
    if (gameState.currentBoss) {
      gameState.currentBoss.update(p);
    }
    
    // Update physics
    updatePhysics();
    
    // Update particles
    updateParticles();
  }
  
  function renderGame(p) {
    // Background with stars
    for (let i = 0; i < 100; i++) {
      const x = (i * 137.5) % CANVAS_WIDTH;
      const y = (i * 113.2) % CANVAS_HEIGHT;
      const brightness = Math.sin(gameState.frameCount * 0.02 + i) * 50 + 100;
      p.fill(brightness);
      p.noStroke();
      p.circle(x, y, 2);
    }
    
    // Render projectiles
    gameState.enemyProjectiles.forEach(proj => proj.render(p));
    gameState.playerProjectiles.forEach(proj => proj.render(p));
    
    // Render boss
    if (gameState.currentBoss) {
      gameState.currentBoss.render(p);
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Render particles
    renderParticles(p);
  }
  
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
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const buttonMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const btnId = buttonMap[mode];
  if (btnId) {
    document.getElementById(btnId).classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};

// Helper function for star shape
p5.prototype.star = function(x, y, radius1, radius2, npoints) {
  const angle = (Math.PI * 2) / npoints;
  const halfAngle = angle / 2;
  
  this.beginShape();
  for (let a = -Math.PI / 2; a < Math.PI * 2 - Math.PI / 2; a += angle) {
    let sx = x + Math.cos(a) * radius1;
    let sy = y + Math.sin(a) * radius1;
    this.vertex(sx, sy);
    sx = x + Math.cos(a + halfAngle) * radius2;
    sy = y + Math.sin(a + halfAngle) * radius2;
    this.vertex(sx, sy);
  }
  this.endShape(this.CLOSE);
};