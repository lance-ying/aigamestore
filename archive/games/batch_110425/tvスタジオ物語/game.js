// game.js - Main game file
import { gameState, GAME_PHASES, PLAY_PHASES, initGameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, SET_PIECES } from './globals.js';
import { renderStartScreen, renderGameOver, renderPlaying } from './rendering.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';
import { produceProgram, resetCurrentProgram } from './program.js';
import { autoUnlockBasedOnProgress } from './unlocks.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    initGameState();
    
    // Store SET_PIECES reference in gameState for easy access
    gameState.SET_PIECES = SET_PIECES;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: "initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        renderPlaying(p);
        updateGame(p);
        break;
        
      case GAME_PHASES.PAUSED:
        renderPlaying(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
        renderGameOver(p, true);
        break;
        
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOver(p, false);
        break;
    }
    
    // Process automated input if in test mode
    if (gameState.controlMode !== "HUMAN") {
      processAutomatedInput(p);
    }
  };
  
  function updateGame(p) {
    // Update production timer
    if (gameState.playPhase === PLAY_PHASES.PRODUCING) {
      gameState.productionTimer++;
      
      if (gameState.productionTimer >= gameState.productionDuration) {
        // Finish production
        produceProgram();
        gameState.playPhase = PLAY_PHASES.RESULTS;
        gameState.resultDisplayTimer = 0;
        
        // Check win condition
        if (gameState.fans >= 1000) {
          gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
          p.logs.game_info.push({
            data: { phase: gameState.gamePhase, fans: gameState.fans },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
        
        // Auto-unlock content
        autoUnlockBasedOnProgress();
      }
    }
    
    // Update result display timer
    if (gameState.playPhase === PLAY_PHASES.RESULTS) {
      gameState.resultDisplayTimer++;
    }
    
    // Log player info periodically (every 60 frames)
    if (p.frameCount % 60 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x || 0,
        screen_y: gameState.player.y || 0,
        game_x: gameState.player.x || 0,
        game_y: gameState.player.y || 0,
        framecount: p.frameCount
      });
    }
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Set control mode function
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' :
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

// Expose getGameState globally
window.getGameState = getGameState;

export default gameInstance;