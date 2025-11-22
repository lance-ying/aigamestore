// game.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CONTROL_MODES, resetGameState } from './globals.js';
import { handleKeyPressed } from './input.js';
import { renderGame } from './renderer.js';
import { updateGame } from './gameLoop.js';

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
    
    resetGameState();
    
    p.logs.game_info.push({
      data: { phase: 'START' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    updateGame(p);
    renderGame(p);
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;

window.getGameState = function() {
  return gameState;
};

window.setControlMode = function(mode) {
  if (Object.values(CONTROL_MODES).includes(mode)) {
    gameState.controlMode = mode;
    
    // Update button states
    document.querySelectorAll('.control-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    if (mode === CONTROL_MODES.HUMAN) {
      document.getElementById('humanModeBtn').classList.add('active');
    } else if (mode === CONTROL_MODES.TEST_1) {
      document.getElementById('test_1_ModeBtn').classList.add('active');
    } else if (mode === CONTROL_MODES.TEST_2) {
      document.getElementById('test_2_ModeBtn').classList.add('active');
    }
    
    gameInstance.logs.inputs.push({
      input_type: 'controlModeChange',
      data: { mode },
      framecount: gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
};