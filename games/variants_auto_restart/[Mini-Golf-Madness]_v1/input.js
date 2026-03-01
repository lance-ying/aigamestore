// input.js - Input handling

import { gameState, MAX_POWER, POWER_CHARGE_RATE } from './globals.js';
// Removed: import { initializeCourse } } from './course.js'; // initializeCourse is no longer needed here
// New: Access gameInstance via window object as it's globally exposed
// import { gameInstance } from './game.js'; // If gameInstance was exported

const keys = {};

export function setupInput(p) {
  p.keyPressed = function() {
    keys[p.keyCode] = true;
    
    // Log input
    if (p.logs && p.logs.inputs) {
      p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Handle phase controls
    handlePhaseControls(p);
  };
  
  p.keyReleased = function() {
    keys[p.keyCode] = false;
    
    // Log input
    if (p.logs && p.logs.inputs) {
      p.logs.inputs.push({
        input_type: 'keyReleased',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Handle shooting on space release
    if (p.keyCode === 32 && gameState.gamePhase === "PLAYING") {
      if (gameState.isCharging && gameState.ball && gameState.canShoot) {
        gameState.ball.shoot(gameState.aimAngle, gameState.power);
        gameState.isCharging = false;
        gameState.power = 0;
      }
    }
  };
}

function handlePhaseControls(p) {
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
  
  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
    }
  }
  
  if (p.keyCode === 82) { // R - Restart
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE" ||
        gameState.gamePhase === "PLAYING" ||
        gameState.gamePhase === "PAUSED") { // Allow restart from paused screen too
      // New: Call the resetGame method on the globally exposed gameInstance
      window.gameInstance.resetGame();
    }
  }
  
  if (p.keyCode === 90) { // Z - Quick restart hole
    if (gameState.gamePhase === "PLAYING" && gameState.ball) {
      gameState.ball.resetToStart();
      gameState.strokes = 0;
    }
  }
}

export function handleGameplayInput(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  // Human controls
  if (gameState.isAiming && gameState.ball && !gameState.ball.isMoving()) {
    // Arrow keys for aiming
    if (isKeyPressed(37)) { // Left
      gameState.aimAngle -= 0.05;
    }
    if (isKeyPressed(39)) { // Right
      gameState.aimAngle += 0.05;
    }
    
    // Space for power charging
    if (isKeyPressed(32)) { // Space
      if (!gameState.isCharging) {
        gameState.isCharging = true;
        gameState.power = 0;
      }
      
      gameState.power += POWER_CHARGE_RATE;
      if (gameState.power > MAX_POWER) {
        gameState.power = MAX_POWER;
      }
    }
  }
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

// Removed: resetGame function moved to game.js