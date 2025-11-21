// game.js - Main game file

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_PLAYING,
  PHASE_PAUSED
} from './globals.js';
import { initGame, updateGame } from './game_logic.js';
import { initInput, handleKeyPressed, processAutomatedInput } from './input.js';
import { renderUI } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize game systems
    initGame(p);
    initInput(p);
    
    // Log initialization
    p.logs.game_info.push({
      data: { phase: "START", event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    p.background(20, 20, 30);
    
    // Handle automated testing input
    if (gameState.controlMode !== "HUMAN" && 
        (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED)) {
      const action = get_automated_testing_action(gameState);
      if (action && gameState.gamePhase === PHASE_PLAYING) {
        processAutomatedInput(action);
      }
    }
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame();
    }
    
    // Render UI
    renderUI(p);
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p.key, p.keyCode);
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
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn", "test_4_ModeBtn"];
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
    "TEST_3": "test_3_ModeBtn",
    "TEST_4": "test_4_ModeBtn"
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};

// Make getGameState available globally
window.getGameState = () => gameState;

export default gameInstance;