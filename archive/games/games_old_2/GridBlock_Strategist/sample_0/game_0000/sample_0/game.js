// game.js - Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setP5Instance, handleKeyPressed, checkGameOver, updateLevelTransition } from './input.js';
import { loadHighScore } from './scoring.js';
import { 
  renderStartScreen, 
  renderPlayingScreen, 
  renderGameOverScreen, 
  renderWinScreen,
  renderLevelTransition 
} from './rendering.js';
import { getAIAction } from './ai.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
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
    
    // Set p5 instance for input handling
    setP5Instance(p);
    
    // Load high score
    loadHighScore();
    
    // Initial log
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle AI control
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = getAIAction(p);
      if (action) {
        p.keyCode = action.keyCode;
        p.key = String.fromCharCode(action.keyCode);
        handleKeyPressed(p);
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === "PLAYING") {
      checkGameOver(p);
    } else if (gameState.gamePhase === "LEVEL_TRANSITION") {
      updateLevelTransition(p);
    }
    
    // Render based on game phase
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
      renderPlayingScreen(p);
    } else if (gameState.gamePhase === "GAME_OVER") {
      renderGameOverScreen(p);
    } else if (gameState.gamePhase === "WIN") {
      renderWinScreen(p);
    } else if (gameState.gamePhase === "LEVEL_TRANSITION") {
      renderPlayingScreen(p);
      renderLevelTransition(p);
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p);
    }
    return false; // Prevent default
  };
}, document.body);

// Expose game instance and state globally
window.gameInstance = gameInstance;

window.getGameState = function() {
  return gameState;
};

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