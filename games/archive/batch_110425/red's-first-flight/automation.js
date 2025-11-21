// automation.js - Automated testing logic

import { 
  gameState, 
  CONTROL_MODES,
  MIN_POWER,
  MAX_POWER,
  MIN_ANGLE,
  MAX_ANGLE,
  GAME_PHASES
} from './globals.js';
import { launchBird } from './gameLogic.js';

export function updateAutomation(p) {
  const mode = gameState.controlMode;
  
  switch (mode) {
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

// TEST_1: Basic slingshot mechanics and launching
function runTest1(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const test = gameState.testState;
  
  if (gameState.currentBird && !gameState.birdLaunched) {
    // Cycle through different power and angle combinations
    const configs = [
      { power: 0.3, angle: -60 },
      { power: 0.5, angle: -45 },
      { power: 0.7, angle: -30 },
      { power: 0.9, angle: -45 },
      { power: 1.0, angle: -40 }
    ];
    
    if (test.birdsFired < configs.length) {
      const config = configs[test.birdsFired];
      gameState.slingshotPower = config.power;
      gameState.slingshotAngle = config.angle;
      
      // Wait a bit before launching
      test.framesSinceLaunch++;
      if (test.framesSinceLaunch > 30) {
        launchBird(p);
        test.birdsFired++;
        test.framesSinceLaunch = 0;
      }
    }
  } else {
    test.framesSinceLaunch++;
  }
}

// TEST_2: Win condition
function runTest2(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const test = gameState.testState;
  
  if (gameState.currentBird && !gameState.birdLaunched) {
    // Aim for optimal destruction
    gameState.slingshotPower = 0.8;
    
    // Aim at the base of structures
    if (gameState.pigs.length > 0) {
      const targetPig = gameState.pigs[0];
      const dx = targetPig.body.position.x - 100;
      const dy = targetPig.body.position.y - 300;
      gameState.slingshotAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    } else {
      gameState.slingshotAngle = -45;
    }
    
    test.framesSinceLaunch++;
    if (test.framesSinceLaunch > 20) {
      launchBird(p);
      test.framesSinceLaunch = 0;
    }
  } else {
    test.framesSinceLaunch++;
  }
}

// TEST_3: Lose condition
function runTest3(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const test = gameState.testState;
  
  if (gameState.currentBird && !gameState.birdLaunched) {
    // Intentionally aim poorly
    gameState.slingshotPower = 0.2;
    gameState.slingshotAngle = -80;
    
    test.framesSinceLaunch++;
    if (test.framesSinceLaunch > 20) {
      launchBird(p);
      test.framesSinceLaunch = 0;
    }
  } else {
    test.framesSinceLaunch++;
  }
}

// TEST_4: Structure destruction
function runTest4(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const test = gameState.testState;
  
  if (gameState.currentBird && !gameState.birdLaunched) {
    // Aim at the base of structures with high power
    gameState.slingshotPower = 0.95;
    
    if (gameState.blocks.length > 0) {
      const targetBlock = gameState.blocks[0];
      const dx = targetBlock.body.position.x - 100;
      const dy = targetBlock.body.position.y - 300;
      gameState.slingshotAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    } else {
      gameState.slingshotAngle = -40;
    }
    
    test.framesSinceLaunch++;
    if (test.framesSinceLaunch > 25) {
      launchBird(p);
      test.framesSinceLaunch = 0;
    }
  } else {
    test.framesSinceLaunch++;
  }
}

// TEST_5: Scoring system
function runTest5(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const test = gameState.testState;
  
  if (gameState.currentBird && !gameState.birdLaunched) {
    // Vary efficiency to test star ratings
    const strategies = [
      { power: 0.85, angle: -42 },  // Good shot
      { power: 0.8, angle: -45 }    // Another good shot
    ];
    
    if (test.birdsFired < strategies.length) {
      const strategy = strategies[test.birdsFired];
      gameState.slingshotPower = strategy.power;
      gameState.slingshotAngle = strategy.angle;
    } else {
      gameState.slingshotPower = 0.8;
      gameState.slingshotAngle = -43;
    }
    
    test.framesSinceLaunch++;
    if (test.framesSinceLaunch > 20) {
      launchBird(p);
      test.birdsFired++;
      test.framesSinceLaunch = 0;
    }
  } else {
    test.framesSinceLaunch++;
  }
}

// TEST_6: Pause functionality
function runTest6(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING && 
      gameState.gamePhase !== GAME_PHASES.PAUSED) return;
  
  const test = gameState.testState;
  
  if (!test.pauseTestActive) {
    // Start the test by launching a bird
    if (gameState.currentBird && !gameState.birdLaunched) {
      gameState.slingshotPower = 0.7;
      gameState.slingshotAngle = -45;
      
      test.framesSinceLaunch++;
      if (test.framesSinceLaunch > 20) {
        launchBird(p);
        test.pauseTestActive = true;
        test.framesSinceLaunch = 0;
      }
    }
  } else {
    // Pause and unpause periodically
    test.framesSinceLaunch++;
    
    if (test.framesSinceLaunch === 30 && test.pauseCount < 3) {
      // Trigger pause
      gameState.gamePhase = GAME_PHASES.PAUSED;
      test.pauseCount++;
    }
    
    if (test.framesSinceLaunch === 60 && gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Resume
      gameState.gamePhase = GAME_PHASES.PLAYING;
      test.framesSinceLaunch = 0;
    }
  }
}

// TEST_7: Collision detection
function runTest7(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const test = gameState.testState;
  
  if (gameState.currentBird && !gameState.birdLaunched) {
    // Vary power to test different collision velocities
    const powers = [0.3, 0.6, 0.95];
    
    if (test.birdsFired < powers.length) {
      gameState.slingshotPower = powers[test.birdsFired];
      gameState.slingshotAngle = -45;
    } else {
      gameState.slingshotPower = 0.8;
      gameState.slingshotAngle = -40;
    }
    
    test.framesSinceLaunch++;
    if (test.framesSinceLaunch > 25) {
      launchBird(p);
      test.birdsFired++;
      test.framesSinceLaunch = 0;
    }
  } else {
    test.framesSinceLaunch++;
  }
}