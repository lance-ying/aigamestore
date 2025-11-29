// game.js - Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, CONTROL_HUMAN } from './globals.js';
import { Player } from './entities.js';
import { updateGame, initLevel } from './gameLogic.js';
import { renderGame, initWorkstations } from './rendering.js';
import { handleKeyPressed, handleMousePressed } from './input.js';
import { executeTestAction } from './testing.js';

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
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.player = new Player(300, 150);
    gameState.entities = [gameState.player];
    gameState.gamePhase = PHASE_START;
    
    // Initialize workstations
    initWorkstations();
    
    // Initialize first level data (not started yet)
    initLevel(1);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Execute test actions if in test mode
    if (gameState.controlMode !== CONTROL_HUMAN) {
      executeTestAction();
    }
    
    // Update game logic
    updateGame(p);
    
    // Render
    renderGame(p);
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
  
  p.mousePressed = function() {
    handleMousePressed(p, p.mouseX, p.mouseY);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switcher
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === CONTROL_HUMAN) {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  console.log('Control mode set to:', mode);
};