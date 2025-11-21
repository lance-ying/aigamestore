// game.js - Main game file
import { 
  gameState, CANVAS_WIDTH, CANVAS_HEIGHT, 
  GRID_OFFSET_X, GRID_OFFSET_Y, CELL_SIZE 
} from './globals.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './inputHandler.js';
import { PuzzleGenerator } from './puzzleGenerator.js';
import { TestController } from './testController.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let renderer;
  let inputHandler;
  let generator;
  let testController;
  let waitFrames = 0;

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

    // Initialize player
    gameState.player = {
      x: GRID_OFFSET_X + CELL_SIZE / 2,
      y: GRID_OFFSET_Y + CELL_SIZE / 2,
      row: 0,
      col: 0
    };

    // Initialize systems
    generator = new PuzzleGenerator(p);
    renderer = new Renderer(p);
    inputHandler = new InputHandler(p, generator);
    testController = new TestController(inputHandler);

    // Log initial state
    p.logs.game_info.push({
      data: { message: "Game initialized", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Update elapsed time
    if (gameState.gamePhase === "PLAYING") {
      gameState.elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000);
    }

    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      if (waitFrames > 0) {
        waitFrames--;
      } else {
        const action = testController.getTestAction();
        if (action) {
          if (action.type === "wait") {
            waitFrames = action.frames;
          } else {
            testController.executeAction(action);
          }
        }
      }
    }

    // Render based on game phase
    if (gameState.gamePhase === "START") {
      renderer.renderStartScreen();
    } else if (gameState.gamePhase === "PLAYING") {
      renderer.renderPlayingScreen();
    } else if (gameState.gamePhase === "PAUSED") {
      renderer.renderPausedScreen();
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
      renderer.renderGameOverScreen(true);
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
      renderer.renderGameOverScreen(false);
    }
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      inputHandler.handleKeyPressed(p.keyCode, p.key);
    }
    return false; // Prevent default
  };
}, document.body);

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Expose setControlMode function
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  gameState.testingIndex = 0;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });

  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn')?.classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn')?.classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn')?.classList.add('active');
  }

  console.log(`Control mode set to: ${mode}`);
};