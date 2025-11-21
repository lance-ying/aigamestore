// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { createDice } from './dice.js';
import { handleKeyPressed } from './input.js';
import { renderGame } from './render.js';
import { updateTurnPhases } from './gameLogic.js';
import { updateTestController } from './testController.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize dice
    gameState.dice = createDice(p);
    
    // Log game start
    p.logs.game_info.push({
      data: { phase: "START", message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update test controller if active
    updateTestController(p);
    
    // Update game logic
    updateTurnPhases(p);
    
    // Render
    renderGame(p);
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
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
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};