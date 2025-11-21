// game.js - Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, FPS, GAME_PHASES } from './globals.js';
import { Dictionary } from './dictionary.js';
import { UI } from './ui.js';
import { InputHandler } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let dictionary;
  let ui;
  let inputHandler;
  
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
    
    // Initialize game systems
    dictionary = new Dictionary();
    ui = new UI(p);
    inputHandler = new InputHandler(p, dictionary);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update cursor blink
    gameState.blinkTimer++;
    if (gameState.blinkTimer > 30) {
      gameState.cursorBlink = !gameState.cursorBlink;
      gameState.blinkTimer = 0;
    }
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action && p.frameCount % 5 === 0) { // Throttle automated inputs
        inputHandler.handleKeyPressed(action.keyCode, action.key);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        ui.drawStartScreen();
        break;
      case GAME_PHASES.PLAYING:
        ui.drawPlayingScreen(dictionary);
        break;
      case GAME_PHASES.PAUSED:
        ui.drawPlayingScreen(dictionary);
        ui.drawPausedScreen();
        break;
      case GAME_PHASES.GAME_OVER_WIN:
        ui.drawGameOverScreen(true);
        break;
      case GAME_PHASES.GAME_OVER_LOSE:
        ui.drawGameOverScreen(false);
        break;
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      inputHandler.handleKeyPressed(p.keyCode, p.key);
    }
    return false; // Prevent default
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
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
  
  const activeBtn = mode === "HUMAN" ? "humanModeBtn" : `${mode.toLowerCase()}_ModeBtn`;
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};

export { gameInstance };