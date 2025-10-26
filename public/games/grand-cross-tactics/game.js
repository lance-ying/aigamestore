// game.js - Main game file
import { gameState, GAME_PHASES, TURN_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initLevel, updateEnemyTurn } from './gameLogic.js';
import { initRendering, renderGame } from './rendering.js';
import { handleKeyPressed, setupControlMode, handleTestMode } from './input.js';

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
    p.frameRate(60);
    p.randomSeed(42);
    
    initRendering(p);
    setupControlMode();

    // Log initial state
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle test mode automation
    handleTestMode(p);

    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.currentTurnPhase === TURN_PHASES.ENEMY) {
        updateEnemyTurn(p);
      }

      // Log player state periodically
      if (gameState.player && p.frameCount % 60 === 0) {
        gameState.player.logState(p);
      }
    }

    // Render
    renderGame(p);
  };

  p.keyPressed = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleKeyPressed(p);
    }
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};