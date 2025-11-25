// game.js - Main game file with p5.js instance

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { renderStartScreen, renderGameOverScreen, renderPlayingScreen } from './rendering.js';
import { handleKeyPressed, handleKeyReleased, getAutomatedInput, processAutomatedInput } from './input_handler.js';
import { updateGame } from './game_logic.js';

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
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call at the top
    p.background(20, 30, 40);
    
    // Handle automated testing input
    if (gameState.controlMode !== "HUMAN") {
      const action = getAutomatedInput(p);
      if (action) {
        processAutomatedInput(p, action);
      }
    }
    
    // Update game state based on phase
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Apply time scale (SHIFT key for speed up)
      const timeScale = p.keyIsDown(16) ? 3 : 1; // 16 = SHIFT
      gameState.timeScale = timeScale;
      
      updateGame(timeScale);
      
      // Log player info periodically
      if (p.frameCount % 60 === 0) {
        p.logs.player_info.push({
          screen_x: 0,
          screen_y: 0,
          game_x: gameState.gameTime,
          game_y: gameState.resources.gold,
          framecount: p.frameCount
        });
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
      case GAME_PHASES.PAUSED:
        renderPlayingScreen(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
        renderGameOverScreen(p, true);
        break;
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p, false);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.keyCode);
    return false; // Prevent default behavior
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.keyCode);
    return false;
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};

export default gameInstance;