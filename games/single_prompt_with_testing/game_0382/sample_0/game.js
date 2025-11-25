// game.js - Main game file
import { gameState, getGameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './entities.js';
import { generateWorld } from './world.js';
import { setupKeyHandlers, handleInput } from './input.js';
import { renderGame } from './render.js';
import { updateGame } from './game_logic.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup key handlers
    setupKeyHandlers(p);
  };
  
  // Draw function
  p.draw = function() {
    // Handle input
    handleInput(p);
    
    // Update game logic
    updateGame(p);
    
    // Render
    renderGame(p);
  };
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' :
    mode === 'TEST_1' ? 'test_1_ModeBtn' :
    mode === 'TEST_2' ? 'test_2_ModeBtn' :
    'test_3_ModeBtn'
  );
  
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};