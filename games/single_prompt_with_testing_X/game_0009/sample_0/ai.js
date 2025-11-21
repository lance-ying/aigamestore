// ai.js - Automated testing AI

import { gameState } from './globals.js';

export function updateAI(p) {
  if (gameState.controlMode === 'HUMAN') return;
  
  if (gameState.controlMode === 'TEST_1') {
    runTest1(p);
  } else if (gameState.controlMode === 'TEST_2') {
    runTest2(p);
  } else if (gameState.controlMode === 'TEST_3') {
    runTest3(p);
  } else if (gameState.controlMode === 'TEST_4') {
    runTest4(p);
  } else if (gameState.controlMode === 'TEST_5') {
    runTest5(p);
  } else if (gameState.controlMode === 'TEST_6') {
    runTest6(p);
  } else if (gameState.controlMode === 'TEST_7') {
    runTest7(p);
  }
}

function runTest1(p) {
  // TEST_1: Basic movement - hold for 2s, release for 1s
  gameState.testState.timer++;
  
  const cycle = gameState.testState.timer % 180; // 3 second cycle at 60fps
  
  if (cycle < 120) { // Hold for 2 seconds
    gameState.keys.space = true;
  } else { // Release for 1 second
    gameState.keys.space = false;
  }
}

function runTest2(p) {
  // TEST_2: Wait for gap and cross safely
  gameState.testState.timer++;
  
  if (!gameState.player) return;
  
  // Check if there's a safe gap
  const playerY = gameState.player.body.position.y;
  const safeDistance = 150;
  
  let isSafe = true;
  for (let vehicle of gameState.traffic) {
    const distance = Math.abs(vehicle.body.position.x - 300); // Center of screen
    if (distance < safeDistance) {
      isSafe = false;
      break;
    }
  }
  
  // If in intersection, keep going
  if (playerY < gameState.intersectionBounds.end + 60) {
    gameState.keys.space = true;
  } else if (isSafe || gameState.testState.timer % 300 > 240) {
    // Go if safe or force go after waiting
    gameState.keys.space = true;
  } else {
    gameState.keys.space = false;
  }
}

function runTest3(p) {
  // TEST_3: Intentional collision - drive immediately
  gameState.keys.space = true;
}

function runTest4(p) {
  // TEST_4: Test pause functionality
  gameState.testState.timer++;
  
  if (gameState.testState.timer === 180) { // After 3 seconds, pause
    simulateKeyPress(p, 27); // ESC
  } else if (gameState.testState.timer === 300) { // After 2 more seconds, unpause
    simulateKeyPress(p, 27); // ESC
  }
  
  // Otherwise, move forward
  if (gameState.testState.timer < 180 || gameState.testState.timer > 300) {
    gameState.keys.space = true;
  }
}

function runTest5(p) {
  // TEST_5: Complete multiple levels with safe crossing
  runTest2(p); // Use same safe crossing logic
}

function runTest6(p) {
  // TEST_6: Stop-and-go pattern
  gameState.testState.timer++;
  
  const cycle = gameState.testState.timer % 120; // 2 second cycle
  
  if (cycle < 30) { // Brief acceleration
    gameState.keys.space = true;
  } else { // Stop
    gameState.keys.space = false;
  }
}

function runTest7(p) {
  // TEST_7: Test restart after collision
  gameState.testState.timer++;
  
  if (gameState.gamePhase === 'PLAYING') {
    // Collide intentionally
    gameState.keys.space = true;
  } else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
    if (gameState.testState.timer % 60 === 0) {
      simulateKeyPress(p, 82); // R to restart
    }
  } else if (gameState.gamePhase === 'START') {
    if (gameState.testState.timer % 60 === 0) {
      simulateKeyPress(p, 13); // ENTER to start
    }
  }
}

function simulateKeyPress(p, keyCode) {
  const event = { keyCode };
  p.keyPressed(event);
}