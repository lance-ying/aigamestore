// testController.js - Automated testing controllers

import { gameState, GAME_PHASES } from './globals.js';

export function updateTestController(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  // Handle different test modes
  if (gameState.controlMode === "TEST_1") {
    testBasicMovement(p);
  } else if (gameState.controlMode === "TEST_2") {
    testWinPath(p);
  }
}

function testBasicMovement(p) {
  // Basic movement test - move around randomly
  if (gameState.gamePhase === GAME_PHASES.START) {
    // Auto-start after a few frames
    if (gameState.framesSincePhaseChange > 60) {
      simulateKeyPress(p, 13); // ENTER
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Random movement
    if (p.frameCount % 20 === 0) {
      const rand = p.random();
      if (rand < 0.4) {
        simulateKey(p, 37); // LEFT
      } else if (rand < 0.8) {
        simulateKey(p, 39); // RIGHT
      }
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER || 
             gameState.gamePhase === GAME_PHASES.WIN_LEVEL) {
    if (gameState.framesSincePhaseChange > 120) {
      simulateKeyPress(p, 82); // R to restart
    }
  }
}

function testWinPath(p) {
  // Optimized path to win
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.framesSincePhaseChange > 30) {
      simulateKeyPress(p, 13); // ENTER
    }
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // Smart movement toward valuable blocks
    if (gameState.player && gameState.entities.length > 0) {
      const player = gameState.player;
      
      // Find closest absorbable block
      let closestBlock = null;
      let minDist = Infinity;
      
      for (let entity of gameState.entities) {
        if (entity.constructor.name === 'NumberBlock' && 
            entity.alive && 
            entity.value <= player.value &&
            entity.y > 0 && entity.y < 500) {
          const dist = Math.abs(entity.x - player.x) + Math.abs(entity.y - player.y);
          if (dist < minDist) {
            minDist = dist;
            closestBlock = entity;
          }
        }
      }
      
      if (closestBlock) {
        const diff = closestBlock.x - player.x;
        if (Math.abs(diff) > 10) {
          if (diff < 0) {
            simulateKey(p, 37); // LEFT
          } else {
            simulateKey(p, 39); // RIGHT
          }
        }
      } else {
        // No safe blocks, try to move to center
        const centerX = 300;
        const diff = centerX - player.x;
        if (Math.abs(diff) > 20) {
          if (diff < 0) {
            simulateKey(p, 37); // LEFT
          } else {
            simulateKey(p, 39); // RIGHT
          }
        }
      }
    }
  } else if (gameState.gamePhase === GAME_PHASES.WIN_LEVEL) {
    if (gameState.framesSincePhaseChange > 90) {
      simulateKeyPress(p, 32); // SPACE for next level
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER) {
    if (gameState.framesSincePhaseChange > 120) {
      simulateKeyPress(p, 82); // R to restart
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_WIN) {
    if (gameState.framesSincePhaseChange > 120) {
      simulateKeyPress(p, 82); // R to restart
    }
  }
}

function simulateKey(p, keyCode) {
  // Simulate holding a key
  p._keyIsDown = p._keyIsDown || {};
  p._keyIsDown[keyCode] = true;
}

function simulateKeyPress(p, keyCode) {
  // Simulate a key press event
  p.keyCode = keyCode;
  p.key = String.fromCharCode(keyCode);
  if (p._onKeyPressed) {
    p._onKeyPressed();
  }
}