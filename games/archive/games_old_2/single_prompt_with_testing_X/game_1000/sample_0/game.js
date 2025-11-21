import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import { Player } from './player.js';
import { updateGameLogic, resetGame } from './game_logic.js';
import { renderGame } from './rendering.js';
import { handleKeyPressed, processAutomatedInput } from './input_handler.js';
import { createUIControls } from './ui_controls.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs (write-only)
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);

    // Initialize player
    gameState.player = new Player(p);
    gameState.entities = [gameState.player];

    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Render game
    renderGame(p);

    // Update game logic
    if (gameState.gamePhase === 'PLAYING') {
      // Process automated testing input
      processAutomatedInput(p);
      
      // Update game
      updateGameLogic(p);

      // Log player info periodically
      if (p.frameCount % 10 === 0 && gameState.player) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.distance,
          framecount: p.frameCount
        });
      }
    }
  };

  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false; // Prevent default behavior
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Create UI controls after a short delay to ensure DOM is ready
setTimeout(() => {
  createUIControls();
}, 100);