import { gameState } from './globals.js';

// Key codes
export const KEYS = {
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  SPACE: 32,
  SHIFT: 16,
  Z: 90,
  ENTER: 13,
  ESC: 27,
  R: 82
};

export function setupInputHandling(p) {
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      "input_type": "keyPressed",
      "data": { key: p.key, keyCode: p.keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    
    // Track pressed keys
    gameState.keyPressed[p.keyCode] = true;
    
    // Handle game state transitions
    if (p.keyCode === KEYS.ENTER && gameState.gamePhase === "START") {
      startGame(p);
    } else if (p.keyCode === KEYS.ESC && gameState.gamePhase === "PLAYING") {
      pauseGame(p);
    } else if (p.keyCode === KEYS.ESC && gameState.gamePhase === "PAUSED") {
      resumeGame(p);
    } else if (p.keyCode === KEYS.R) {
      if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
      } else {
        restartGame(p);
      }
    }
  };
  
  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      "input_type": "keyReleased",
      "data": { key: p.key, keyCode: p.keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    
    // Track released keys
    gameState.keyPressed[p.keyCode] = false;
  };
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    "game_status": "PLAYING",
    "data": {},
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = "PAUSED";
  p.logs.game_info.push({
    "game_status": "PAUSED",
    "data": {},
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}

function resumeGame(p) {
  gameState.gamePhase = "PLAYING";
  p.logs.game_info.push({
    "game_status": "PLAYING",
    "data": {},
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = "START";
  p.logs.game_info.push({
    "game_status": "START",
    "data": {},
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = "START";
  p.logs.game_info.push({
    "game_status": "START",
    "data": {},
    "framecount": p.frameCount,
    "timestamp": Date.now()
  });
}

export function handleGameInput(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  // In human mode, use keyboard input
  if (gameState.controlMode === "HUMAN") {
    if ((p.keyIsDown(KEYS.SPACE) || p.keyIsDown(KEYS.UP)) && 
        p.frameCount - gameState.lastJumpFrame > 5) {
      gameState.player.jump();
      gameState.lastJumpFrame = p.frameCount;
    }
  } 
  // In test mode, use the testing controller
  else if (gameState.controlMode.startsWith("TEST_")) {
    const action = window.game_testing_controller(gameState);
    if (action === KEYS.SPACE || action === KEYS.UP) {
      gameState.player.jump();
      gameState.lastJumpFrame = p.frameCount;
    }
  }
}