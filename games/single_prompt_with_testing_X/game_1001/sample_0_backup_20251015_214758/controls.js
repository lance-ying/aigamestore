// controls.js - Input handling and automated testing

import { gameState, CONTAINER_X, FRUIT_TYPES } from './globals.js';

const keys = {};

export function setupControls(p) {
  // Track key states
  p.keyPressed = function() {
    keys[p.keyCode] = true;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase-specific controls
    handlePhaseControls(p);
    
    return false;
  };
  
  p.keyReleased = function() {
    keys[p.keyCode] = false;
    
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return false;
  };
}

function handlePhaseControls(p) {
  // ENTER - Start game
  if (p.keyCode === 13 && gameState.gamePhase === "START") {
    gameState.gamePhase = "PLAYING";
    p.logs.game_info.push({
      data: { gamePhase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // ESC - Pause/Unpause
  if (p.keyCode === 27) {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { gamePhase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // R - Restart
  if (p.keyCode === 82) {
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE") {
      // Will be handled by resetGame in game.js
      gameState.shouldReset = true;
    }
  }
  
  // Gameplay controls (SPACE to drop)
  if (gameState.gamePhase === "PLAYING") {
    if ((p.keyCode === 32 || p.keyCode === 40 || p.keyCode === 83) && gameState.canDrop) {
      gameState.shouldDrop = true;
    }
  }
}

export function updateControls(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  if (!gameState.currentFruit || !gameState.canDrop) return;
  
  // Movement speed
  const moveSpeed = 3;
  
  // Left movement (LEFT ARROW or A)
  if (keys[37] || keys[65]) {
    gameState.currentFruit.update(-moveSpeed);
    gameState.previewX = gameState.currentFruit.x;
  }
  
  // Right movement (RIGHT ARROW or D)
  if (keys[39] || keys[68]) {
    gameState.currentFruit.update(moveSpeed);
    gameState.previewX = gameState.currentFruit.x;
  }
}

// Automated testing
export function updateTestMode(p) {
  if (gameState.controlMode === "HUMAN") return;
  
  const test = gameState.testState;
  test.timer++;
  
  if (gameState.controlMode === "TEST_1") {
    runTest1(p, test);
  } else if (gameState.controlMode === "TEST_2") {
    runTest2(p, test);
  }
}

function runTest1(p, test) {
  // Basic testing: drop fruits in pattern to test merging
  if (gameState.gamePhase === "START") {
    if (test.timer > 60) {
      simulateKey(p, 13); // ENTER
      test.timer = 0;
      test.phase = 1;
    }
  } else if (gameState.gamePhase === "PLAYING") {
    if (test.phase === 1) {
      // Drop sequence to test basic merges
      const dropSequence = [
        { x: -50, wait: 120 },
        { x: -30, wait: 120 },
        { x: 0, wait: 120 },
        { x: 20, wait: 120 },
        { x: 50, wait: 120 },
        { x: -60, wait: 120 },
        { x: 40, wait: 120 },
        { x: -20, wait: 120 }
      ];
      
      if (test.timer > dropSequence[Math.min(test.phase - 1, dropSequence.length - 1)].wait) {
        const target = dropSequence[Math.min(test.phase - 1, dropSequence.length - 1)];
        moveToPositionAndDrop(p, CONTAINER_X + target.x);
        test.phase++;
        test.timer = 0;
      }
    }
  }
}

function runTest2(p, test) {
  // Win test: systematically create watermelon
  if (gameState.gamePhase === "START") {
    if (test.timer > 60) {
      simulateKey(p, 13); // ENTER
      test.timer = 0;
      test.phase = 1;
    }
  } else if (gameState.gamePhase === "PLAYING") {
    // Strategic dropping to create merges up to watermelon
    if (gameState.canDrop && test.timer > 90) {
      const positions = [-80, -40, 0, 40, 80];
      const targetX = CONTAINER_X + positions[test.phase % positions.length];
      moveToPositionAndDrop(p, targetX);
      test.phase++;
      test.timer = 0;
    }
  }
}

function moveToPositionAndDrop(p, targetX) {
  if (!gameState.currentFruit) return;
  
  // Move preview to target
  const currentX = gameState.currentFruit.x;
  const diff = targetX - currentX;
  
  if (Math.abs(diff) > 5) {
    gameState.currentFruit.x = targetX;
    gameState.previewX = targetX;
  }
  
  // Drop
  gameState.shouldDrop = true;
}

function simulateKey(p, keyCode) {
  p.keyCode = keyCode;
  p.keyPressed();
}

export { keys };