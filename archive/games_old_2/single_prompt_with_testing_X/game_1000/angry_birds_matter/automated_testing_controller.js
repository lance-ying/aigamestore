// automated_testing_controller.js - Automated testing functions

import { gameState, GAME_PHASES } from './globals.js';

let testState = {
  currentAction: null,
  actionTimer: 0,
  actionDuration: 0,
  testPhase: 0,
  framesSinceLaunch: 0,
  shotAttempt: 0
};

// TEST_1: Sticky keys test - random continuous inputs
export function getStickyKeysAction(gs) {
  if (gs.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const actions = [32, 37, 38, 39, 40]; // SPACE, LEFT, UP, RIGHT, DOWN
  
  // Change action every 60 frames
  if (testState.actionTimer <= 0) {
    testState.currentAction = actions[Math.floor(Math.random() * actions.length)];
    testState.actionDuration = 60 + Math.floor(Math.random() * 60);
    testState.actionTimer = testState.actionDuration;
  }
  
  testState.actionTimer--;
  
  // Return keydown for half duration, keyup for a moment
  if (testState.actionTimer > 5) {
    return testState.currentAction;
  } else if (testState.actionTimer === 5) {
    return -testState.currentAction; // keyup
  }
  
  return null;
}

// TEST_2: Win test - optimal strategy to hit all pigs
export function getTestWinAction(gs) {
  if (gs.gamePhase !== GAME_PHASES.PLAYING) {
    testState.testPhase = 0;
    testState.framesSinceLaunch = 0;
    testState.shotAttempt = 0;
    return null;
  }
  
  // Strategy: Aim at high angle, medium power to arc over and hit structures/pigs
  
  if (gs.slingshotState === 'FLYING' || gs.slingshotState === 'LAUNCHED') {
    testState.framesSinceLaunch++;
    
    // Wait for bird to settle
    if (testState.framesSinceLaunch > 180) {
      testState.framesSinceLaunch = 0;
      testState.testPhase = 0;
    }
    return null;
  }
  
  testState.framesSinceLaunch = 0;
  
  // Phase 0: Press space to start pulling
  if (testState.testPhase === 0) {
    testState.testPhase = 1;
    return 32; // SPACE down
  }
  
  // Phase 1: Adjust angle upward
  if (testState.testPhase === 1) {
    if (testState.actionTimer < 20) {
      testState.actionTimer++;
      return 38; // UP arrow
    } else {
      testState.actionTimer = 0;
      testState.testPhase = 2;
      return -38; // UP arrow up
    }
  }
  
  // Phase 2: Adjust power
  if (testState.testPhase === 2) {
    if (testState.actionTimer < 25 + testState.shotAttempt * 5) {
      testState.actionTimer++;
      return 40; // DOWN arrow for more power
    } else {
      testState.actionTimer = 0;
      testState.testPhase = 3;
      return -40; // DOWN up
    }
  }
  
  // Phase 3: Release
  if (testState.testPhase === 3) {
    testState.testPhase = 0;
    testState.shotAttempt++;
    return -32; // SPACE up to launch
  }
  
  return null;
}

// TEST_3: Lose test - intentionally miss
export function getTestLoseAction(gs) {
  if (gs.gamePhase !== GAME_PHASES.PLAYING) {
    testState.testPhase = 0;
    testState.framesSinceLaunch = 0;
    return null;
  }
  
  if (gs.slingshotState === 'FLYING' || gs.slingshotState === 'LAUNCHED') {
    testState.framesSinceLaunch++;
    
    if (testState.framesSinceLaunch > 180) {
      testState.framesSinceLaunch = 0;
      testState.testPhase = 0;
    }
    return null;
  }
  
  testState.framesSinceLaunch = 0;
  
  // Phase 0: Press space
  if (testState.testPhase === 0) {
    testState.testPhase = 1;
    return 32; // SPACE down
  }
  
  // Phase 1: Aim too high
  if (testState.testPhase === 1) {
    if (testState.actionTimer < 40) {
      testState.actionTimer++;
      return 38; // UP arrow
    } else {
      testState.actionTimer = 0;
      testState.testPhase = 2;
      return -38;
    }
  }
  
  // Phase 2: Very low power
  if (testState.testPhase === 2) {
    if (testState.actionTimer < 5) {
      testState.actionTimer++;
      return 40;
    } else {
      testState.actionTimer = 0;
      testState.testPhase = 3;
      return -40;
    }
  }
  
  // Phase 3: Release (will shoot up and miss)
  if (testState.testPhase === 3) {
    testState.testPhase = 0;
    return -32;
  }
  
  return null;
}

// TEST_4: Precision test - careful aiming at weak points
export function getTestPrecisionAction(gs) {
  if (gs.gamePhase !== GAME_PHASES.PLAYING) {
    testState.testPhase = 0;
    testState.framesSinceLaunch = 0;
    testState.shotAttempt = 0;
    return null;
  }
  
  if (gs.slingshotState === 'FLYING' || gs.slingshotState === 'LAUNCHED') {
    testState.framesSinceLaunch++;
    
    if (testState.framesSinceLaunch > 180) {
      testState.framesSinceLaunch = 0;
      testState.testPhase = 0;
    }
    return null;
  }
  
  testState.framesSinceLaunch = 0;
  
  // More precise adjustments
  if (testState.testPhase === 0) {
    testState.testPhase = 1;
    return 32;
  }
  
  if (testState.testPhase === 1) {
    if (testState.actionTimer < 15) {
      testState.actionTimer++;
      return 38;
    } else {
      testState.actionTimer = 0;
      testState.testPhase = 2;
      return -38;
    }
  }
  
  if (testState.testPhase === 2) {
    if (testState.actionTimer < 3) {
      testState.actionTimer++;
      return 37; // Fine adjust left
    } else {
      testState.actionTimer = 0;
      testState.testPhase = 3;
      return -37;
    }
  }
  
  if (testState.testPhase === 3) {
    if (testState.actionTimer < 30) {
      testState.actionTimer++;
      return 40;
    } else {
      testState.actionTimer = 0;
      testState.testPhase = 4;
      return -40;
    }
  }
  
  if (testState.testPhase === 4) {
    testState.testPhase = 0;
    testState.shotAttempt++;
    return -32;
  }
  
  return null;
}

// TEST_5: Rapid input test
export function getRapidInputAction(gs) {
  if (gs.gamePhase !== GAME_PHASES.PLAYING) {
    testState.testPhase = 0;
    testState.framesSinceLaunch = 0;
    return null;
  }
  
  if (gs.slingshotState === 'FLYING' || gs.slingshotState === 'LAUNCHED') {
    testState.framesSinceLaunch++;
    
    if (testState.framesSinceLaunch > 180) {
      testState.framesSinceLaunch = 0;
      testState.testPhase = 0;
    }
    return null;
  }
  
  testState.framesSinceLaunch = 0;
  
  if (testState.testPhase === 0) {
    testState.testPhase = 1;
    return 32;
  }
  
  // Rapid alternating inputs
  if (testState.testPhase === 1) {
    const rapidActions = [38, -38, 39, -39, 37, -37, 40, -40];
    const idx = testState.actionTimer % rapidActions.length;
    testState.actionTimer++;
    
    if (testState.actionTimer > 40) {
      testState.actionTimer = 0;
      testState.testPhase = 2;
    }
    
    return rapidActions[idx];
  }
  
  if (testState.testPhase === 2) {
    testState.testPhase = 0;
    return -32;
  }
  
  return null;
}

export function getTestAction(gs) {
  const mode = gs.controlMode;
  
  if (mode === 'TEST_1') {
    return getStickyKeysAction(gs);
  } else if (mode === 'TEST_2') {
    return getTestWinAction(gs);
  } else if (mode === 'TEST_3') {
    return getTestLoseAction(gs);
  } else if (mode === 'TEST_4') {
    return getTestPrecisionAction(gs);
  } else if (mode === 'TEST_5') {
    return getRapidInputAction(gs);
  }
  
  return null;
}