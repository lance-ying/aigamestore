// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { getTotalElementCount } from './elements.js';
import { renderStartScreen, renderPlayingScreen, renderGameOverScreen } from './ui.js';
import { handleKeyPressed, processAutomatedInput } from './input_handler.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize game state
    gameState.totalElementsInGame = getTotalElementCount();
    
    p.logs.game_info.push({
      data: "Game initialized",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw
  p.draw = function() {
    // Process automated testing input
    if (gameState.controlMode !== "HUMAN" && 
        gameState.gamePhase === GAME_PHASES.PLAYING &&
        p.frameCount % 3 === 0) { // Throttle automated input
      processAutomatedInput(p);
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
      case GAME_PHASES.PAUSED:
        renderPlayingScreen(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  // Key pressed
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const modes = ["HUMAN", "TEST_1", "TEST_2", "TEST_3"];
  modes.forEach(m => {
    const btn = document.getElementById(`${m === "HUMAN" ? "humanMode" : m.toLowerCase() + "_Mode"}Btn`);
    if (btn) {
      btn.classList.toggle('active', m === mode);
    }
  });
  
  if (gameInstance.logs) {
    gameInstance.logs.game_info.push({
      data: `Control mode changed to ${mode}`,
      framecount: gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
};