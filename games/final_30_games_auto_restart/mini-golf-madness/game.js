// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setupInput, handleGameplayInput, resetGame } from './input.js'; // Import resetGame
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
        // Add auto-restart logic
        if (!gameState.autoRestartScheduled) {
            gameState.autoRestartScheduled = true;
            gameState.autoRestartTimerId = setTimeout(() => {
                resetGame(p); // Call the imported resetGame function
                gameState.autoRestartScheduled = false;
                gameState.autoRestartTimerId = null;
            }, 1000); // 1 second delay before auto-restart
        }
        break;
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