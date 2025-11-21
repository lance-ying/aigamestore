import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, LEVEL_CONFIGS } from './globals.js';
import { handleKeyPressed, handleKeyReleased, handleContinuousInput } from './input.js';
import { updateGame } from './game_logic.js';
import { renderGame } from './rendering.js';
import { handleTestingMode } from './testing.js';
import { EnemyBase, Gate } from './entities.js';

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
    
    // Initialize game state
    gameState.gamePhase = GAME_PHASES.START;
    gameState.score = 0;
    gameState.currentLevel = 1;
    gameState.totalFrames = 0;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle testing modes
    handleTestingMode(p);
    
    // Handle continuous input
    handleContinuousInput(p);
    
    // Update game logic
    updateGame(p);
    
    // Render
    renderGame(p);
  };

  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };

  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};

export { gameInstance };