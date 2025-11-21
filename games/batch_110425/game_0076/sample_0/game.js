// game.js - Main game file
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS } from './globals.js';
import { createVignetteSequence } from './vignettes.js';
import { renderStartScreen, renderPauseIndicator, renderGameOver, renderVignette, renderUI } from './rendering.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';
import { updateGame } from './game_logic.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize game state
    gameState.gamePhase = GAME_PHASES.START;
    gameState.storyBeats = createVignetteSequence();
    gameState.totalVignettes = gameState.storyBeats.length;
    gameState.currentVignette = null;
    
    // Log initialization
    p.logs.game_info.push({
      data: { phase: "START", action: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Draw function
  p.draw = function() {
    p.background(240, 240, 250);
    
    // Process automated testing input
    if (gameState.controlMode !== "HUMAN") {
      processAutomatedInput(p);
    }
    
    // Update game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        renderVignette(p);
        renderUI(p);
        break;
        
      case GAME_PHASES.PAUSED:
        renderVignette(p);
        renderUI(p);
        renderPauseIndicator(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p);
        break;
    }
  };
  
  // Input handling
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;