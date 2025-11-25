// input_handler.js - Input handling for human and automated testing

import { 
  gameState,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  STATE_MAIN_MENU, STATE_CREATING_GAME, STATE_ALLOCATING_POINTS, STATE_DEVELOPING,
  STATE_REVIEWING, STATE_RESEARCH_MENU
} from './globals.js';
import {
  startGame, pauseGame, restartGame,
  handleMainMenuSelection, handleGameTypeSelection,
  handlePointAllocation, confirmAllocation, handleResearchSelection
} from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  logInput(p, 'keyPressed', key, keyCode);
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      pauseGame();
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      restartGame();
    }
    return;
  }
  
  // Playing phase controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    handlePlayingInput(p, key, keyCode);
  }
}

export function handleKeyReleased(p, key, keyCode) {
  logInput(p, 'keyReleased', key, keyCode);
  
  if (keyCode === 90) { // Z
    gameState.fastForward = false;
  }
  
  if (keyCode === 16) { // Shift
    gameState.showingStats = false;
  }
}

function handlePlayingInput(p, key, keyCode) {
  // Stats view
  if (keyCode === 16) { // Shift
    gameState.showingStats = true;
    return;
  }
  
  // Fast forward
  if (keyCode === 90) { // Z
    gameState.fastForward = true;
    return;
  }
  
  // State-specific controls
  switch (gameState.playingState) {
    case STATE_MAIN_MENU:
      handleMainMenuInput(keyCode);
      break;
    case STATE_CREATING_GAME:
      handleGameCreationInput(keyCode);
      break;
    case STATE_ALLOCATING_POINTS:
      handleAllocationInput(keyCode);
      break;
    case STATE_REVIEWING:
      handleReviewInput(keyCode);
      break;
    case STATE_RESEARCH_MENU:
      handleResearchInput(keyCode);
      break;
  }
}

function handleMainMenuInput(keyCode) {
  if (keyCode === 38) { // UP
    gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.menuSelection = Math.min(2, gameState.menuSelection + 1);
  } else if (keyCode === 32) { // SPACE
    handleMainMenuSelection();
  }
}

function handleGameCreationInput(keyCode) {
  const availableTypes = gameState.gameTypes.filter(gt => gt.unlocked);
  
  if (keyCode === 38) { // UP
    gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.menuSelection = Math.min(availableTypes.length - 1, gameState.menuSelection + 1);
  } else if (keyCode === 32) { // SPACE
    handleGameTypeSelection();
  } else if (keyCode === 27) { // ESC (cancel)
    gameState.playingState = STATE_MAIN_MENU;
    gameState.menuSelection = 0;
  }
}

function handleAllocationInput(keyCode) {
  if (keyCode === 38) { // UP
    gameState.allocationFocus = Math.max(0, gameState.allocationFocus - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.allocationFocus = Math.min(2, gameState.allocationFocus + 1);
  } else if (keyCode === 37) { // LEFT
    handlePointAllocation('left');
  } else if (keyCode === 39) { // RIGHT
    handlePointAllocation('right');
  } else if (keyCode === 32) { // SPACE
    confirmAllocation();
  } else if (keyCode === 27) { // ESC (cancel)
    gameState.playingState = STATE_MAIN_MENU;
    gameState.menuSelection = 0;
  }
}

function handleReviewInput(keyCode) {
  if (keyCode === 32) { // SPACE
    gameState.playingState = STATE_MAIN_MENU;
    gameState.menuSelection = 0;
    gameState.currentGame = null;
  }
}

function handleResearchInput(keyCode) {
  const availableTech = gameState.technologies.filter(t => !t.researched);
  
  if (availableTech.length === 0) {
    if (keyCode === 32) {
      gameState.playingState = STATE_MAIN_MENU;
      gameState.menuSelection = 0;
    }
    return;
  }
  
  if (keyCode === 38) { // UP
    gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.menuSelection = Math.min(availableTech.length - 1, gameState.menuSelection + 1);
  } else if (keyCode === 32) { // SPACE
    handleResearchSelection();
  } else if (keyCode === 27) { // ESC (cancel)
    gameState.playingState = STATE_MAIN_MENU;
    gameState.menuSelection = 0;
  }
}

export function processAutomatedAction(action) {
  if (!action || gameState.gamePhase !== PHASE_PLAYING) return;
  
  const p = window.gameInstance;
  
  // Simulate key press for the action
  if (action.keyCode) {
    handleKeyPressed(p, action.key, action.keyCode);
    
    // Auto-release after one frame for most keys
    if (action.keyCode !== 90 && action.keyCode !== 16) {
      setTimeout(() => {
        handleKeyReleased(p, action.key, action.keyCode);
      }, 16);
    }
  }
}

function logInput(p, inputType, key, keyCode) {
  p.logs.inputs.push({
    input_type: inputType,
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}