// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';
import { Player } from './entities.js';
import { spawnNumberBall, updateEntities, updateGameTimer, updateDifficultyLevel } from './game_logic.js';
import { drawStartScreen, drawPlayingScreen, drawGameOverScreen } from './rendering.js';
import { handleKeyPressed, handleKeyReleased } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs (write-only!)
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize player
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
    gameState.entities = [gameState.player];
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  };
  
  // Draw function
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const actions = get_automated_testing_action(gameState);
      actions.forEach(keyCode => {
        if (!gameState.keysPressed[keyCode]) {
          handleKeyPressed(p, String.fromCharCode(keyCode), keyCode);
        }
      });
      
      // Release keys not in current action set
      Object.keys(gameState.keysPressed).forEach(keyCode => {
        const code = parseInt(keyCode);
        if (gameState.keysPressed[code] && !actions.includes(code)) {
          handleKeyReleased(p, String.fromCharCode(code), code);
        }
      });
    }
    
    // Render based on game phase
    if (gameState.gamePhase === PHASE_START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      // Update game state (but not when paused)
      if (gameState.gamePhase === PHASE_PLAYING) {
        // Update player
        if (gameState.player) {
          const moveLeft = p.keyIsDown(37) || gameState.keysPressed[37];
          const moveRight = p.keyIsDown(39) || gameState.keysPressed[39];
          gameState.player.update(moveLeft, moveRight);
        }
        
        // Update slicing line
        if (gameState.sliceStartPos && gameState.player) {
          gameState.slicingLine = {
            x1: gameState.sliceStartPos.x,
            y1: gameState.sliceStartPos.y,
            x2: gameState.player.x,
            y2: gameState.player.y - 30
          };
        }
        
        // Spawn and update entities
        spawnNumberBall(p);
        updateEntities();
        updateGameTimer(p);
        updateDifficultyLevel();
      }
      
      drawPlayingScreen(p);
    } else {
      // Game over screen
      drawGameOverScreen(p);
    }
  };
  
  // Key handlers
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
  };
  
  p.keyReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyReleased(p, p.key, p.keyCode);
    }
  };
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
};