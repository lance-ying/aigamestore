import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initGame, updateGame } from './gameLogic.js';
import { renderGame } from './render.js';
import { handleKeyPressed, handleKeyReleased, processContinuousInput } from './input.js';
import { updateTestingController } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    initGame(p);
    
    p.logs.game_info.push({
      data: { event: 'game_initialized' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Process continuous input (held keys)
    processContinuousInput(p);
    
    // Update game logic
    updateGame(p);
    
    // Update testing controller
    updateTestingController(p);
    
    // Render
    renderGame(p);
    
    // Log player info periodically
    if (p.frameCount % 10 === 0 && gameState.gamePhase === 'PLAYING') {
      p.logs.player_info.push({
        screen_x: gameState.cannon.x,
        screen_y: gameState.cannon.y,
        game_x: gameState.cannon.x,
        game_y: gameState.cannon.y,
        angle: gameState.cannon.angle,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    return false; // Prevent default
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    state.currentLevel = levelNum;
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};

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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: { event: 'control_mode_changed', mode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};