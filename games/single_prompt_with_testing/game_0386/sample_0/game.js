// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { PuzzleGenerator } from './puzzle_generator.js';
import { renderGame } from './renderer.js';
import { handleKeyPressed, processAutomatedAction } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let generator;
  
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
    
    // Initialize game
    generator = new PuzzleGenerator(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Process automated testing if enabled
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedAction(p, action, generator);
      }
    }
    
    // Render game
    renderGame(p);
    
    // Log player info periodically
    if (gameState.gamePhase === GAME_PHASES.PLAYING && p.frameCount % 30 === 0) {
      const node = gameState.nodes[gameState.cursor.nodeIndex];
      if (node) {
        p.logs.player_info.push({
          screen_x: node.x,
          screen_y: node.y,
          game_x: node.x,
          game_y: node.y,
          framecount: p.frameCount
        });
      }
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode, generator);
    }
    return false;
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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`;
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
  
  // Reset strategy state when changing modes
  if (gameState.strategyState) {
    gameState.strategyState = null;
  }
  if (gameState.testPathState) {
    gameState.testPathState = null;
  }
  gameState.actionCount = 0;
};

export default gameInstance;