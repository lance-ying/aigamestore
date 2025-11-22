// game.js - Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, CONTROL_HUMAN } from './globals.js';
import { Player } from './player.js';
import { initializePuzzles, loadPuzzle, checkPuzzleCompletion } from './puzzles.js';
import { drawStartScreen, drawPlayingScreen, drawPausedScreen, drawGameOverScreen } from './rendering.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';
import get_automated_testing_action from './automated_testing_controller.js';

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
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);

    // Initialize game state
    gameState.player = new Player(100, 200);
    gameState.entities = [];
    gameState.tools = [];
    gameState.score = 0;
    gameState.sigilsCollected = 0;
    gameState.currentPuzzle = 0;
    gameState.messages = [];
    gameState.framesSinceLastAction = 0;

    // Initialize puzzles
    initializePuzzles();

    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, event: 'game_initialized' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Single background call at the top
    p.background(20, 25, 35);

    // Handle different game phases
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;

      case PHASE_PLAYING:
        // Start first puzzle if not loaded
        if (gameState.entities.length === 0) {
          loadPuzzle(0);
        }

        // Handle automated testing
        if (gameState.controlMode !== CONTROL_HUMAN) {
          const action = get_automated_testing_action(gameState);
          if (action) {
            processAutomatedInput(p, action);
          }
        }

        // Update game entities
        if (gameState.player) {
          gameState.player.update(p);

          // Log player info periodically
          if (p.frameCount % 10 === 0) {
            p.logs.player_info.push({
              screen_x: gameState.player.x,
              screen_y: gameState.player.y,
              game_x: gameState.player.x,
              game_y: gameState.player.y,
              framecount: p.frameCount
            });
          }
        }

        // Update all entities
        for (let entity of gameState.entities) {
          if (entity.update) {
            entity.update(p);
          }
        }

        // Update all tools
        for (let tool of gameState.tools) {
          if (tool.update) {
            tool.update(p);
          }
        }

        // Check puzzle completion
        checkPuzzleCompletion();

        // Draw the game
        drawPlayingScreen(p);

        gameState.framesSinceLastAction++;
        break;

      case PHASE_PAUSED:
        // Draw game state first, then pause overlay
        drawPlayingScreen(p);
        drawPausedScreen(p);
        break;

      case PHASE_GAME_OVER_WIN:
        drawGameOverScreen(p, true);
        break;

      case PHASE_GAME_OVER_LOSE:
        drawGameOverScreen(p, false);
        break;
    }
  };

  p.keyPressed = function() {
    handleKeyPressed(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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

  const activeBtn = mode === CONTROL_HUMAN ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' : 'test_2_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};