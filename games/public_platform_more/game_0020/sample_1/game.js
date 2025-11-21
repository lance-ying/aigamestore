import { gameState, PHASE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';
import { updateSimulation } from './simulation.js';
import { drawGame, logPlayerInfo } from './rendering.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
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

    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Process automated input
    processAutomatedInput(p);

    // Update game logic
    if (gameState.gamePhase === PHASE.PLAYING) {
      updateSimulation(p);
      
      // Log player info periodically
      if (p.frameCount % 10 === 0) {
        logPlayerInfo(p);
      }
    }

    // Render
    drawGame(p);
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
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