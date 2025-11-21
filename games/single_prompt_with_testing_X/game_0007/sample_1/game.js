// game.js - Main game file
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS, 
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';
import { initializeSnake } from './player.js';
import { updateGame, resetGame } from './game_loop.js';
import { handleKeyPressed, handleGameplayInput } from './input.js';
import { drawStartScreen, drawPlayingScreen, drawGameOverScreen } from './rendering.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
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
      data: { phase: gameState.gamePhase, action: "init" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game
    resetGame();
  };
  
  p.draw = function() {
    // Handle game phases
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        handleGameplayInput(p);
        updateGame(p);
        drawPlayingScreen(p);
        break;
        
      case PHASE_PAUSED:
        drawPlayingScreen(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    
    // Initialize player when starting
    if (p.keyCode === 13 && gameState.gamePhase === PHASE_START) {
      resetGame();
      initializeSnake(p);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
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