import { gameState, initializeGameState, getGameState, GAME_PHASES } from './globals.js';
import { updateAnimatronics } from './animatronics.js';
import { updatePower } from './power.js';
import { updateTime } from './time.js';
import { renderGame } from './rendering.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize game state
    initializeGameState();
    
    p.logs.game_info.push({
      data: "Game initialized",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        simulateKeyPress(p, action.keyCode);
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateTime(p);
      updatePower();
      updateAnimatronics(p);
      
      // Log player state periodically
      if (p.frameCount % 60 === 0) {
        p.logs.player_info.push({
          screen_x: 300,
          screen_y: 300,
          game_x: 300,
          game_y: 300,
          framecount: p.frameCount
        });
      }
    }
    
    // Render
    renderGame(p);
  };
  
  // Key handlers
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
  };
  
  p.keyReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyReleased(p, p.key, p.keyCode);
    }
  };
  
  // Simulate key press for automated testing
  function simulateKeyPress(p, keyCode) {
    // Simulate key press
    const key = String.fromCharCode(keyCode);
    handleKeyPressed(p, key, keyCode);
    
    // Simulate key release after a short delay for certain keys
    if (keyCode === 37 || keyCode === 39) { // Arrow keys for lights
      setTimeout(() => {
        handleKeyReleased(p, key, keyCode);
      }, 100);
    }
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

// Expose getGameState
window.getGameState = getGameState;