// input.js - Input handling
import { gameState, GAME_PHASES } from './globals.js';
import { startGame, restartGame, togglePause } from './gameLogic.js';

export function setupInput(p) {
  p.keyPressed = function() {
    const key = p.key.toLowerCase();
    const keyCode = p.keyCode;

    // Log input
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Control mode override for testing
    if (gameState.controlMode !== 'HUMAN') {
      return;
    }

    // Phase-specific controls
    if (gameState.gamePhase === GAME_PHASES.START) {
      if (keyCode === 13) { // ENTER
        startGame();
      }
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (keyCode === 27) { // ESC
        togglePause();
      } else if (keyCode === 82) { // R
        restartGame();
      } else if (gameState.shotPhase === 'AIMING') {
        handleAimingInput(keyCode, key);
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      if (keyCode === 27) { // ESC
        togglePause();
      } else if (keyCode === 82) { // R
        restartGame();
      }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      if (keyCode === 82) { // R
        restartGame();
      }
    }
  };
}

function handleAimingInput(keyCode, key) {
  // Arrow keys for aim and power
  if (keyCode === 37) { // LEFT
    gameState.aimAngle -= 0.05;
  } else if (keyCode === 39) { // RIGHT
    gameState.aimAngle += 0.05;
  } else if (keyCode === 38) { // UP
    gameState.shotPower = Math.min(100, gameState.shotPower + 5);
  } else if (keyCode === 40) { // DOWN
    gameState.shotPower = Math.max(10, gameState.shotPower - 5);
  }
  // Z for left curve
  else if (key === 'z' || keyCode === 90) {
    gameState.shotCurveDirection = gameState.shotCurveDirection === 'LEFT' ? 'NONE' : 'LEFT';
  }
  // Shift for right curve
  else if (keyCode === 16) {
    gameState.shotCurveDirection = gameState.shotCurveDirection === 'RIGHT' ? 'NONE' : 'RIGHT';
  }
  // Space to shoot
  else if (keyCode === 32) {
    takeShot();
  }
}

function takeShot() {
  if (gameState.player && gameState.shotPhase === 'AIMING') {
    gameState.player.shoot(gameState.aimAngle, gameState.shotPower, gameState.shotCurveDirection);
    gameState.isShotTaken = true;
    gameState.shotPhase = 'FLYING';
    gameState.defenderCollisions = 0;
  }
}

export function getTestingAction(p) {
  // Testing mode actions
  if (gameState.controlMode === 'TEST_1') {
    return getBasicTestAction(p);
  } else if (gameState.controlMode === 'TEST_2') {
    return getWinTestAction(p);
  }
  return null;
}

function getBasicTestAction(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount % 60 === 30) {
      return { action: 'START' };
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.shotPhase === 'AIMING') {
    if (p.frameCount % 120 === 60) {
      return { action: 'SHOOT', angle: -Math.PI / 2, power: 70, curve: 'NONE' };
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (p.frameCount % 120 === 90) {
      return { action: 'RESTART' };
    }
  }
  return null;
}

function getWinTestAction(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (p.frameCount % 60 === 30) {
      return { action: 'START' };
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.shotPhase === 'AIMING') {
    const level = gameState.currentLevel;
    if (p.frameCount % 120 === 60) {
      let angle = -Math.PI / 2;
      let power = 80;
      let curve = 'NONE';
      
      if (level === 1) {
        angle = -Math.PI / 2 + 0.1;
        power = 75;
      } else if (level === 2) {
        angle = -Math.PI / 2;
        power = 85;
      } else if (level === 3) {
        angle = -Math.PI / 2 - 0.15;
        power = 90;
        curve = 'LEFT';
      } else if (level === 4) {
        angle = -Math.PI / 2 + 0.3;
        power = 95;
        curve = 'RIGHT';
      } else if (level === 5) {
        angle = -Math.PI / 2 - 0.2;
        power = 100;
        curve = 'LEFT';
      }
      
      return { action: 'SHOOT', angle, power, curve };
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (p.frameCount % 120 === 90) {
      return { action: 'RESTART' };
    }
  }
  return null;
}

export function executeTestAction(action) {
  if (!action) return;

  if (action.action === 'START') {
    startGame();
  } else if (action.action === 'SHOOT') {
    gameState.aimAngle = action.angle;
    gameState.shotPower = action.power;
    gameState.shotCurveDirection = action.curve;
    takeShot();
  } else if (action.action === 'RESTART') {
    restartGame();
  }
}