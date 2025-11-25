// game.js - Main game file

import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  CONTROL_HUMAN,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from './globals.js';
import { handleKeyPressed, processPlayerInput, processAutomatedInput } from './input.js';
import { drawStartScreen, drawPlayingScreen, drawPausedScreen, drawGameOverScreen } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

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
    
    // Initial log
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
      
      case PHASE_PLAYING:
        // Update game entities
        updateGame(p);
        
        // Process input
        if (gameState.controlMode === CONTROL_HUMAN) {
          processPlayerInput(p);
        } else {
          const action = get_automated_testing_action(gameState);
          processAutomatedInput(p, action);
        }
        
        // Draw
        drawPlayingScreen(p);
        break;
      
      case PHASE_PAUSED:
        drawPausedScreen(p);
        break;
      
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
});

function updateGame(p) {
  // Update player
  if (gameState.player) {
    gameState.player.update(p);
  }
  
  // Update doors
  gameState.doors.forEach(door => door.update());
  
  // Update lightbulb
  if (gameState.lightbulb) {
    gameState.lightbulb.update();
  }
  
  // Update sun chamber
  if (gameState.sunChamber) {
    gameState.sunChamber.update();
  }
}

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = mode === CONTROL_HUMAN ? 'humanModeBtn' : `${mode.toLowerCase()}_ModeBtn`;
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};