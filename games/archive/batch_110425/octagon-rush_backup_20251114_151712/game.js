// game.js - Main game file

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS,
  PHASE_PLAYING
} from './globals.js';
import { handleKeyPressed, handleKeyReleased, processGameplayInputs } from './input_handler.js';
import { updateGame } from './game_logic.js';
import { render } from './renderer.js';
import { getGameState } from './globals.js';

const p5 = window.p5;

let lastFrameTime = 0;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    lastFrameTime = Date.now();
  };
  
  p.draw = function() {
    // Calculate delta time
    const currentTime = Date.now();
    const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.1);
    lastFrameTime = currentTime;
    
    // Process inputs
    processGameplayInputs(p);
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame(p, deltaTime);
    }
    
    // Render
    render(p);
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
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
  
  const activeBtnId = mode === 'HUMAN' ? 'humanModeBtn' : 
                      mode === 'TEST_1' ? 'test_1_ModeBtn' :
                      mode === 'TEST_2' ? 'test_2_ModeBtn' : 'humanModeBtn';
  
  const activeBtn = document.getElementById(activeBtnId);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};