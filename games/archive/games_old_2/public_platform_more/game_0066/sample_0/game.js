// game.js - Main game file
import { CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, gameState } from './globals.js';
import { render } from './rendering.js';
import { handleKeyPressed, processAutomatedAction } from './input.js';
import { updateMiniGame, updateClientSelection, updateDateSelection, updateVenueSelection } from './states.js';
import { STATE_CLIENT_SELECT, STATE_DATE_SELECT, STATE_DATE_VENUE, STATE_MINIGAME } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

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
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    p.colorMode(p.RGB);
    
    // Initial log
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Process automated testing action
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedAction(p, gameState, action);
      }
    }
    
    // Update game state
    if (gameState.gamePhase === PHASE_PLAYING) {
      if (gameState.playState === STATE_CLIENT_SELECT) {
        updateClientSelection(p, gameState);
      } else if (gameState.playState === STATE_DATE_SELECT) {
        updateDateSelection(p, gameState);
      } else if (gameState.playState === STATE_DATE_VENUE) {
        updateVenueSelection(p, gameState);
      } else if (gameState.playState === STATE_MINIGAME) {
        updateMiniGame(p, gameState);
      }
      
      // Log player position periodically
      if (p.frameCount % 30 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    }
    
    // Render
    render(p, gameState);
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, gameState, p.key, p.keyCode);
    }
    return false; // Prevent default behavior
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};