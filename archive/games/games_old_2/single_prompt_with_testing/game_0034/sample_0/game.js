// game.js - Main game file

import { 
  gameState, 
  getGameState,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_PLAYING,
  PHASE_PAUSED
} from './globals.js';
import { initGameLogic, updateGameLogic, handleAIFoul } from './game_logic.js';
import { initRendering, renderGame } from './rendering.js';
import { initInputHandler, handleKeyPressed, processAutomatedInput } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize subsystems
    initGameLogic(p);
    initRendering(p);
    initInputHandler(p);
    
    // Initial log
    p.logs.game_info.push({
      data: "Game initialized",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedInput(action);
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGameLogic();
      
      // Check for AI foul during wait phases
      const ai = gameState.entities[1];
      if (ai && ai.willFoul && !ai.hasDrawn && !gameState.aiFouled) {
        // AI attempts foul during STEADY phase
        if (gameState.duelPhase === "DUEL_STEADY" && Math.random() < 0.02) {
          handleAIFoul();
        }
      }
    }
    
    // Render
    renderGame();
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    handleKeyPressed(p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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
    'test_2_ModeBtn'
  );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: `Control mode changed to ${mode}`,
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};