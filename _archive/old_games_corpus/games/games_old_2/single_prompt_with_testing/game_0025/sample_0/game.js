import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import { initializeGrid } from './grid.js';
import { Player } from './player.js';
import { handleKeyPressed } from './input.js';
import { renderGame } from './render.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize the logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.grid = [];
    gameState.player = null;
    gameState.entities = [];
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const actions = get_automated_testing_action(gameState);
      for (const keyCode of actions) {
        simulateKeyPress(keyCode, p);
      }
    }
    
    // Update game state
    if (gameState.gamePhase === "PLAYING") {
      // Update entities
      for (const entity of gameState.entities) {
        if (entity.update) {
          entity.update(p);
        }
      }
    }
    
    // Render
    renderGame(p);
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p.key, p.keyCode, p);
    }
    return false; // Prevent default behavior
  };
  
  function simulateKeyPress(keyCode, p) {
    const keyMap = {
      37: 'ArrowLeft',
      38: 'ArrowUp',
      39: 'ArrowRight',
      40: 'ArrowDown',
      32: ' ',
      90: 'z',
      16: 'Shift'
    };
    const key = keyMap[keyCode] || '';
    handleKeyPressed(key, keyCode, p);
  }
});

// Expose the game instance globally
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
                      mode === 'TEST_2' ? 'test_2_ModeBtn' : null;
  
  if (activeBtnId) {
    const activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }
};