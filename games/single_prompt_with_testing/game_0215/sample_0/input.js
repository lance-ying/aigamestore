// input.js - Input handling and keyboard management

import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  resetGameState,
  getCurrentTask,
  getRoomForTask
} from './globals.js';

// Key state tracking
const keys = {};

// Key code constants
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_SPACE = 32;
const KEY_SHIFT = 16;
const KEY_Z = 90;
const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_R = 82;

export function handleKeyPress(p) {
  keys[p.keyCode] = true;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Handle phase-specific controls
  if (p.keyCode === KEY_ENTER) {
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
  }
  
  if (p.keyCode === KEY_ESC) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: PHASE_PAUSED },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: PHASE_PLAYING },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  if (p.keyCode === KEY_R) {
    if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
        gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      resetGameState();
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: PHASE_START },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
}

export function handleKeyRelease(p) {
  keys[p.keyCode] = false;
  
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

export function handlePlayerMovement() {
  if (!gameState.player || gameState.taskInProgress) {
    if (gameState.player) {
      gameState.player.stopWalking();
    }
    return;
  }
  
  let moved = false;
  
  if (isKeyPressed(KEY_LEFT)) {
    gameState.player.moveLeft();
    moved = true;
  }
  if (isKeyPressed(KEY_RIGHT)) {
    gameState.player.moveRight();
    moved = true;
  }
  if (isKeyPressed(KEY_UP)) {
    gameState.player.moveUp();
    moved = true;
  }
  if (isKeyPressed(KEY_DOWN)) {
    gameState.player.moveDown();
    moved = true;
  }
  
  if (!moved) {
    gameState.player.stopWalking();
  }
}

export function handleInteraction(p) {
  if (isKeyPressed(KEY_SPACE) || isKeyPressed(KEY_Z)) {
    // Check for interactable objects
    for (const obj of gameState.interactables) {
      if (obj.canInteract()) {
        obj.interact();
        break;
      }
    }
    
    // Handle puzzle input
    if (gameState.currentPuzzle && !gameState.currentPuzzle.showingPattern) {
      // Map arrow keys to puzzle buttons (0-3)
      let buttonIndex = -1;
      if (isKeyPressed(KEY_UP)) buttonIndex = 0;
      else if (isKeyPressed(KEY_RIGHT)) buttonIndex = 1;
      else if (isKeyPressed(KEY_DOWN)) buttonIndex = 2;
      else if (isKeyPressed(KEY_LEFT)) buttonIndex = 3;
      
      if (buttonIndex >= 0) {
        gameState.currentPuzzle.addInput(buttonIndex);
        // Prevent repeated input
        keys[KEY_UP] = false;
        keys[KEY_RIGHT] = false;
        keys[KEY_DOWN] = false;
        keys[KEY_LEFT] = false;
      }
    }
  }
}

function startGame(p) {
  resetGameState();
  gameState.gamePhase = PHASE_PLAYING;
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: PHASE_PLAYING },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

// Handle automated testing actions
export function handleAutomatedAction(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  const action = window.get_automated_testing_action(gameState);
  if (!action) return;
  
  // Simulate key press
  if (action.keyCode) {
    keys[action.keyCode] = true;
    
    // Auto-release after one frame
    setTimeout(() => {
      keys[action.keyCode] = false;
    }, 16);
  }
}