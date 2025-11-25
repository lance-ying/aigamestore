import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleKeyPressed, handleMovement } from './input.js';
import { updateGame } from './game_logic.js';
import { drawGame } from './render.js';
import { getCurrentLevel } from './levels.js';
import { Spawner, Goal, Component } from './entities.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastMovementFrame = 0;
  const movementDelay = 8;

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
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Initialize level
    const level = getCurrentLevel(1);
    gameState.requiredProducts = level.requiredProducts;
    gameState.spawners = level.spawners.map(s => new Spawner(s.x, s.y));
    gameState.goals = level.goals.map(g => new Goal(g.x, g.y, g.type));
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handleKeyPressed(p, String.fromCharCode(action.keyCode), action.keyCode);
      }
    }

    // Handle movement with delay
    if (p.frameCount - lastMovementFrame > movementDelay) {
      handleMovement(p);
      lastMovementFrame = p.frameCount;
    }

    // Update game logic
    updateGame(p);

    // Render
    drawGame(p);
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });

  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn'
  };

  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};