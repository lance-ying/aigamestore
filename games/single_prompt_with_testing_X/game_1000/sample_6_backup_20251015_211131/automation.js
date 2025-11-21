// automation.js - Test automation logic

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Body } = Matter;

import { gameState, CONTROL_MODES } from './globals.js';

export function updateTestAutomation(p) {
  if (gameState.controlMode === CONTROL_MODES.HUMAN) return;
  
  gameState.testFrameCount++;
  
  switch (gameState.controlMode) {
    case CONTROL_MODES.TEST_1:
      runTest1(p);
      break;
    case CONTROL_MODES.TEST_2:
      runTest2(p);
      break;
    case CONTROL_MODES.TEST_3:
      runTest3(p);
      break;
    case CONTROL_MODES.TEST_4:
      runTest4(p);
      break;
    case CONTROL_MODES.TEST_5:
      runTest5(p);
      break;
    case CONTROL_MODES.TEST_6:
      runTest6(p);
      break;
    case CONTROL_MODES.TEST_7:
      runTest7(p);
      break;
  }
}

function runTest1(p) {
  // TEST_1: Basic launch mechanics
  if (gameState.testFrameCount === 30) {
    gameState.slingshotAngle = -45;
    gameState.slingshotPower = 50;
  }
  
  if (gameState.testFrameCount === 60 && gameState.isAiming) {
    simulateKeyPress(p, 32); // SPACE to launch
  }
}

function runTest2(p) {
  // TEST_2: Win condition - systematic destruction
  if (gameState.testState === "init") {
    gameState.testState = "aiming";
    gameState.testWaitFrames = 0;
  }
  
  if (gameState.testState === "aiming") {
    if (gameState.testFrameCount < 30) {
      // Aim at optimal angle for destruction
      gameState.slingshotAngle = -35;
      gameState.slingshotPower = 70;
    } else if (gameState.testFrameCount === 30) {
      simulateKeyPress(p, 32); // Launch
      gameState.testState = "waiting_for_ability";
    }
  }
  
  if (gameState.testState === "waiting_for_ability") {
    if (gameState.birdInFlight && gameState.testFrameCount > 50 && !gameState.abilityUsed) {
      simulateKeyPress(p, 32); // Activate ability
      gameState.testState = "watching";
    }
  }
  
  if (gameState.testState === "watching") {
    gameState.testWaitFrames++;
    if (!gameState.birdInFlight && gameState.testWaitFrames > 60) {
      if (gameState.birdsRemaining > 0 && gameState.pigs.some(p => p.alive)) {
        gameState.testState = "aiming";
        gameState.testFrameCount = 0;
        gameState.testWaitFrames = 0;
      }
    }
  }
}

function runTest3(p) {
  // TEST_3: Test special abilities
  if (gameState.testFrameCount === 30) {
    gameState.slingshotAngle = -40;
    gameState.slingshotPower = 60;
  }
  
  if (gameState.testFrameCount === 60 && gameState.isAiming) {
    simulateKeyPress(p, 32); // Launch
  }
  
  if (gameState.birdInFlight && gameState.testFrameCount > 80 && !gameState.abilityUsed) {
    simulateKeyPress(p, 32); // Activate ability mid-flight
  }
}

function runTest4(p) {
  // TEST_4: Test spell system
  if (gameState.testFrameCount === 60) {
    if (gameState.gems >= 10) {
      simulateKeyPress(p, 90); // Z to use spell
    }
  }
  
  if (gameState.testFrameCount === 120 && gameState.isAiming) {
    gameState.slingshotAngle = -45;
    gameState.slingshotPower = 55;
    simulateKeyPress(p, 32); // Launch
  }
}

function runTest5(p) {
  // TEST_5: Test lose condition - waste birds
  if (gameState.testState === "init") {
    gameState.testState = "wasting";
    gameState.testWaitFrames = 0;
  }
  
  if (gameState.testState === "wasting") {
    if (gameState.testFrameCount % 180 === 30 && gameState.isAiming) {
      // Aim poorly (straight up)
      gameState.slingshotAngle = -85;
      gameState.slingshotPower = 30;
    }
    
    if (gameState.testFrameCount % 180 === 60 && gameState.isAiming) {
      simulateKeyPress(p, 32); // Launch poorly
    }
  }
}

function runTest6(p) {
  // TEST_6: Test structure destruction
  if (gameState.testFrameCount === 30) {
    gameState.slingshotAngle = -30;
    gameState.slingshotPower = 75; // High power
  }
  
  if (gameState.testFrameCount === 60 && gameState.isAiming) {
    simulateKeyPress(p, 32); // Launch with force
  }
}

function runTest7(p) {
  // TEST_7: Test pause functionality
  if (gameState.testFrameCount === 30) {
    gameState.slingshotAngle = -45;
    gameState.slingshotPower = 60;
  }
  
  if (gameState.testFrameCount === 60 && gameState.isAiming) {
    simulateKeyPress(p, 32); // Launch
  }
  
  if (gameState.testFrameCount === 90 && gameState.birdInFlight) {
    simulateKeyPress(p, 27); // Pause (ESC)
  }
  
  if (gameState.testFrameCount === 150) {
    simulateKeyPress(p, 27); // Unpause (ESC)
  }
}

function simulateKeyPress(p, keyCode) {
  p.keyCode = keyCode;
  if (keyCode === 32) p.key = ' ';
  else if (keyCode === 27) p.key = 'Escape';
  else if (keyCode === 90) p.key = 'z';
  else if (keyCode === 37) p.key = 'ArrowLeft';
  else if (keyCode === 39) p.key = 'ArrowRight';
  else if (keyCode === 38) p.key = 'ArrowUp';
  else if (keyCode === 40) p.key = 'ArrowDown';
  
  p.keyPressed();
}