// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { renderGame } from './rendering.js';
import { handleKeyPressed, handleContinuousInput, processAutomatedInput } from './input_handler.js';
import { updateWaveSpawning, updateEntities, updatePoints } from './game_logic.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // p5.js setup
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
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // p5.js draw loop
  p.draw = function() {
    // Handle automated testing input
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedInput(p, action);
        
        // Handle continuous inputs
        if (action.continuous) {
          for (let key of action.continuous) {
            if (key === 37) gameState.cursorX -= 3;
            if (key === 39) gameState.cursorX += 3;
          }
        }
      }
    } else {
      // Handle human continuous input
      handleContinuousInput(p);
    }
    
    // Update game logic
    if (gameState.gamePhase === PHASE_PLAYING) {
      updateWaveSpawning(p.frameCount);
      updatePoints();
      
      const result = updateEntities(p.frameCount);
      
      if (result === 'win') {
        gameState.gamePhase = PHASE_GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { phase: "GAME_OVER_WIN", message: "Victory!" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (result === 'lose') {
        gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { phase: "GAME_OVER_LOSE", message: "Defeat!" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      
      // Log player state periodically
      if (p.frameCount % 30 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.cursorX,
          screen_y: 0,
          game_x: gameState.cursorX,
          game_y: 0,
          framecount: p.frameCount
        });
      }
    }
    
    // Render
    renderGame(p);
  };
  
  // p5.js key pressed
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
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' :
                    mode === 'TEST_2' ? 'test_2_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
};

export { gameInstance };