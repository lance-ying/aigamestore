// input.js - Input handling

import { gameState, MAX_POWER, POWER_CHARGE_RATE } from './globals.js';
import { initializeCourse } from './course.js';

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
        gameState.gamePhase === "PLAYING") {
      resetGame(p);
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
  
  // Handle automated testing
  if (gameState.controlMode !== "HUMAN") {
    handleAutomatedInput(p);
    return;
  }
  
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

function handleAutomatedInput(p) {
  if (typeof window.get_automated_testing_action === 'function') {
    const action = window.get_automated_testing_action(gameState);
    if (action && action.keyCode) {
      // Simulate key press
      keys[action.keyCode] = true;
      
      // Handle the action
      if (action.keyCode === 32 && !gameState.isCharging && gameState.canShoot) {
        gameState.isCharging = true;
        gameState.power = 0;
      }
      
      // Release after a frame
      setTimeout(() => {
        keys[action.keyCode] = false;
        if (action.keyCode === 32 && gameState.isCharging && gameState.ball && gameState.canShoot) {
          gameState.ball.shoot(gameState.aimAngle, gameState.power);
          gameState.isCharging = false;
          gameState.power = 0;
        }
      }, 100);
    }
  }
}

export function isKeyPressed(keyCode) {
  return keys[keyCode] === true;
}

export function resetGame(p) {
  // Clear entities
  gameState.entities = [];
  gameState.walls = [];
  gameState.holes = [];
  gameState.waterHazards = [];
  gameState.ramps = [];
  gameState.particles = [];
  
  // Reset game state
  gameState.currentHole = 0;
  gameState.strokes = 0;
  gameState.holeStrokes = [];
  gameState.score = 0;
  gameState.isAiming = true;
  gameState.canShoot = true;
  gameState.isCharging = false;
  gameState.power = 0;
  gameState.aimAngle = 0;
  
  // Reinitialize course
  initializeCourse(p);
  
  // Change to start screen
  gameState.gamePhase = "START";
  
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { gamePhase: "START", action: "restart" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}