// game.js - Main game file
import { gameState, getGameState, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT, FPS } from './globals.js';
import { setupInputHandlers, updatePlayerControls } from './input_handler.js';
import { updateGameLogic } from './game_logic.js';
import { drawStartScreen, drawGameplayScreen, drawGameOverScreen } from './rendering.js';

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
    p.frameRate(FPS);
    p.randomSeed(42);
    
    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: "START", message: "Game Initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup input handlers
    setupInputHandlers(p);
  };
  
  p.draw = function() {
    // Update controls
    updatePlayerControls(p);
    
    // Update game logic
    if (gameState.gamePhase === "PLAYING") {
      updateGameLogic(p);
      
      // Log player info periodically
      if (p.frameCount % 10 === 0 && gameState.player) {
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
    switch(gameState.gamePhase) {
      case "START":
        drawStartScreen(p);
        break;
      case "PLAYING":
      case "PAUSED":
        drawGameplayScreen(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        drawGameOverScreen(p);
        break;
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
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
};