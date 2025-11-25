import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initializePuzzles, executeStep, loadPuzzle } from './puzzleManager.js';
import { setupInput, handleKeyPressed, handleKeyTyped, handleBackspace, handleEnterInEditMode, processAutomatedInput, updateCursorBlink } from './input.js';
import { drawStartScreen, drawPlayingScreen, drawPausedScreen, drawGameOverScreen } from './render.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

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
    
    // Initialize game
    initializePuzzles();
    
    setupInput(p);
    
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, event: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedInput(p, action);
      }
    }
    
    // Update cursor blink
    updateCursorBlink(p);
    
    // Game logic
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.framesSinceLastStep++;
      
      if (gameState.framesSinceLastStep >= gameState.executionSpeed) {
        executeStep();
        gameState.framesSinceLastStep = 0;
      }
      
      // Check for puzzle completion leading to game over
      if (gameState.puzzleComplete) {
        // Check if there are more puzzles
        if (gameState.currentPuzzle < gameState.puzzles.length - 1) {
          // Load next puzzle after a delay
          if (gameState.framesSinceLastStep > 60) {
            gameState.currentPuzzle++;
            loadPuzzle(gameState.currentPuzzle);
          }
        } else {
          // All puzzles complete
          gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
          p.logs.game_info.push({
            data: { gamePhase: gameState.gamePhase, event: "all_puzzles_complete" },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
    }
    
    // Render
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        drawPlayingScreen(p);
        break;
      case GAME_PHASES.PAUSED:
        drawPausedScreen(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    handleEnterInEditMode(p);
    handleBackspace(p);
    return false; // Prevent default
  };
  
  p.keyTyped = function() {
    handleKeyTyped(p);
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode setter
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