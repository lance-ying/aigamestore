// input.js - Input handling
import { gameState, logInput, logGameInfo } from './globals.js';
import { resetGame } from './game.js';

// Setup input handlers
export function setupInput() {
  // Keyboard input
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  
  // Mouse movement (for looking around)
  document.addEventListener('mousemove', handleMouseMove);
  
  // Pointer lock for FPS controls
  document.addEventListener('click', () => {
    if (gameState.gamePhase === "PLAYING") {
      document.body.requestPointerLock();
    }
  });
  
  // Exit pointer lock on ESC
  document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === null && gameState.gamePhase === "PLAYING") {
      // Pointer lock released - could auto-pause here
    }
  });
}

// Handle key down
function handleKeyDown(event) {
  logInput('keydown', event.key, event.keyCode);
  gameState.keys[event.keyCode] = true;
  
  // Phase controls
  if (event.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
    gameState.gamePhase = "PLAYING";
    gameState.levelStartTime = performance.now();
    logGameInfo({ action: 'game_started' });
  }
  
  if (event.keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      logGameInfo({ action: 'game_paused' });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      logGameInfo({ action: 'game_resumed' });
    }
  }
  
  if (event.keyCode === 82) { // R - Restart
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE" ||
        gameState.gamePhase === "PAUSED") {
      resetGame();
      logGameInfo({ action: 'game_restarted' });
    }
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase === "PLAYING" && gameState.player) {
    // Card switching
    if (event.keyCode === 49) { // 1
      gameState.player.switchCard(0);
    }
    if (event.keyCode === 50) { // 2
      gameState.player.switchCard(1);
    }
    if (event.keyCode === 51) { // 3
      gameState.player.switchCard(2);
    }
    
    // Shoot
    if (event.keyCode === 90) { // Z
      gameState.player.shoot();
    }
  }
  
  // Prevent default for game keys
  if ([32, 37, 38, 39, 40, 87, 65, 83, 68].includes(event.keyCode)) {
    event.preventDefault();
  }
}

// Handle key up
function handleKeyUp(event) {
  logInput('keyup', event.key, event.keyCode);
  gameState.keys[event.keyCode] = false;
}

// Handle mouse movement
function handleMouseMove(event) {
  if (document.pointerLockElement === document.body && gameState.gamePhase === "PLAYING") {
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    if (gameState.player) {
      gameState.player.look(movementX, movementY);
    }
  }
}

// Process continuous input (called each frame)
export function processInput() {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) {
    return;
  }
  
  // Movement controls
  if (gameState.keys[87] || gameState.keys[38]) { // W or Up Arrow
    gameState.player.moveForward();
  }
  if (gameState.keys[83] || gameState.keys[40]) { // S or Down Arrow
    gameState.player.moveBackward();
  }
  if (gameState.keys[65] || gameState.keys[37]) { // A or Left Arrow
    gameState.player.strafeLeft();
  }
  if (gameState.keys[68] || gameState.keys[39]) { // D or Right Arrow
    gameState.player.strafeRight();
  }
  
  // Jump
  if (gameState.keys[32]) { // Space
    if (gameState.player.onGround) {
      gameState.player.jump();
    } else {
      // Use card ability in air
      gameState.player.useCardAbility();
    }
  }
  
  // Sprint
  gameState.player.isSprinting = gameState.keys[16]; // Shift
}

// Automated test input
export function processTestInput() {
  if (!gameState.player) return;
  
  const testMode = gameState.controlMode;
  
  if (testMode === "TEST_1") {
    // Basic movement test - move forward and jump
    gameState.player.moveForward();
    
    if (gameState.frameCount % 120 === 0) {
      gameState.player.jump();
    }
    
    // Strafe occasionally
    if (gameState.frameCount % 60 === 30) {
      gameState.player.strafeLeft();
    }
  } else if (testMode === "TEST_2") {
    // Win test - rush to goal quickly
    gameState.player.moveForward();
    gameState.player.isSprinting = true;
    
    // Jump continuously
    if (gameState.player.onGround && gameState.frameCount % 30 === 0) {
      gameState.player.jump();
    }
    
    // Use card abilities
    if (gameState.frameCount % 60 === 0) {
      gameState.player.useCardAbility();
    }
    
    // Shoot enemies
    if (gameState.frameCount % 45 === 0 && gameState.enemies.length > 0) {
      gameState.player.shoot();
    }
  }
}