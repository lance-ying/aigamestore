// game.js - Main game file

import { gameState, GAME_PHASES } from './globals.js';
import { handleKeyPressed, getTestAction } from './input.js';
import { updateGame, executeAction } from './gameLogic.js';
import { 
  renderStartScreen, 
  renderGrid, 
  renderUI, 
  renderWaterFlow,
  renderPauseOverlay,
  renderGameOverScreen,
  renderLevelCompleteScreen
} from './renderer.js';

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
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = GAME_PHASES.START;
    
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20, 25, 30);
    
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN') {
      const testAction = getTestAction(gameState.controlMode, p);
      if (testAction) {
        executeAction(testAction, p);
      }
    }
    
    // Update game logic
    updateGame(p);
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        renderGrid(p);
        renderUI(p);
        break;
        
      case GAME_PHASES.PAUSED:
        renderGrid(p);
        renderUI(p);
        renderPauseOverlay(p);
        break;
        
      case GAME_PHASES.WATER_FLOW:
        renderGrid(p);
        renderUI(p);
        renderWaterFlow(p);
        break;
        
      case GAME_PHASES.LEVEL_COMPLETE:
        renderLevelCompleteScreen(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === 'HUMAN') {
      const action = handleKeyPressed(p);
      executeAction(action, p);
    }
    return false; // Prevent default
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
};