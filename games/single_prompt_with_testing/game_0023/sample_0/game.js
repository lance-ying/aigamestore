// game.js - Main game file with p5.js instance

import { 
  gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE
} from './globals.js';
import { Player } from './entities.js';
import { updateGame, logPlayerInfo } from './game_logic.js';
import { handleKeyPressed, handleKeyReleased, processAutomatedAction } from './input_handler.js';
import { 
  drawStartScreen, drawPlayingScreen, drawPausedScreen, drawGameOverScreen 
} from './ui.js';
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
    
    // Initialize player
    gameState.player = new Player(100, 200);
    gameState.entities.push(gameState.player);
    
    // Log initial state
    p.logs.game_info.push({
      event: "game_initialized",
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    // Single background call
    p.background(30, 30, 50);
    
    // Process automated testing if not in human mode
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedAction(action);
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame(p);
      
      // Log player info periodically
      if (p.frameCount % 60 === 0) {
        logPlayerInfo();
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
      case PHASE_PLAYING:
        drawPlayingScreen(p);
        break;
      case PHASE_PAUSED:
        drawPausedScreen(p);
        break;
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false; // Prevent default
  };
  
  // Key released handler
  p.keyReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyReleased(p, p.key, p.keyCode);
    }
    return false;
  };
});

// Expose game instance globally
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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};

export default gameInstance;