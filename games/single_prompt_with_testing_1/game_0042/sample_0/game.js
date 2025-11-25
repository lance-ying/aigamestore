// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PUZZLES } from './globals.js';
import { initializeGrid, updateCellErrorStatus } from './sudoku.js';
import { handleKeyPress, logPlayerInfo } from './input.js';
import { drawStartScreen, drawPlayingScreen, drawGameOverScreen } from './rendering.js';
import { get_automated_testing_action, resetTestState } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize puzzle
    const puzzle = PUZZLES[gameState.currentPuzzleIndex];
    gameState.grid = initializeGrid(puzzle.puzzle);
    gameState.initialGrid = JSON.parse(JSON.stringify(gameState.grid));
    
    // Log initial state
    p.logs.game_info.push({
      event: "Game Initialized",
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handleKeyPress(p, String.fromCharCode(action.keyCode), action.keyCode);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen(p);
        break;
      case "PLAYING":
      case "PAUSED":
        drawPlayingScreen(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        drawGameOverScreen(p);
        break;
    }
    
    // Log player info periodically
    logPlayerInfo(p);
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPress(p, p.key, p.keyCode);
    }
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  resetTestState();
  
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

export default gameInstance;