// game.js - Main game loop and p5.js instance

import { 
  gameState, 
  initGameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  setControlMode 
} from './globals.js';

import { 
  handleKeyPress, 
  handleKeyRelease,
  handleMouseClick,
  handleAutomatedInput
} from './input.js';

import {
  renderStartScreen,
  renderHUD,
  renderTowerInfo,
  renderPausedOverlay,
  renderGameOver,
  renderPath,
  renderBuildGrid
} from './ui.js';

import { updateWave } from './waves.js';
import { updateParticles, renderParticles } from './particles.js';

// Get p5 from window
const p5 = window.p5;

// Create p5 instance
const gameInstance = new p5(p => {
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
    initGameState();
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    console.log("Game initialized");
  };
  
  p.draw = function() {
    // Update frame count
    gameState.frameCount = p.frameCount;
    
    // Update delta time
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Clear background
    p.background(25, 20, 40);
    
    // Handle game phases
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        renderHUD(p);
        renderTowerInfo(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderHUD(p);
        renderTowerInfo(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      if (p.frameCount % 10 === 0) { // Check every 10 frames
        handleAutomatedInput(p);
      }
    }
  };
  
  p.keyPressed = function() {
    handleKeyPress(p);
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
  
  p.mousePressed = function() {
    handleMouseClick(p);
  };
  
  // Update game logic
  function updateGame(p) {
    // Update wave spawning
    updateWave(p);
    
    // Update all entities
    for (const entity of gameState.entities) {
      if (entity.update) {
        entity.update(p);
      }
    }
    
    // Update projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
      gameState.projectiles[i].update(p);
    }
    
    // Update particles
    updateParticles();
  }
  
  // Render game
  function renderGame(p) {
    // Draw background gradient
    for (let y = 0; y < CANVAS_HEIGHT; y += 2) {
      const alpha = p.map(y, 0, CANVAS_HEIGHT, 0, 50);
      p.stroke(25 + alpha * 0.3, 20 + alpha * 0.3, 40 + alpha * 0.3);
      p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Render path
    renderPath(p);
    
    // Render build grid if in build mode
    renderBuildGrid(p);
    
    // Render towers
    for (const tower of gameState.towers) {
      tower.render(p);
    }
    
    // Render monsters
    for (const monster of gameState.monsters) {
      monster.render(p);
    }
    
    // Render projectiles
    for (const projectile of gameState.projectiles) {
      projectile.render(p);
    }
    
    // Render particles
    renderParticles(p);
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose setControlMode globally (if not already done)
window.setControlMode = setControlMode;