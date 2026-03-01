// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setupInput, handleGameplayInput } from './input.js';
import { updatePhysics } from './physics.js';
import { initializeCourse, renderCourse } from './course.js';
import { renderStartScreen, renderUI, renderPausedOverlay, renderGameOver } from './ui.js';
import { updateParticles, renderParticles } from './particles.js';

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
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    // Setup input handlers
    setupInput(p);
    
    // Initialize course
    initializeCourse(p);
    
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
    
    // Clear background
    p.background(20, 80, 40);
    
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
  };

  // New: Function to reset the entire game state
  p.resetGame = function() {
    // Clear any pending auto-restart
    p.cancelAutoRestart();

    // Clear entities
    gameState.entities = [];
    gameState.walls = [];
    gameState.holes = [];
    gameState.waterHazards = [];
    gameState.ramps = [];
    gameState.particles = [];
    
    // Reset game state
    gameState.currentHole = 0;
    gameState.strokes = 0;
    gameState.holeStrokes = [];
    gameState.score = 0;
    gameState.isAiming = true;
    gameState.canShoot = true;
    gameState.isCharging = false;
    gameState.power = 0;
    gameState.aimAngle = 0;
    
    // Reinitialize course
    initializeCourse(p);
    
    // Change to start screen
    gameState.gamePhase = "START";
    
    if (p.logs && p.logs.game_info) {
      p.logs.game_info.push({
        data: { gamePhase: "START", action: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  };

  // New: Function to set game over phase and schedule auto-restart
  p.setGameOverPhase = function(phase) {
    gameState.gamePhase = phase;
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      // Schedule auto-restart 1 second after game over screen appears
      p.scheduleAutoRestart(1000); 
    }
    if (p.logs && p.logs.game_info) {
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  };

  // New: Function to schedule an auto-restart
  p.scheduleAutoRestart = function(delay) {
    p.cancelAutoRestart(); // Clear any existing timer to prevent multiple restarts
    gameState.autoRestartTimeoutId = setTimeout(() => {
      p.resetGame(); // Call the game's reset function
      gameState.autoRestartTimeoutId = null; // Clear the ID after execution
    }, delay);
  };

  // New: Function to cancel any pending auto-restart
  p.cancelAutoRestart = function() {
    if (gameState.autoRestartTimeoutId) {
      clearTimeout(gameState.autoRestartTimeoutId);
      gameState.autoRestartTimeoutId = null;
    }
  };
});

function updateGame(p) {
  // Handle input
  handleGameplayInput(p);
  
  // Update ball
  if (gameState.ball) {
    gameState.ball.update(p);
  }
  
  // Update physics
  updatePhysics(p);
  
  // Update water hazards (only current hole)
  const currentHole = gameState.holes[gameState.currentHole];
  if (currentHole) {
    currentHole.waterHazards.forEach(water => water.update(p));
  }
  
  // Update particles
  updateParticles(p);
}

function renderGame(p) {
  // Render course
  renderCourse(p);
  
  // Render ball
  if (gameState.ball) {
    gameState.ball.render(p);
  }
  
  // Render particles
  renderParticles(p);
}

// Expose the game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById('humanModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};