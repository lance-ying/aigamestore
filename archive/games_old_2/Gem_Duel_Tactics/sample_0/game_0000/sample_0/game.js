// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_PLAYING } from './globals.js';
import { renderGame } from './rendering.js';
import { handleKeyPressed, processTestingInput } from './input.js';
import { updateAnimations, updateAI } from './gameLogic.js';

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
    
    // Initialize player reference for logging
    gameState.player = {
      x: gameState.cursorX,
      y: gameState.cursorY
    };
    
    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update player position for logging
    if (gameState.player) {
      gameState.player.x = gameState.cursorX;
      gameState.player.y = gameState.cursorY;
      
      // Log player info periodically
      if (p.frameCount % 10 === 0 && gameState.gamePhase === PHASE_PLAYING) {
        const gridX = gameState.cursorX * gameState.gridCellSize;
        const gridY = gameState.cursorY * gameState.gridCellSize;
        
        p.logs.player_info.push({
          screen_x: gridX,
          screen_y: gridY,
          game_x: gameState.cursorX,
          game_y: gameState.cursorY,
          framecount: p.frameCount
        });
      }
    }
    
    // Testing mode
    if (gameState.controlMode !== "HUMAN") {
      processTestingInput(p);
    }
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateAnimations(p);
      updateAI(p);
    }
    
    // Render
    renderGame(p);
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

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