// testing.js - Automated testing controllers

import { gameState, GAME_PHASES } from './globals.js';

export function getTestAction(p) {
  if (gameState.controlMode === "TEST_1") {
    return getBasicTestAction(p);
  } else if (gameState.controlMode === "TEST_2") {
    return getWinTestAction(p);
  }
  return null;
}

function getBasicTestAction(p) {
  // Basic movement test - move in a pattern
  if (gameState.gamePhase === GAME_PHASES.START) {
    return { keyCode: 13 }; // ENTER to start
  }

  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (p.frameCount % 30 === 0) {
      const directions = [37, 38, 39, 40]; // LEFT, UP, RIGHT, DOWN
      return { keyCode: directions[Math.floor(p.frameCount / 30) % 4] };
    }
  }

  if (gameState.gamePhase === GAME_PHASES.UPGRADE_SELECTION) {
    if (p.frameCount % 20 === 0) {
      return { keyCode: 32 }; // SPACE to select
    }
  }

  if (gameState.gamePhase === GAME_PHASES.LEVEL_TRANSITION) {
    // Wait for transition to complete
    return null;
  }

  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE || 
      gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    if (p.frameCount % 60 === 0) {
      return { keyCode: 82 }; // R to restart
    }
  }

  return null;
}

function getWinTestAction(p) {
  // Aggressive test to try to win
  if (gameState.gamePhase === GAME_PHASES.START) {
    return { keyCode: 13 }; // ENTER to start
  }

  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Always choose the attack upgrade
    if (!gameState.player) return null;

    // Move towards nearest enemy or stay still to attack
    if (gameState.enemies.length > 0 && p.frameCount % 15 === 0) {
      const nearestEnemy = gameState.enemies.find(e => e.isAlive());
      if (nearestEnemy) {
        const dx = nearestEnemy.gridX - gameState.player.gridX;
        const dy = nearestEnemy.gridY - gameState.player.gridY;
        
        // Get in range but not too close
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
          // Move closer
          if (Math.abs(dx) > Math.abs(dy)) {
            return { keyCode: dx > 0 ? 39 : 37 }; // RIGHT or LEFT
          } else {
            return { keyCode: dy > 0 ? 40 : 38 }; // DOWN or UP
          }
        }
        // In range, stay still to attack (no action needed)
      }
    }
  }

  if (gameState.gamePhase === GAME_PHASES.UPGRADE_SELECTION) {
    // Always select first upgrade (attack usually)
    gameState.selectedUpgradeIndex = 0;
    if (p.frameCount % 10 === 0) {
      return { keyCode: 32 }; // SPACE to select
    }
  }

  if (gameState.gamePhase === GAME_PHASES.LEVEL_TRANSITION) {
    return null;
  }

  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (p.frameCount % 60 === 0) {
      return { keyCode: 82 }; // R to restart
    }
  }

  return null;
}

export function applyTestAction(action, p) {
  if (!action) return;

  // Simulate key press
  p.keyCode = action.keyCode;
  p.key = String.fromCharCode(action.keyCode);

  // Log the test input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode, source: "TEST" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}