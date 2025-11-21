// input_handler.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { initializeGame, handleElementSelection, navigateUp, navigateDown, navigateLeft, navigateRight } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  if (p.logs) {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      initializeGame();
      
      if (p.logs) {
        p.logs.game_info.push({
          data: "Game started",
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.noLoop();
      
      if (p.logs) {
        p.logs.game_info.push({
          data: "Game paused",
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.loop();
      
      if (p.logs) {
        p.logs.game_info.push({
          data: "Game resumed",
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      
      if (p.logs) {
        p.logs.game_info.push({
          data: "Restarting to start screen",
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    return;
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (keyCode === 38) { // UP
    navigateUp();
  } else if (keyCode === 40) { // DOWN
    navigateDown();
  } else if (keyCode === 37) { // LEFT
    navigateLeft();
  } else if (keyCode === 39) { // RIGHT
    navigateRight();
  } else if (keyCode === 32) { // SPACE
    handleElementSelection(p);
  }
}

export function processAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  // Get action from automated testing controller
  if (typeof window.get_automated_testing_action === 'function') {
    const action = window.get_automated_testing_action(gameState);
    
    if (action && action.keyCode) {
      handleKeyPressed(p, action.key, action.keyCode);
    }
  }
}