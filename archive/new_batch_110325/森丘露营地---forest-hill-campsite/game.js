// game.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { updateGame, initGame } from './game_logic.js';
import { drawStartScreen, drawGameOverScreen, drawPlayingScreen } from './rendering.js';
import { handleKeyPressed, handleAutomatedInput } from './input_handler.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
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
    
    // Initialize game state
    gameState.gamePhase = GAME_PHASES.START;
    gameState.gridSize = 40;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call
    p.background(40, 80, 60);
    
    // Handle automated input
    handleAutomatedInput(p);
    
    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
      case GAME_PHASES.PAUSED:
        drawPlayingScreen(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
    
    // Log player info periodically
    if (p.frameCount % 10 === 0 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.campers.length > 0) {
        const camper = gameState.campers[0];
        p.logs.player_info.push({
          screen_x: camper.x - gameState.cameraX,
          screen_y: camper.y - gameState.cameraY,
          game_x: camper.x,
          game_y: camper.y,
          framecount: p.frameCount
        });
      }
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode management
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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : `test_${mode.split('_')[1]}_ModeBtn`;
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};

export { gameInstance };