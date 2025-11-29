import { gameState, GAME_PHASES, resetGameState, initializePlayer, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializeGrid } from './grid.js';
import { drawStartScreen, drawPlayingScreen, drawGameOverScreen } from './rendering.js';
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
    p.frameRate(60);
    p.randomSeed(42);
    
    resetGameState();
    
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Single background call
    p.background(30, 25, 40);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.frameCount % 5 === 0) { // Act every 5 frames
        const action = get_automated_testing_action(gameState);
        if (action) {
          processAutomatedInput(p, action);
        }
      }
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
  };

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p);
    }
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Initialize game when starting
gameInstance.setup = function() {
  gameInstance.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  gameInstance.frameRate(60);
  gameInstance.randomSeed(42);
  
  resetGameState();
  initializeGrid(gameInstance);
  
  gameInstance.logs.game_info.push({
    data: { phase: GAME_PHASES.START },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};