// game.js - Main game file

import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, GAME_PHASES, CONTROL_MODES, gameState
} from './globals.js';
import { getLevelData } from './levels.js';
import { InputState, updateInputFromKeyboard } from './input.js';
import { initGame, updateGame } from './game_logic.js';
import { 
  drawStartScreen, drawPauseIndicator, drawGameOverScreen, 
  drawLevel, drawUI, drawBackground 
} from './rendering.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let inputs;

  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  // Function to handle a full game restart
  function _internalRestartGame() {
    // Clear any pending auto-restart timeout if it exists
    if (gameState.autoRestartTimeoutId) {
      clearTimeout(gameState.autoRestartTimeoutId);
      gameState.autoRestartTimeoutId = null;
    }
    gameState.autoRestartScheduled = false; // Reset the flag

    initGame(p); // Reinitialize all game state
    gameState.gamePhase = GAME_PHASES.PLAYING; // Start playing immediately after restart
    
    p.logs.game_info.push({
      data: { event: "game_restarted_internal", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    inputs = new InputState();
    
    // Log initialization
    p.logs.game_info.push({
      data: { event: "setup_complete", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Clear background once
    p.background(20, 20, 40);
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Get input for HUMAN control mode
      updateInputFromKeyboard(p, inputs);
      
      // Update game
      updateGame(p, inputs);
      
      // Render
      drawBackground(p);
      const level = getLevelData(gameState.currentLevel);
      drawLevel(p, level);
      
      // Draw entities
      for (let entity of gameState.entities) {
        if (entity.draw) {
          entity.draw(p);
        }
      }
      
      drawUI(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Still draw the game, but frozen
      drawBackground(p);
      const level = getLevelData(gameState.currentLevel);
      drawLevel(p, level);
      
      for (let entity of gameState.entities) {
        if (entity.draw) {
          entity.draw(p);
        }
      }
      
      drawUI(p);
      drawPauseIndicator(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      // Draw final game state
      drawBackground(p);
      const level = getLevelData(gameState.currentLevel);
      drawLevel(p, level);
      
      for (let entity of gameState.entities) {
        if (entity.draw) {
          entity.draw(p);
        }
      }
      
      drawUI(p);
      drawGameOverScreen(p);

      // Auto-restart logic after game over
      if (!gameState.autoRestartScheduled) {
        gameState.autoRestartScheduled = true;
        gameState.autoRestartTimeoutId = setTimeout(() => {
          _internalRestartGame(); // Trigger auto-restart
        }, 1000); // 1 second delay
      }
    }
  };

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        initGame(p);
        
        p.logs.game_info.push({
          data: { event: "game_started", phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        
        p.logs.game_info.push({
          data: { event: "game_paused", phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        
        p.logs.game_info.push({
          data: { event: "game_resumed", phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      // Manual restart: takes priority over auto-restart
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
          gameState.gamePhase === GAME_PHASES.PLAYING ||
          gameState.gamePhase === GAME_PHASES.PAUSED) {
        _internalRestartGame(); // Call the shared restart function
      }
    }
    
    // Prevent default for game keys
    if ([13, 27, 32, 37, 38, 39, 40, 82, 90].includes(p.keyCode)) {
      return false;
    }
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  // Ensure mode is always HUMAN since test modes are removed
  gameState.controlMode = CONTROL_MODES.HUMAN;
  
  // Update button states
  const humanModeBtn = document.getElementById('humanModeBtn');
  if (humanModeBtn) {
    humanModeBtn.classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: { event: "control_mode_changed", mode: gameState.controlMode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};