import { gameState, logInput } from './globals.js';
import { resetGame } from './game.js';

export function setupInputHandlers() {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(event) {
  const keyCode = event.keyCode;
  const key = event.key;
  
  // Prevent default for game keys
  if ([13, 27, 32, 37, 38, 39, 40, 65, 68, 82, 83, 87, 90, 16].includes(keyCode)) {
    event.preventDefault();
  }
  
  // Log input
  logInput('keydown', key, keyCode);
  
  // Store key state
  gameState.keys[keyCode] = true;
  
  // Phase-specific controls
  if (keyCode === 13 && gameState.gamePhase === "START") { // ENTER
    startGame();
  }
  
  if (keyCode === 27) { // ESC
    togglePause();
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE" ||
        gameState.gamePhase === "PAUSED") {
      resetGame();
    }
  }
  
  // Gameplay controls (only during PLAYING phase)
  if (gameState.gamePhase === "PLAYING" && gameState.player) {
    // Jump (Space)
    if (keyCode === 32) {
      if (gameState.player.onGround) {
        gameState.player.jump();
      } else {
        // Try super jump if in air
        gameState.player.superJump();
      }
    }
    
    // Dash (Shift)
    if (keyCode === 16) {
      gameState.player.dash();
    }
    
    // Shoot (Z)
    if (keyCode === 90) {
      gameState.player.shoot();
    }
  }
}

function handleKeyUp(event) {
  const keyCode = event.keyCode;
  const key = event.key;
  
  // Log input
  logInput('keyup', key, keyCode);
  
  // Clear key state
  gameState.keys[keyCode] = false;
}

export function processInput() {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;
  
  // Movement input
  gameState.player.moveForwardPressed = false;
  gameState.player.moveBackwardPressed = false;
  gameState.player.strafeLeftPressed = false;
  gameState.player.strafeRightPressed = false;
  
  // Forward (W or Up Arrow)
  if (gameState.keys[87] || gameState.keys[38]) {
    gameState.player.moveForward();
    gameState.player.moveForwardPressed = true;
  }
  
  // Backward (S or Down Arrow)
  if (gameState.keys[83] || gameState.keys[40]) {
    gameState.player.moveBackward();
    gameState.player.moveBackwardPressed = true;
  }
  
  // Strafe left (A or Left Arrow)
  if (gameState.keys[65] || gameState.keys[37]) {
    gameState.player.strafeLeft();
    gameState.player.strafeLeftPressed = true;
  }
  
  // Strafe right (D or Right Arrow)
  if (gameState.keys[68] || gameState.keys[39]) {
    gameState.player.strafeRight();
    gameState.player.strafeRightPressed = true;
  }
}

function startGame() {
  gameState.gamePhase = "PLAYING";
  gameState.gameStartTime = Date.now();
  
  // Log game start
  if (window.logs) {
    window.logs.game_info.push({
      game_status: "PLAYING",
      data: {},
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

function togglePause() {
  if (gameState.gamePhase === "PLAYING") {
    gameState.gamePhase = "PAUSED";
  } else if (gameState.gamePhase === "PAUSED") {
    gameState.gamePhase = "PLAYING";
  }
  
  // Log phase change
  if (window.logs) {
    window.logs.game_info.push({
      game_status: gameState.gamePhase,
      data: {},
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}