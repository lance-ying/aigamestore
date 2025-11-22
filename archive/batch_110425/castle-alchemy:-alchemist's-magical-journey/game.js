// game.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, FPS, GAME_PHASES } from './globals.js';
import { handleKeyPressed, getActiveKeys } from './input_handler.js';
import { updateGame } from './game_controller.js';
import { renderGame } from './renderer.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastFrameTime = 0;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    lastFrameTime = Date.now();
  };
  
  p.draw = function() {
    // Calculate delta time
    const currentTime = Date.now();
    const deltaTime = Math.min((currentTime - lastFrameTime) / 1000, 0.1);
    lastFrameTime = currentTime;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handleKeyPressed(p, action.keyCode);
      }
    }
    
    // Handle continuous inputs (space for time acceleration)
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      const keys = getActiveKeys(p);
      if (keys.space && gameState.currentMode === "CASTLE") {
        // Accelerate time by factor of 3
        updateGame(deltaTime * 2, p);
      }
    }
    
    // Update game state
    updateGame(deltaTime, p);
    
    // Render
    renderGame(p);
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.keyCode);
    }
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn')?.classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn')?.classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn')?.classList.add('active');
  } else if (mode === "TEST_3") {
    document.getElementById('test_3_ModeBtn')?.classList.add('active');
  }
};

export default gameInstance;