// game.js - Main game file

import { 
  gameState, 
  GAME_PHASES, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT 
} from './globals.js';
import { GridGenerator } from './gridGenerator.js';
import { GridValidator } from './gridValidator.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './inputHandler.js';
import { TestController } from './testController.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let gridGenerator;
  let gridValidator;
  let renderer;
  let inputHandler;
  let testController;

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

    // Initialize systems
    gridGenerator = new GridGenerator(p);
    gridValidator = new GridValidator(p);
    renderer = new Renderer(p);
    inputHandler = new InputHandler(p, gridValidator);
    testController = new TestController(p, inputHandler, gridValidator);

    // Store renderer globally for access
    gameInstance.renderer = renderer;

    // Initialize game state
    initializeLevel();

    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Update timer
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.elapsedTime = (Date.now() - gameState.levelStartTime) / 1000;
    }

    // Update test controller
    testController.update();

    // Render
    renderer.render();

    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.selectedCell.col * 55 + 50,
        screen_y: gameState.selectedCell.row * 55 + 80,
        game_x: gameState.selectedCell.col,
        game_y: gameState.selectedCell.row,
        framecount: p.frameCount
      });
    }
  };

  p.keyPressed = function() {
    inputHandler.handleKeyPressed(p.key, p.keyCode);
    
    // Re-initialize level when transitioning to PLAYING
    if (gameState.gamePhase === GAME_PHASES.PLAYING && 
        (gameState.grid.length === 0 || gameState.levelStartTime === 0)) {
      initializeLevel();
    }
  };

  function initializeLevel() {
    // Generate new grid
    gameState.grid = gridGenerator.generateGrid(gameState.currentLevel, gameState.difficulty);
    gameState.gridSize = { 
      rows: gameState.grid.length, 
      cols: gameState.grid[0].length 
    };
    
    // Reset level state
    gameState.mistakes = 0;
    gameState.stagedNumber = null;
    gameState.levelStartTime = Date.now();
    gameState.elapsedTime = 0;
    
    // Select first empty cell
    const firstEmpty = gridValidator.getFirstEmptyCell(gameState.grid);
    gameState.selectedCell = firstEmpty;
    
    // Initialize player (virtual entity for tracking)
    gameState.player = {
      selectedCell: gameState.selectedCell
    };
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const activeBtnMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn"
  };
  
  const activeBtn = document.getElementById(activeBtnMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};