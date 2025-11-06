import { KEY, gameState } from './globals.js';

// Track key states
export const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  shoot: false,
  sprint: false,
  crouch: false
};

export function setupInputHandlers(p) {
  p.keyPressed = function() {
    handleKeyPress(p, p.keyCode);
    
    // Log the input
    p.logs.inputs.push({
      "input_type": "keyPressed",
      "data": { "key": p.key, "keyCode": p.keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    
    // Prevent default behavior for game keys
    return !(Object.values(KEY).includes(p.keyCode));
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p, p.keyCode);
    
    // Log the input
    p.logs.inputs.push({
      "input_type": "keyReleased",
      "data": { "key": p.key, "keyCode": p.keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    
    // Prevent default behavior for game keys
    return !(Object.values(KEY).includes(p.keyCode));
  };
}

export function handleKeyPress(p, keyCode) {
  // Handle human controls
  if (gameState.controlMode === "HUMAN") {
    switch (keyCode) {
      case KEY.UP:
        keys.up = true;
        break;
      case KEY.DOWN:
        keys.down = true;
        break;
      case KEY.LEFT:
        keys.left = true;
        break;
      case KEY.RIGHT:
        keys.right = true;
        break;
      case KEY.Z:
        keys.shoot = true;
        break;
      case KEY.SPACE:
        keys.sprint = true;
        break;
      case KEY.SHIFT:
        keys.crouch = true;
        break;
      case KEY.ENTER:
        if (gameState.gamePhase === "START") {
          startGame(p);
        }
        break;
      case KEY.ESC:
        if (gameState.gamePhase === "PLAYING") {
          pauseGame(p);
        } else if (gameState.gamePhase === "PAUSED") {
          resumeGame(p);
        }
        break;
      case KEY.R:
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
          resetToStart(p);
        }
        break;
    }
  }
  // If not in HUMAN mode, automated testing controller handles inputs
}

export function handleKeyRelease(p, keyCode) {
  if (gameState.controlMode === "HUMAN") {
    switch (keyCode) {
      case KEY.UP:
        keys.up = false;
        break;
      case KEY.DOWN:
        keys.down = false;
        break;
      case KEY.LEFT:
        keys.left = false;
        break;
      case KEY.RIGHT:
        keys.right = false;
        break;
      case KEY.Z:
        keys.shoot = false;
        break;
      case KEY.SPACE:
        keys.sprint = false;
        break;
      case KEY.SHIFT:
        keys.crouch = false;
        break;
    }
  }
}

// Handle automated testing inputs
export function handleAutomatedInputs(p) {
  if (gameState.gamePhase === "PLAYING" && gameState.controlMode !== "HUMAN") {
    // Get action from testing controller
    const action = window.game_testing_controller(gameState);
    
    // Reset all keys first
    keys.up = false;
    keys.down = false;
    keys.left = false;
    keys.right = false;
    keys.shoot = false;
    keys.sprint = false;
    keys.crouch = false;
    
    // Apply the action if one is returned
    if (action !== null) {
      switch (action) {
        case KEY.UP:
          keys.up = true;
          break;
        case KEY.DOWN:
          keys.down = true;
          break;
        case KEY.LEFT:
          keys.left = true;
          break;
        case KEY.RIGHT:
          keys.right = true;
          break;
        case KEY.Z:
          keys.shoot = true;
          break;
        case KEY.SPACE:
          keys.sprint = true;
          break;
        case KEY.SHIFT:
          keys.crouch = true;
          break;
      }
    }
  }
}

export function startGame(p) {
  gameState.gamePhase = "PLAYING";
  
  // Log game status change
  p.logs.game_info.push({
    "game_status": gameState.gamePhase,
    "data": {},
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}

export function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  
  // Log game status change
  p.logs.game_info.push({
    "game_status": gameState.gamePhase,
    "data": {},
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}

export function resumeGame(p) {
  gameState.gamePhase = "PLAYING";
  
  // Log game status change
  p.logs.game_info.push({
    "game_status": gameState.gamePhase,
    "data": {},
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}

export function resetToStart(p) {
  gameState.gamePhase = "START";
  
  // Log game status change
  p.logs.game_info.push({
    "game_status": gameState.gamePhase,
    "data": {},
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}