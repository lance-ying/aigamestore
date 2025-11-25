import { gameState, logInput } from './globals.js';
import { resetGame } from './game.js';
import { rotateCameraSmooth } from './camera.js';

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
  
  // Movement input (WASD only)
  gameState.player.moveForwardPressed = false;
  gameState.player.moveBackwardPressed = false;
  gameState.player.strafeLeftPressed = false;
  gameState.player.strafeRightPressed = false;
  
  // Forward (W)
  if (gameState.keys[87]) {
    gameState.player.moveForward();
    gameState.player.moveForwardPressed = true;
  }
  
  // Backward (S)
  if (gameState.keys[83]) {
    gameState.player.moveBackward();
    gameState.player.moveBackwardPressed = true;
  }
  
  // Strafe left (A)
  if (gameState.keys[65]) {
    gameState.player.strafeLeft();
    gameState.player.strafeLeftPressed = true;
  }
  
  // Strafe right (D)
  if (gameState.keys[68]) {
    gameState.player.strafeRight();
    gameState.player.strafeRightPressed = true;
  }
  
  // Camera rotation (Arrow keys)
  const cameraRotationSpeed = 0.05;
  
  // Rotate left (Left Arrow)
  if (gameState.keys[37]) {
    gameState.cameraRotation.yaw += cameraRotationSpeed;
  }
  
  // Rotate right (Right Arrow)
  if (gameState.keys[39]) {
    gameState.cameraRotation.yaw -= cameraRotationSpeed;
  }
  
  // Look up (Up Arrow)
  if (gameState.keys[38]) {
    gameState.cameraRotation.pitch += cameraRotationSpeed;
    gameState.cameraRotation.pitch = Math.min(gameState.cameraRotation.pitch, Math.PI / 2.5);
  }
  
  // Look down (Down Arrow)
  if (gameState.keys[40]) {
    gameState.cameraRotation.pitch -= cameraRotationSpeed;
    gameState.cameraRotation.pitch = Math.max(gameState.cameraRotation.pitch, -Math.PI / 2.5);
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