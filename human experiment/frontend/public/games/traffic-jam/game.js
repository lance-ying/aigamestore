import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { setupInputHandlers } from './input.js';
import { drawGame } from './renderer.js';
import { getTestingAction, applyTestingAction } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
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
      data: "Game initialized",
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Setup input handlers
    setupInputHandlers(p);
  };

  // Draw function
  p.draw = function() {
    // Handle testing mode
    if (gameState.controlMode !== "HUMAN") {
      const action = getTestingAction(p);
      if (action) {
        applyTestingAction(p, action);
      }
    }

    // Render game
    drawGame(p);

    // Log player info periodically
    if (p.frameCount % 10 === 0 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const selectedVehicle = gameState.entities[gameState.selectedVehicle];
      if (selectedVehicle) {
        p.logs.player_info.push({
          screen_x: selectedVehicle.gridX,
          screen_y: selectedVehicle.gridY,
          game_x: selectedVehicle.gridX,
          game_y: selectedVehicle.gridY,
          framecount: p.frameCount
        });
      }
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    state.currentLevel = levelNum;
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};

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