// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, CONTROL_HUMAN } from './globals.js';
import { Player, Springtrap, Phantom } from './entities.js';
import { handleKeyPressed, processGameplayInput } from './input.js';
import { updateGame } from './game_logic.js';
import { renderStartScreen, renderGameOverScreen, renderPausedIndicator, renderOfficeView, renderTablet, renderHUD, renderPhantoms } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Expose classes globally for use in other modules
if (typeof window !== 'undefined') {
  window.Player = Player;
  window.Springtrap = Springtrap;
  window.Phantom = Phantom;
}

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup
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
    
    // Initial log
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw
  p.draw = function() {
    p.background(20);
    
    // Handle automated testing
    if (gameState.controlMode !== CONTROL_HUMAN && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action !== null && action !== undefined) {
        p.keyCode = action;
        processGameplayInput(p, gameState, action);
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame(p, gameState);
    }
    
    // Render based on game phase
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      renderOfficeView(p, gameState);
      
      if (gameState.tabletOpen) {
        renderTablet(p, gameState);
      }
      
      renderPhantoms(p, gameState);
      renderHUD(p, gameState);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      renderOfficeView(p, gameState);
      
      if (gameState.tabletOpen) {
        renderTablet(p, gameState);
      }
      
      renderHUD(p, gameState);
      renderPausedIndicator(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGameOverScreen(p, gameState);
    }
  };
  
  // Key pressed
  p.keyPressed = function() {
    handleKeyPressed(p, gameState);
    return false; // Prevent default
  };
}, document.body);

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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
  
  const activeBtn = mode === CONTROL_HUMAN ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' :
                    mode === 'TEST_2' ? 'test_2_ModeBtn' : 'test_3_ModeBtn';
  
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};

export { gameInstance, gameState, getGameState };