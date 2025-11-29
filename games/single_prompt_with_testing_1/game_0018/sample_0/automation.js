// automation.js - Automated testing functions
import { gameState, CONTROL_MODES, GAME_PHASES } from './globals.js';

export function updateAutomation() {
  if (gameState.controlMode === CONTROL_MODES.HUMAN) return;
  
  gameState.testFrameCount++;
  
  switch (gameState.controlMode) {
    case CONTROL_MODES.TEST_1:
      runTest1();
      break;
    case CONTROL_MODES.TEST_2:
      runTest2();
      break;
    case CONTROL_MODES.TEST_3:
      runTest3();
      break;
    case CONTROL_MODES.TEST_4:
      runTest4();
      break;
    case CONTROL_MODES.TEST_5:
      runTest5();
      break;
    case CONTROL_MODES.TEST_6:
      runTest6();
      break;
    case CONTROL_MODES.TEST_7:
      runTest7();
      break;
  }
}

function simulateKeyPress(keyCode) {
  gameState.keys[keyCode] = true;
  setTimeout(() => {
    gameState.keys[keyCode] = false;
  }, 100);
}

// TEST_1: Basic flight controls test
function runTest1() {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.testFrameCount === 60) {
      gameState.keys[13] = true; // Enter
      setTimeout(() => gameState.keys[13] = false, 100);
    }
    return;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const frame = gameState.testFrameCount;
  
  // Reset all inputs first
  Object.keys(gameState.keys).forEach(key => gameState.keys[key] = false);
  
  // Test pitch control
  if (frame > 120 && frame < 180) {
    gameState.keys[87] = true; // W - pitch up
  } else if (frame > 180 && frame < 240) {
    gameState.keys[83] = true; // S - pitch down
  }
  
  // Test roll control
  if (frame > 240 && frame < 300) {
    gameState.keys[65] = true; // A - roll left
  } else if (frame > 300 && frame < 360) {
    gameState.keys[68] = true; // D - roll right
  }
  
  // Test rudder
  if (frame > 360 && frame < 420) {
    gameState.keys[37] = true; // Left arrow
  } else if (frame > 420 && frame < 480) {
    gameState.keys[39] = true; // Right arrow
  }
  
  // Test throttle
  if (frame > 480 && frame < 540) {
    gameState.keys[38] = true; // Up arrow
  } else if (frame > 540 && frame < 600) {
    gameState.keys[40] = true; // Down arrow
  }
}

// TEST_2: Successful landing test
function runTest2() {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.testFrameCount === 60) {
      simulateKeyPress(13); // Enter
    }
    return;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const frame = gameState.testFrameCount;
  
  // Deploy gear early
  if (frame === 120) {
    simulateKeyPress(32); // Space
  }
  
  // Deploy flaps
  if (frame === 150 || frame === 180 || frame === 210) {
    simulateKeyPress(16); // Shift
  }
  
  // Guide toward runway
  if (gameState.player) {
    const aircraft = gameState.player;
    
    // Align with runway
    if (Math.abs(aircraft.mesh.position.x) > 2) {
      if (aircraft.mesh.position.x > 0) {
        gameState.keys[65] = true; // Roll left
      } else {
        gameState.keys[68] = true; // Roll right
      }
    }
    
    // Descend gradually
    if (gameState.altitude > 30) {
      gameState.keys[83] = true; // Pitch down
    } else if (gameState.altitude < 10) {
      gameState.keys[87] = true; // Pitch up to flare
    }
    
    // Manage throttle
    const speedKnots = gameState.speed * 1.944;
    if (speedKnots > 150) {
      gameState.keys[40] = true; // Reduce throttle
    } else if (speedKnots < 130) {
      gameState.keys[38] = true; // Increase throttle
    }
  }
}

// TEST_3: Emergency scenarios test
function runTest3() {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.testFrameCount === 60) {
      simulateKeyPress(13);
    }
    return;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const frame = gameState.testFrameCount;
  
  // Trigger emergency
  if (frame === 200) {
    gameState.engine1Running = false;
    gameState.activeEmergencies.push("ENGINE_FAILURE");
  }
  
  // Compensate with remaining engine
  if (frame > 200) {
    gameState.throttle = 0.9;
  }
}

// TEST_4: Fuel management test
function runTest4() {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.testFrameCount === 60) {
      simulateKeyPress(13);
    }
    return;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Run at high throttle to burn fuel
  if (gameState.testFrameCount < 300) {
    gameState.keys[38] = true; // Full throttle
  }
}

// TEST_5: Crash detection test
function runTest5() {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.testFrameCount === 60) {
      simulateKeyPress(13);
    }
    return;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Intentionally crash by diving
  if (gameState.testFrameCount > 120) {
    gameState.keys[83] = true; // Pitch down hard
    gameState.keys[38] = true; // Full throttle
  }
}

// TEST_6: Instrument display test
function runTest6() {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.testFrameCount === 60) {
      simulateKeyPress(13);
    }
    return;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const frame = gameState.testFrameCount;
  
  // Perform various maneuvers
  if (frame > 120 && frame < 240) {
    gameState.keys[87] = true; // Pitch up
  } else if (frame > 240 && frame < 360) {
    gameState.keys[38] = true; // Throttle up
  } else if (frame > 360 && frame < 480) {
    gameState.keys[68] = true; // Roll
  }
}

// TEST_7: Pause and restart test
function runTest7() {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.testFrameCount === 60) {
      simulateKeyPress(13);
    }
    return;
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.testFrameCount === 200) {
      simulateKeyPress(27); // Pause
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    if (gameState.testFrameCount === 300) {
      simulateKeyPress(27); // Unpause
    }
  }
  
  // Crash intentionally
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.testFrameCount > 400) {
    gameState.keys[83] = true; // Dive
    gameState.keys[38] = true; // Full throttle
  }
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (gameState.testFrameCount > 500) {
      simulateKeyPress(82); // Restart
    }
  }
}