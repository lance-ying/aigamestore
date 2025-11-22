// automation.js - Automated testing functions

import { gameState, CONTROL_MODES, GAME_PHASES } from './globals.js';

export function updateAutomation(p) {
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

// TEST_1: Basic flight controls test
function runTest1(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.testFrameCount > 60) {
      p.keyCode = 13;
      p.key = 'Enter';
      p.keyPressed();
    }
    return;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const frame = gameState.testFrameCount;
  
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
    gameState.keys[38] = true; // Up arrow - increase
  } else if (frame > 540 && frame < 600) {
    gameState.keys[40] = true; // Down arrow - decrease
  }
  
  // Maintain stable flight
  if (frame > 600) {
    gameState.throttle = 0.6;
  }
}

// TEST_2: Successful landing test
function runTest2(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.testFrameCount > 60) {
      p.keyCode = 13;
      p.key = 'Enter';
      p.keyPressed();
    }
    return;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const frame = gameState.testFrameCount;
  
  // Deploy gear early
  if (frame === 120) {
    gameState.keys[32] = true; // Space
    setTimeout(() => gameState.keys[32] = false, 100);
  }
  
  // Deploy flaps
  if (frame === 150 || frame === 180 || frame === 210) {
    gameState.keys[16] = true; // Shift
    setTimeout(() => gameState.keys[16] = false, 100);
  }
  
  // Guide toward runway
  const aircraft = gameState.player;
  if (aircraft) {
    const targetX = gameState.runway.body.position.x;
    const deltaX = targetX - aircraft.body.position.x;
    
    // Roll to align
    if (Math.abs(deltaX) > 10) {
      if (deltaX > 0) {
        gameState.keys[68] = true; // Roll right
      } else {
        gameState.keys[65] = true; // Roll left
      }
    }
    
    // Descend gradually
    if (gameState.altitude > 100) {
      gameState.keys[83] = true; // Pitch down slightly
    } else if (gameState.altitude < 50) {
      gameState.keys[87] = true; // Pitch up to flare
    }
    
    // Manage throttle
    if (gameState.speed > 150) {
      gameState.keys[40] = true; // Reduce throttle
    } else if (gameState.speed < 130) {
      gameState.keys[38] = true; // Increase throttle
    }
  }
}

// TEST_3: Emergency scenarios test
function runTest3(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.testFrameCount > 60) {
      p.keyCode = 13;
      p.key = 'Enter';
      p.keyPressed();
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
    gameState.throttle = 0.8;
  }
}

// TEST_4: Fuel management test
function runTest4(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.testFrameCount > 60) {
      p.keyCode = 13;
      p.key = 'Enter';
      p.keyPressed();
    }
    return;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const frame = gameState.testFrameCount;
  
  // Run at high throttle to burn fuel
  if (frame < 300) {
    gameState.keys[38] = true; // Full throttle
  }
  
  // Monitor fuel levels
  // Test verifies fuel decreases over time
}

// TEST_5: Crash detection test
function runTest5(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.testFrameCount > 60) {
      p.keyCode = 13;
      p.key = 'Enter';
      p.keyPressed();
    }
    return;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const frame = gameState.testFrameCount;
  
  // Intentionally crash by diving
  if (frame > 120) {
    gameState.keys[83] = true; // Pitch down hard
    gameState.keys[38] = true; // Full throttle
  }
}

// TEST_6: Instrument display test
function runTest6(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.testFrameCount > 60) {
      p.keyCode = 13;
      p.key = 'Enter';
      p.keyPressed();
    }
    return;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Perform various maneuvers to test instruments
  const frame = gameState.testFrameCount;
  
  if (frame > 120 && frame < 240) {
    gameState.keys[87] = true; // Pitch up - test altitude/VS
  } else if (frame > 240 && frame < 360) {
    gameState.keys[38] = true; // Throttle up - test speed
  } else if (frame > 360 && frame < 480) {
    gameState.keys[68] = true; // Roll - test heading
  }
}

// TEST_7: Pause and restart test
function runTest7(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    if (gameState.testFrameCount > 60) {
      p.keyCode = 13;
      p.key = 'Enter';
      p.keyPressed();
    }
    return;
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.testFrameCount === 200) {
      p.keyCode = 27;
      p.key = 'Escape';
      p.keyPressed(); // Pause
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    if (gameState.testFrameCount === 300) {
      p.keyCode = 27;
      p.key = 'Escape';
      p.keyPressed(); // Unpause
    }
  }
  
  // Crash intentionally to test restart
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.testFrameCount > 400) {
    gameState.keys[83] = true; // Dive
    gameState.keys[38] = true; // Full throttle
  }
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    if (gameState.testFrameCount > 500) {
      p.keyCode = 82;
      p.key = 'r';
      p.keyPressed(); // Restart
    }
  }
}