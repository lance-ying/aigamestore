// game.js - Main game file with p5.js instance

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { handleKeyPress, handleKeyRelease, handlePlayerInput } from './input.js';
import { renderStartScreen, renderGame, renderPausedOverlay, renderGameOver } from './ui.js';
import { updateWaveSystem } from './wave.js';
import { get_automated_testing_action } from './automated_testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
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
    // Update frame count and delta time
    gameState.frameCount = p.frameCount;
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        simulateKeyPress(p, action.keyCode);
      }
    }
    
    // Main game loop
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
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
  };
  
  function updateGame(p) {
    // Handle player input
    handlePlayerInput(p);
    
    // Update player
    if (gameState.player) {
      gameState.player.update(p);
    }
    
    // Update enemies
    gameState.enemies.forEach(enemy => enemy.update(p));
    
    // Update power-ups
    gameState.powerUps.forEach(powerUp => powerUp.update(p));
    
    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (gameState.particles[i].isDead()) {
        gameState.particles.splice(i, 1);
      }
    }
    
    // Update body parts
    for (let i = gameState.bodyParts.length - 1; i >= 0; i--) {
      gameState.bodyParts[i].update(p);
      
      // Remove parts that are off screen
      const part = gameState.bodyParts[i];
      if (part.y > CANVAS_HEIGHT + 100) {
        gameState.bodyParts.splice(i, 1);
      }
    }
    
    // Update wave system
    updateWaveSystem(p);
  }
  
  function simulateKeyPress(p, keyCode) {
    // Simulate a key press for automated testing
    if (!gameState.keys[keyCode]) {
      gameState.keys[keyCode] = true;
      
      // Trigger specific actions
      if (keyCode === 32 && gameState.player) { // Space
        gameState.player.attack();
      }
      if (keyCode === 16 && gameState.player) { // Shift
        gameState.player.startDash();
      }
      if (keyCode === 90 && gameState.player) { // Z
        gameState.player.startBlock();
      }
    }
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
  
  // Update button styles
  const buttons = {
    'HUMAN': document.getElementById('humanModeBtn'),
    'TEST_1': document.getElementById('test_1_ModeBtn'),
    'TEST_2': document.getElementById('test_2_ModeBtn')
  };
  
  Object.keys(buttons).forEach(key => {
    if (buttons[key]) {
      if (key === mode) {
        buttons[key].classList.add('active');
      } else {
        buttons[key].classList.remove('active');
      }
    }
  });
  
  console.log(`Control mode set to: ${mode}`);
};