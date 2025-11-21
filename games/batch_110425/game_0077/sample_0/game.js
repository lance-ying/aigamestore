// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { handleKeyPressed, processAutomatedInput } from './input_handler.js';
import { renderGame } from './renderer.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

export let gameInstance = null;

gameInstance = new p5(p => {
  // p5.js instance mode setup
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initial log entry
    p.logs.game_info.push({
      data: "Game initialized",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Start with game paused on start screen
    p.noLoop();
  };
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedInput(action, p);
      }
    }
    
    // Check win condition
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.hasWon) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: "Game won",
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Render game
    renderGame(p);
    
    // Log player position periodically (every 60 frames)
    if (p.frameCount % 60 === 0 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      p.logs.player_info.push({
        screen_x: 300,
        screen_y: 200,
        game_x: 300,
        game_y: 200,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    return false;
  };
}, document.body);

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const modeMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn",
    "TEST_3": "test_3_ModeBtn"
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
  
  gameInstance.logs.game_info.push({
    data: `Control mode changed to: ${mode}`,
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};

export { gameInstance as default };