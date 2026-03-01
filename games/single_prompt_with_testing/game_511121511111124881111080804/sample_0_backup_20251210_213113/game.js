// game.js - Main game file with p5.js instance mode

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COLORS,
  initializeLogs,
  getGameState
} from './globals.js';
import { handleKeyPress, handleKeyRelease, processPlayerInput, resetKeyStates } from './input.js';
import { renderStartScreen, renderHUD, renderPausedOverlay, renderGameOver, renderTutorial } from './ui.js';
import { loadLevel } from './level.js';
import { updateParticles, renderParticles } from './particles.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function - called once at start
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42); // Set seed once for reproducibility
    
    // Initialize logs
    initializeLogs(p);
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    // Log initial state
    p.logs.game_info.push({
      data: { 
        gamePhase: gameState.gamePhase,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function - called every frame
  p.draw = function() {
    // Update frame count and delta time
    gameState.frameCount = p.frameCount;
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // CRITICAL: Exactly one background call at top of draw
    p.background(...COLORS.background);
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        renderHUD(p);
        renderTutorial(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderHUD(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };
  
  // Key press handler
  p.keyPressed = function() {
    handleKeyPress(p);
  };
  
  // Key release handler
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
  
  // Update game logic
  function updateGame(p) {
    // Process input (human or automated)
    processPlayerInput(p);
    
    // Update level timer
    gameState.levelTime++;
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
    }
    
    // Update platforms
    for (const platform of gameState.platforms) {
      platform.update(p);
    }
    
    // Update grapple points
    for (const point of gameState.grapplePoints) {
      point.update(p);
    }
    
    // Update collectibles
    for (const collectible of gameState.collectibles) {
      collectible.update(p);
    }
    
    // Update particles
    updateParticles();
  }
  
  // Render game
  function renderGame(p) {
    // Render in correct order (back to front)
    
    // 1. Background gradient
    renderBackground(p);
    
    // 2. Platforms
    for (const platform of gameState.platforms) {
      platform.render(p);
    }
    
    // 3. Grapple points
    for (const point of gameState.grapplePoints) {
      point.render(p);
    }
    
    // 4. Collectibles
    for (const collectible of gameState.collectibles) {
      collectible.render(p);
    }
    
    // 5. Player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // 6. Particles (effects on top)
    renderParticles(p);
  }
  
  // Render background with gradient effect
  function renderBackground(p) {
    // Simple gradient effect
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const inter = y / CANVAS_HEIGHT;
      const r = COLORS.background[0] + inter * 20;
      const g = COLORS.background[1] + inter * 20;
      const b = COLORS.background[2] + inter * 30;
      p.stroke(r, g, b);
      p.line(0, y, CANVAS_WIDTH, y);
    }
  }
}, document.body);

// Start game function
export function startGame(p) {
  gameState.gamePhase = "PLAYING";
  
  // Load level
  loadLevel(gameState.currentLevel);
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { 
        gamePhase: "PLAYING",
        level: gameState.currentLevel
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

// Reset game function
export function resetGame(p) {
  // Reset game state
  gameState.gamePhase = "START";
  gameState.score = 0;
  gameState.starsCollected = 0;
  gameState.totalStars = 0;
  gameState.levelTime = 0;
  gameState.isGrappling = false;
  gameState.grappleTarget = null;
  
  // Clear entities
  gameState.player = null;
  gameState.entities = [];
  gameState.platforms = [];
  gameState.grapplePoints = [];
  gameState.collectibles = [];
  gameState.particles = [];
  gameState.goalPlatform = null;
  
  // Reset key states
  resetKeyStates();
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter for UI buttons
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
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' :
    mode === 'TEST_1' ? 'test_1_ModeBtn' :
    mode === 'TEST_2' ? 'test_2_ModeBtn' : 'humanModeBtn'
  );
  
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};