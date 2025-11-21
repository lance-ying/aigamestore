// game.js
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleInput, logKeyPress, logKeyRelease } from './input_handler.js';
import { loadStage } from './stage_loader.js';
import { drawGame, drawStartScreen, drawGameOverScreen } from './renderer.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };

    // Log initial state
    p.logs.game_info.push({
      event: "game_initialized",
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(135, 206, 235);

    if (gameState.gamePhase === "START") {
      drawStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING") {
      // Update game time
      gameState.timeElapsed = (Date.now() - gameState.stageStartTime) / 1000;

      // Update all entities
      if (gameState.player) {
        gameState.player.update(p);

        // Log player position periodically
        if (p.frameCount % 10 === 0) {
          p.logs.player_info.push({
            screen_x: gameState.player.x - gameState.camera.x,
            screen_y: gameState.player.y,
            game_x: gameState.player.x,
            game_y: gameState.player.y,
            framecount: p.frameCount
          });

          // Track position for stall detection
          gameState.positionHistory.push({ x: gameState.player.x, y: gameState.player.y, frame: p.frameCount });
          if (gameState.positionHistory.length > 60) {
            gameState.positionHistory.shift();
          }
        }
      }

      for (let platform of gameState.platforms) {
        platform.update();
      }

      for (let coin of gameState.coins) {
        coin.update(p);
      }

      for (let enemy of gameState.enemies) {
        enemy.update(p);
      }

      for (let pickup of gameState.pickups) {
        pickup.update(p);
      }

      // Update goal
      for (let entity of gameState.entities) {
        if (entity.constructor.name === 'Goal') {
          entity.update(p);
        }
      }

      // Handle input
      handleInput(p);

      // Draw game
      drawGame(p);

    } else if (gameState.gamePhase === "PAUSED") {
      // Draw frozen game state
      drawGame(p);
      
      // Handle input for unpause
      handleInput(p);

    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      // Draw final game state
      drawGame(p);
      
      // Draw game over screen
      drawGameOverScreen(p);

      // Handle restart input
      handleInput(p);
    }
  };

  p.keyPressed = function() {
    logKeyPress(p, p.key, p.keyCode);
    handleInput(p);
    return false; // Prevent default
  };

  p.keyReleased = function() {
    logKeyRelease(p, p.key, p.keyCode);
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn'
  };

  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }

  gameInstance.logs.game_info.push({
    event: "control_mode_changed",
    data: { controlMode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};

export { gameInstance };