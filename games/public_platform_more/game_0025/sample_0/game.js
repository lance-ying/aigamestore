// game.js - Main game file using p5.js instance mode

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS,
  PHASE_PLAYING,
  PHASE_PAUSED
} from './globals.js';
import { setP5Instance as setGameLogicP5, updateGame } from './game_logic.js';
import { setP5Instance as setInputP5, handleKeyPressed } from './input_handler.js';
import { renderGame } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

const gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Set p5 instance for other modules
    setGameLogicP5(p);
    setInputP5(p);
  };
  
  // Draw function
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const actions = get_automated_testing_action(gameState);
      for (const action of actions) {
        simulateKeyPress(p, action);
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING && !gameState.showUpgradeScreen) {
      updateGame();
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.monsters.length > 0) {
      const player = gameState.monsters[0];
      if (player) {
        p.logs.player_info.push({
          screen_x: player.getX(),
          screen_y: player.getY(),
          game_x: player.getX(),
          game_y: player.getY(),
          framecount: p.frameCount
        });
      }
    }
    
    // Render everything
    renderGame(p);
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    handleKeyPressed(p);
    return false;
  };
  
  // Simulate key press for automated testing
  function simulateKeyPress(p, keyCode) {
    p.keyCode = keyCode;
    
    // Set key based on keyCode
    if (keyCode === 32) p.key = ' ';
    else if (keyCode === 37) p.key = 'ArrowLeft';
    else if (keyCode === 38) p.key = 'ArrowUp';
    else if (keyCode === 39) p.key = 'ArrowRight';
    else if (keyCode === 40) p.key = 'ArrowDown';
    else if (keyCode === 90) p.key = 'z';
    else if (keyCode === 16) p.key = 'Shift';
    else p.key = String.fromCharCode(keyCode);
    
    handleKeyPressed(p);
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switcher
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' :
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};

export default gameInstance;