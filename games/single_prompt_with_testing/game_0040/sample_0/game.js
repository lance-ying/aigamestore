// game.js - Main game file

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  PHASE_GAME_OVER_LOSE,
  TARGET_FPS,
  getGameState
} from './globals.js';
import { updateGame } from './game_logic.js';
import { drawStartScreen, drawGameScreen, drawGameOverScreen } from './rendering.js';
import { handleKeyPressed, handleAutomatedTesting } from './input_handler.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);

    // Initialize game state
    gameState.gamePhase = PHASE_START;
    
    p.logs.game_info.push({
      data: { message: "Game initialized", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
      
      case PHASE_PLAYING:
        handleAutomatedTesting(p);
        updateGame(p);
        drawGameScreen(p);
        logPlayerInfo(p);
        break;
      
      case PHASE_PAUSED:
        drawGameScreen(p);
        break;
      
      case PHASE_GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
    return false; // Prevent default behavior
  };

  function logPlayerInfo(p) {
    // Log player info (castle position and cursor as proxy for "player")
    if (p.frameCount % 30 === 0) { // Log every 30 frames
      p.logs.player_info.push({
        screen_x: gameState.cursor.x,
        screen_y: gameState.cursor.y,
        game_x: gameState.cursor.x,
        game_y: gameState.cursor.y,
        framecount: p.frameCount
      });
    }
  }
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

export default gameInstance;