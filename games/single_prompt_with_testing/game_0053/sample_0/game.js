// Main game file - p5.js instance mode setup
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, getGameState } from './globals.js';
import { handleKeyPress, handleKeyRelease, handlePlayerInput } from './input.js';
import { initializeGame, updateGame, resetGame } from './game_logic.js';
import { renderStartScreen, renderUI, renderPausedOverlay, renderGameOver, renderGame } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Get p5 from window
const p5 = window.p5;

// Create game instance
const gameInstance = new p5(p => {
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
    
    // Initialize game state
    gameState.gamePhase = PHASE_START;
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update frame count
    gameState.frameCount = p.frameCount;
    
    // Update delta time
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Single background call
    p.background(20, 10, 40);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        // Simulate key press
        if (!p.keyIsPressed || p.keyCode !== action.keyCode) {
          p.keyCode = action.keyCode;
          handleKeyPress(p);
        }
      }
    }
    
    // Game loop based on phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        if (gameState.controlMode === "HUMAN") {
          handlePlayerInput(p);
        }
        updateGame(p);
        renderGame(p);
        renderUI(p);
        break;
        
      case PHASE_PAUSED:
        renderGame(p);
        renderUI(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderUI(p);
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPress(p);
    
    // Initialize game on first ENTER press
    if (p.keyCode === 13 && gameState.gamePhase === PHASE_PLAYING && !gameState.player) {
      initializeGame(p);
    }
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching for testing
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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                    'test_2_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
  
  // Restart if in game
  if (gameState.gamePhase === PHASE_PLAYING) {
    resetGame(gameInstance);
    gameState.gamePhase = PHASE_START;
  }
};