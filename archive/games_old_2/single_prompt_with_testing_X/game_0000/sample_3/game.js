// game.js - Main game file with p5.js instance

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initializeCombat, updateCombat } from './combat.js';
import { handleKeyPress, logPlayerInfo } from './input.js';
import { drawStartScreen, drawPlayingScreen, drawPausedScreen, drawGameOverScreen } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game time
    gameState.gameTime = 0;
    gameState.lastUpdateTime = Date.now();
  };
  
  // Draw function
  p.draw = function() {
    gameState.gameTime++;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action !== null && action !== undefined) {
        handleKeyPress(p, action);
      }
    }
    
    // Update game logic based on phase
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
    }
    
    // Render based on phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        drawPlayingScreen(p);
        break;
      case GAME_PHASES.PAUSED:
        drawPausedScreen(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
  };
  
  // Update game logic
  function updateGame(p) {
    // Initialize combat if not started
    if (!gameState.combat.isInCombat && !gameState.combat.enemy) {
      initializeCombat();
    }
    
    // Update combat
    const deltaTime = Date.now() - gameState.lastUpdateTime;
    updateCombat(deltaTime);
    gameState.lastUpdateTime = Date.now();
    
    // Log player info periodically
    if (p.frameCount % 60 === 0) {
      logPlayerInfo(p);
    }
  }
  
  // Keyboard input
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPress(p, p.keyCode);
    }
    return false;
  };
});

// Expose globally
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
};

export { gameInstance };