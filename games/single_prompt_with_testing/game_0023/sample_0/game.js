import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_PLAYING
} from './globals.js';
import { GameManager } from './gameManager.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './inputHandler.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let gameManager;
  let renderer;
  let inputHandler;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize game systems
    gameManager = new GameManager(p);
    renderer = new Renderer(p);
    inputHandler = new InputHandler(p, gameManager);
    
    gameManager.init();
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        gameManager.handleInput(action.keyCode);
      }
    }
    
    // Update game logic
    gameManager.update();
    
    // Render
    renderer.render();
    gameManager.renderParticles();
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      inputHandler.handleKeyPressed(p.keyCode);
    }
    return false; // Prevent default behavior
  };
}, document.body);

// Expose game instance and state globally
window.gameInstance = gameInstance;

window.getGameState = function() {
  return gameState;
};

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button styles
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtnId = mode === "HUMAN" ? 'humanModeBtn' : 
                      mode === "TEST_1" ? 'test_1_ModeBtn' :
                      mode === "TEST_2" ? 'test_2_ModeBtn' :
                      'test_3_ModeBtn';
  const activeBtn = document.getElementById(activeBtnId);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};