// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, getGameState } from './globals.js';
import { Player } from './player.js';
import { renderStartScreen, renderGameOverScreen, renderPlayingScreen, renderPauseOverlay } from './ui.js';
import { handleKeyPressed } from './input_handler.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup
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
    
    // Initialize player entity (for logging)
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    gameState.entities.push(gameState.player);
    
    // Log initial state
    p.logs.game_info.push({
      data: { event: "game_initialized", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    p.logs.player_info.push({
      screen_x: gameState.player.screen_x,
      screen_y: gameState.player.screen_y,
      game_x: gameState.player.game_x,
      game_y: gameState.player.game_y,
      framecount: p.frameCount
    });
  };
  
  // Draw
  p.draw = function() {
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        renderPlayingScreen(p);
        break;
      case GAME_PHASES.PAUSED:
        renderPlayingScreen(p);
        renderPauseOverlay(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
    
    // Log player info periodically during gameplay
    if (gameState.gamePhase === GAME_PHASES.PLAYING && p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.screen_x,
        screen_y: gameState.player.screen_y,
        game_x: gameState.player.game_x,
        game_y: gameState.player.game_y,
        framecount: p.frameCount
      });
    }
  };
  
  // Key pressed handler
  p.keyPressed = function() {
    // Since only HUMAN mode exists now, this check is implicitly true for player input.
    // However, it's good practice to keep it if other control modes might be added later.
    if (gameState.controlMode === "HUMAN") { 
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false; // Prevent default
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

// Control mode management
window.setControlMode = function(mode) {
  // As only 'HUMAN' mode remains, we can simplify this function.
  // The mode will always be 'HUMAN' when called from the button.
  gameState.controlMode = "HUMAN"; 
  
  // Update button states (only humanModeBtn exists now)
  const humanModeBtn = document.getElementById('humanModeBtn');
  if (humanModeBtn) {
    // Ensure only the humanModeBtn is active
    document.querySelectorAll('.control-button').forEach(btn => btn.classList.remove('active'));
    humanModeBtn.classList.add('active');
  }
};

// Expose getGameState globally
window.getGameState = getGameState;