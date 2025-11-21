// game.js - Main game file

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, getGameState } from './globals.js';
import { Player } from './entities.js';
import { createLevel } from './level.js';
import { handleKeyPressed, handleKeyReleased, handleContinuousInput } from './input.js';
import { renderStartScreen, renderGame, renderGameOver } from './render.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // p5.js setup
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
      data: { gamePhase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Create level
    createLevel();
    
    // Create player
    const startCheckpoint = gameState.checkpoints[0];
    gameState.player = new Player(startCheckpoint.x + 20, startCheckpoint.y - 50);
    gameState.entities.unshift(gameState.player);
    
    // Start in paused state
    p.noLoop();
  };
  
  // p5.js draw loop
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const actions = get_automated_testing_action(gameState);
      
      // Simulate key presses
      for (let keyCode of actions) {
        if (keyCode === 37 || keyCode === 39) {
          // Arrow keys - handled continuously
          continue;
        } else if (keyCode === 32) {
          gameState.player.jump();
        } else if (keyCode === 90) {
          gameState.player.grab();
        }
      }
      
      // Handle continuous movement
      if (actions.includes(37)) {
        gameState.player.moveLeft();
      } else if (actions.includes(39)) {
        gameState.player.moveRight();
      }
      
      // Release grab if not in actions
      if (!actions.includes(90) && gameState.player.grabbing) {
        gameState.player.releaseGrab();
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === "START") {
      renderStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING") {
      // Handle human input
      if (gameState.controlMode === "HUMAN") {
        handleContinuousInput(p);
      }
      
      // Update game state
      updateGame(p);
      
      // Render game
      renderGame(p);
      
      // Log player info
      if (gameState.player && p.frameCount % 10 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x - gameState.cameraOffsetX,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
      renderGameOver(p, true);
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
      renderGameOver(p, false);
    } else if (gameState.gamePhase === "PAUSED") {
      renderGame(p);
    }
  };
  
  // Input handlers
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };
});

// Update game logic
function updateGame(p) {
  if (!gameState.player) return;
  
  // Update player
  gameState.player.update(p);
  
  // Update interactables
  for (let obj of gameState.interactables) {
    if (obj.update) {
      obj.update();
    }
  }
  
  // Update gates
  for (let entity of gameState.entities) {
    if (entity.type === 'gate') {
      entity.update();
      
      // Check if gate blocks player
      if (entity.blocksPlayer(gameState.player)) {
        // Push player back
        if (gameState.player.x < entity.x + entity.width / 2) {
          gameState.player.x = entity.x - gameState.player.width - 1;
        } else {
          gameState.player.x = entity.x + entity.width + 1;
        }
        gameState.player.velocityX = 0;
      }
    }
  }
  
  // Update hazards
  for (let hazard of gameState.hazards) {
    hazard.update(p);
    
    // Check collision with player
    if (hazard.checkCollision(gameState.player)) {
      gameState.player.die();
      break;
    }
  }
  
  // Check checkpoint activation
  for (let checkpoint of gameState.checkpoints) {
    if (checkpoint.checkActivation(gameState.player)) {
      if (checkpoint.isFinal) {
        // Game won!
        gameState.gamePhase = "GAME_OVER_WIN";
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, message: "Game completed!" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        p.noLoop();
      }
    }
  }
}

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

// Expose game instance
window.gameInstance = gameInstance;