import { gameState, logInput, logGameInfo } from './globals.js';
import { rotateCameraHorizontal, rotateCameraVertical } from './camera.js';
import { resetGame } from './game.js';

// Initialize input handlers
export function initInput() {
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
}

// Handle key down
function handleKeyDown(event) {
  const keyCode = event.keyCode;
  const key = event.key;
  
  logInput('keydown', key, keyCode);
  
  gameState.keys[keyCode] = true;
  
  // Phase controls
  if (keyCode === 13 && gameState.gamePhase === "START") { // ENTER
    gameState.gamePhase = "PLAYING";
    logGameInfo("PLAYING", {});
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      logGameInfo("PAUSED", {});
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      logGameInfo("PLAYING", {});
    }
  }
  
  if (keyCode === 82) { // R - Restart
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE" ||
        gameState.gamePhase === "PAUSED") {
      resetGame();
      gameState.gamePhase = "START";
      logGameInfo("START", {});
    }
  }
}

// Handle key up
function handleKeyUp(event) {
  const keyCode = event.keyCode;
  const key = event.key;
  
  logInput('keyup', key, keyCode);
  
  gameState.keys[keyCode] = false;
}

// Process player input
export function processPlayerInput() {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;
  
  // Movement (WASD)
  const movement = { x: 0, z: 0 };
  
  if (gameState.keys[87] || gameState.keys[38]) { // W or Up Arrow
    movement.z = 1;
  }
  if (gameState.keys[83] || gameState.keys[40]) { // S or Down Arrow
    movement.z = -1;
  }
  if (gameState.keys[65]) { // A
    movement.x = -1;
  }
  if (gameState.keys[68]) { // D
    movement.x = 1;
  }
  
  if (movement.x !== 0 || movement.z !== 0) {
    gameState.player.move(movement);
  }
  
  // Jump (Space)
  if (gameState.keys[32]) {
    gameState.player.jump();
  }
  
  // Dash (Shift)
  if (gameState.keys[16]) {
    gameState.player.dash();
  }
  
  // Shoot (Z)
  if (gameState.keys[90]) {
    gameState.player.shoot();
  }
  
  // Camera rotation (Arrow keys)
  if (gameState.keys[37]) { // Left Arrow
    rotateCameraHorizontal(-1);
  }
  if (gameState.keys[39]) { // Right Arrow
    rotateCameraHorizontal(1);
  }
  if (gameState.keys[38] && !gameState.keys[87]) { // Up Arrow (only if not W)
    rotateCameraVertical(1);
  }
  if (gameState.keys[40] && !gameState.keys[83]) { // Down Arrow (only if not S)
    rotateCameraVertical(-1);
  }
}

// AI control for testing
export function processAIInput() {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;
  
  switch (gameState.controlMode) {
    case "TEST_1":
      testMode1();
      break;
    case "TEST_2":
      testMode2();
      break;
  }
}

// Test mode 1: Basic movement and shooting
function testMode1() {
  const time = (performance.now() - gameState.testStartTime) / 1000;
  
  // Circular movement
  const angle = time * 0.5;
  const movement = {
    x: Math.cos(angle),
    z: Math.sin(angle)
  };
  
  gameState.player.move(movement);
  
  // Periodic jump
  if (Math.floor(time) % 3 === 0 && time % 1 < 0.1) {
    gameState.player.jump();
  }
  
  // Periodic dash
  if (Math.floor(time) % 4 === 0 && time % 1 < 0.1) {
    gameState.player.dash();
  }
  
  // Shoot if enemies nearby
  if (gameState.enemies.length > 0) {
    const nearestEnemy = findNearestEnemy();
    if (nearestEnemy) {
      aimAtTarget(nearestEnemy.mesh.position);
      gameState.player.shoot();
    }
  }
}

// Test mode 2: Aggressive combat
function testMode2() {
  if (gameState.enemies.length === 0) return;
  
  const nearestEnemy = findNearestEnemy();
  if (!nearestEnemy) return;
  
  // Move toward enemy
  const direction = new THREE.Vector3()
    .subVectors(nearestEnemy.mesh.position, gameState.player.mesh.position)
    .normalize();
  
  gameState.player.move({ x: direction.x, z: direction.z });
  
  // Aim at enemy
  aimAtTarget(nearestEnemy.mesh.position);
  
  // Shoot constantly
  gameState.player.shoot();
  
  // Dash toward enemy if cooldown ready
  if (gameState.player.dashCooldown <= 0) {
    gameState.player.dash();
  }
}

// Find nearest enemy
function findNearestEnemy() {
  if (!gameState.player || gameState.enemies.length === 0) return null;
  
  let nearest = null;
  let minDistance = Infinity;
  
  for (const enemy of gameState.enemies) {
    const distance = gameState.player.mesh.position.distanceTo(enemy.mesh.position);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = enemy;
    }
  }
  
  return nearest;
}

// Aim camera at target
function aimAtTarget(targetPos) {
  const direction = new THREE.Vector3()
    .subVectors(targetPos, gameState.player.mesh.position);
  
  const horizontalAngle = Math.atan2(direction.x, direction.z);
  const horizontalDistance = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
  const verticalAngle = Math.atan2(direction.y, horizontalDistance);
  
  gameState.cameraAngleX = horizontalAngle;
  gameState.cameraAngleY = verticalAngle;
}