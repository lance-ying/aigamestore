// Main game file with p5.js instance mode

import { gameState, resetGameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';
import { Player } from './player.js';
import { Boss } from './boss.js';
import { handleKeyPressed, handleKeyReleased, handleGameplayInput } from './input.js';
import { updatePlayerProjectiles, updateBossProjectiles, renderProjectiles } from './projectiles.js';
import { updateParticles, renderParticles } from './particles.js';
import { renderStartScreen, renderGameUI, renderPausedOverlay, renderGameOverScreen, renderBackground } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Get p5 from window
const p5 = window.p5;

// Initialize game state
export function initializeGame(p) {
  resetGameState();
  
  // Create player
  new Player(100, CANVAS_HEIGHT - 100);
  
  // Create boss
  new Boss(CANVAS_WIDTH / 2, 120);
  
  // Log initial state
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

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
    p.randomSeed(42); // Set seed once
    
    // Initialize game
    initializeGame(p);
    
    console.log('Cuphead Boss Battle initialized!');
  };
  
  p.draw = function() {
    // Update frame count
    gameState.frameCount = p.frameCount;
    
    // Update delta time
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        // Simulate key press
        p.keyCode = action.keyCode;
        handleKeyPressed(p);
      }
    }
    
    // Single background call
    p.background(20, 20, 30);
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        // Update game
        updateGame(p);
        
        // Render game
        renderBackground(p);
        renderGame(p);
        renderGameUI(p);
        break;
        
      case PHASE_PAUSED:
        // Render frozen game state
        renderBackground(p);
        renderGame(p);
        renderGameUI(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
        renderBackground(p);
        renderGame(p);
        renderGameOverScreen(p, true);
        break;
        
      case "GAME_OVER_LOSE":
        renderBackground(p);
        renderGame(p);
        renderGameOverScreen(p, false);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
  };
});

// Update game logic
function updateGame(p) {
  // Handle player input
  handleGameplayInput();
  
  // Update player
  if (gameState.player) {
    gameState.player.update(p);
  }
  
  // Update boss
  if (gameState.boss) {
    gameState.boss.update();
  }
  
  // Update projectiles
  updatePlayerProjectiles();
  updateBossProjectiles();
  
  // Update particles
  updateParticles();
}

// Render game entities
function renderGame(p) {
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render boss
  if (gameState.boss) {
    gameState.boss.render(p);
  }
  
  // Render projectiles
  renderProjectiles(p);
  
  // Render particles (on top)
  renderParticles(p);
}

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  console.log(`Control mode set to: ${mode}`);
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'human' : mode.toLowerCase()}ModeBtn`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};