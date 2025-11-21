import { gameState } from './globals.js';

const keys = {};

export function handleKeyPressed(p) {
  keys[p.keyCode] = true;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase controls
  if (p.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
    gameState.gamePhase = "PLAYING";
    gameState.raceStartTime = Date.now();
    p.logs.game_info.push({
      data: { gamePhase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
    }
  }
  
  if (p.keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE") {
      return true; // Signal to reset
    }
  }
  
  // Boost
  if (p.keyCode === 32 && gameState.gamePhase === "PLAYING") { // SPACE
    if (gameState.player) {
      gameState.player.activateBoost();
    }
  }
  
  return false;
}

export function handleKeyReleased(p) {
  keys[p.keyCode] = false;
  
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processPlayerInput() {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;
  
  const player = gameState.player;
  
  // Acceleration (Up/W)
  if (keys[38] || keys[87]) {
    player.accelerate();
  }
  
  // Brake (Down/S)
  if (keys[40] || keys[83]) {
    player.brake();
  }
  
  // Turn left (Left/A)
  if (keys[37] || keys[65]) {
    player.turnLeft();
  }
  
  // Turn right (Right/D)
  if (keys[39] || keys[68]) {
    player.turnRight();
  }
}

export function processAutomatedInput(p) {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;
  
  const player = gameState.player;
  
  if (gameState.controlMode === "TEST_1") {
    // Basic testing - moderate acceleration and steering
    if (p.frameCount % 2 === 0) {
      player.accelerate();
    }
    
    // Steer toward next checkpoint
    const targetCP = gameState.checkpoints[player.currentCheckpoint];
    if (targetCP) {
      const dx = targetCP.x - player.body.position.x;
      const dy = targetCP.y - player.body.position.y;
      const targetAngle = Math.atan2(dy, dx);
      const angleDiff = player.normalizeAngle(targetAngle - player.body.angle);
      
      if (Math.abs(angleDiff) > 0.2) {
        if (angleDiff > 0) {
          player.turnRight();
        } else {
          player.turnLeft();
        }
      }
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Aggressive racing to win
    player.accelerate();
    
    // Use boost on straights
    if (p.frameCount % 300 === 0 && gameState.boostCharges > 0) {
      player.activateBoost();
    }
    
    // Optimal steering
    const targetCP = gameState.checkpoints[player.currentCheckpoint];
    if (targetCP) {
      const dx = targetCP.x - player.body.position.x;
      const dy = targetCP.y - player.body.position.y;
      const targetAngle = Math.atan2(dy, dx);
      const angleDiff = player.normalizeAngle(targetAngle - player.body.angle);
      
      if (Math.abs(angleDiff) > 0.15) {
        if (angleDiff > 0) {
          player.turnRight();
        } else {
          player.turnLeft();
        }
      }
      
      // Brake on sharp turns
      if (Math.abs(angleDiff) > 1.0) {
        player.brake();
      }
    }
  }
}

export { keys };