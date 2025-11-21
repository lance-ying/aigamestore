// input_handler.js - Handle all user inputs

import { gameState, GAME_PHASES } from './globals.js';
import { initializeGame, handleBuildingSelection, handleWorkerAssignment, openMenu, closeMenu, handleMenuNavigation, handleMenuAction } from './game_logic.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      initializeGame();
      p.logs.game_info.push({
        data: { phase: "PLAYING", message: "Game started" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: "START", message: "Restarted" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Menu controls
  if (gameState.menuOpen) {
    if (keyCode === 90) { // Z - close menu
      closeMenu();
    } else if (keyCode === 38) { // UP
      handleMenuNavigation('up');
    } else if (keyCode === 40) { // DOWN
      handleMenuNavigation('down');
    } else if (keyCode === 32) { // SPACE - action
      handleMenuAction();
    }
    return;
  }
  
  // Normal gameplay controls
  if (keyCode === 37) { // LEFT
    handleBuildingSelection('prev');
  } else if (keyCode === 39) { // RIGHT
    handleBuildingSelection('next');
  } else if (keyCode === 32) { // SPACE
    handleWorkerAssignment();
  } else if (keyCode === 90) { // Z
    // Open appropriate menu based on context
    if (gameState.buildings.some(b => b.type === 'training_ground')) {
      // If we have hunters, show expedition menu, otherwise crafting
      if (gameState.hunters.length > 0) {
        openMenu('expedition');
      } else {
        openMenu('craft');
      }
    } else {
      // Early game - show build menu
      openMenu('build');
    }
  }
}

export function handleKeyReleased(p, keyCode) {
  // Currently no key release handlers needed
}

export function getAutomatedInput(p) {
  if (gameState.controlMode === "HUMAN") return null;
  
  // Get action from automated testing controller
  if (window.get_automated_testing_action) {
    return window.get_automated_testing_action(gameState);
  }
  
  return null;
}

export function processAutomatedInput(p, action) {
  if (!action || !action.keyCode) return;
  
  // Simulate key press
  handleKeyPressed(p, action.keyCode);
}