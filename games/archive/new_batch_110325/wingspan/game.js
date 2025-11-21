// game.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initializeGame, updateMessage } from './game_logic.js';
import { handleKeyPressed, processAutomatedInput } from './input_handler.js';
import { drawStartScreen, drawPlayingScreen, drawGameOverScreen } from './renderer.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update messages
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateMessage();
    }
    
    // Handle automated testing
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedInput(p, action);
      }
    }
    
    // Render based on game phase
    switch(gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        drawPlayingScreen(p);
        break;
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
    const key = p.key;
    const keyCode = p.keyCode;
    
    // Handle phase transitions
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        initializeGame(p);
        
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else {
      handleKeyPressed(p, key, keyCode);
    }
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
};