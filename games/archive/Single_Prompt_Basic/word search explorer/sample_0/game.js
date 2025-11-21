import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { renderStartScreen, renderGameplay, renderPauseOverlay, renderGameOverScreen, renderLevelComplete } from './rendering.js';
import { getTestingAction } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = "START";
    
    p.logs.game_info.push({
      data: { phase: "START", message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle testing mode
    if (gameState.controlMode !== "HUMAN") {
      const action = getTestingAction(p);
      if (action && action.keyCode) {
        handleKeyPressed(p, String.fromCharCode(action.keyCode), action.keyCode);
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING") {
      renderGameplay(p);
    } else if (gameState.gamePhase === "PAUSED") {
      renderGameplay(p);
      renderPauseOverlay(p);
    } else if (gameState.gamePhase === "LEVEL_COMPLETE") {
      renderLevelComplete(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      renderGameOverScreen(p);
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.gamePhase === "PLAYING") {
      p.logs.player_info.push({
        screen_x: 0,
        screen_y: 0,
        game_x: gameState.hoveredCell ? gameState.hoveredCell.col : 0,
        game_y: gameState.hoveredCell ? gameState.hoveredCell.row : 0,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };
  
  p.keyReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyReleased(p, p.key, p.keyCode);
    }
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;
window.getGameState = getGameState;

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
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn')?.classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn')?.classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn')?.classList.add('active');
  }
};