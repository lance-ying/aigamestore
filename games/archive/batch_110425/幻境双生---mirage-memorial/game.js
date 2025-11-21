// game.js - Main game file
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { initializeLevel, updateGame } from './game_logic.js';
import { 
  renderStartScreen, 
  renderPlayingScreen, 
  renderPausedScreen, 
  renderGameOverScreen 
} from './rendering.js';
import { handleKeyPressed, handleKeyReleased, processGameplayInput } from './input.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Log game start
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  // Draw function
  p.draw = function() {
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
        processGameplayInput(p);
        updateGame(p);
        renderPlayingScreen(p);
        break;
      case "PAUSED":
        renderPausedScreen(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGameOverScreen(p);
        break;
    }
  };

  // Input handlers
  p.keyPressed = function() {
    handleKeyPressed(p);
  };

  p.keyReleased = function() {
    handleKeyReleased(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
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
    'TEST_4': 'test_4_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Initialize level if starting to play
  if (gameState.gamePhase === "START") {
    initializeLevel(gameState.currentLevel);
  }
};

// Initialize first level
initializeLevel(gameState.currentLevel);