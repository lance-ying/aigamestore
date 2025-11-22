// automated_testing_controller.js - Automated testing
import { GAME_PHASES } from './globals.js';

function getRandomAction(gameState) {
  const actions = ['left', 'right', 'up', 'down', 'z', 'space'];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    z: false,
    space: false,
    shift: false
  };
  
  keys[randomAction] = true;
  
  return keys;
}

function getTestBasicAction(gameState) {
  // TEST_1: Basic movement test - move staff around
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    z: false,
    space: false,
    shift: false
  };

  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return keys;
  }

  const staff = gameState.player;
  const exitPortal = gameState.exitPortal;
  
  if (!staff || !exitPortal) return keys;

  // Simple strategy: move towards exit
  const dx = exitPortal.x - staff.x;
  const dy = exitPortal.y - staff.y;

  if (Math.abs(dx) > 20) {
    keys.right = dx > 0;
    keys.left = dx < 0;
  }
  
  if (Math.abs(dy) > 20) {
    keys.down = dy > 0;
    keys.up = dy < 0;
  }

  keys.shift = true; // Use speed boost

  return keys;
}

function getTestWinAction(gameState) {
  // TEST_2: Win the game
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    z: false,
    space: false,
    shift: true
  };

  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return keys;
  }

  const staff = gameState.player;
  const exitPortal = gameState.exitPortal;
  const currentLevel = gameState.currentLevel;
  
  if (!staff || !exitPortal) return keys;

  // Strategy based on level
  if (currentLevel === 0) {
    // Level 0: Simple navigation, no tower needed
    if (staff.x < 480) {
      keys.right = true;
    }
    if (staff.y > 290) {
      keys.up = true;
    }
  } else if (currentLevel === 1) {
    // Level 1: Need to build a bridge across gap
    const gap1X = 210; // Position to build first tower
    
    if (!gameState.tower && gameState.bridges.length === 0) {
      // Phase 1: Move to gap position
      if (Math.abs(staff.x - gap1X) > 15) {
        keys.right = staff.x < gap1X;
        keys.left = staff.x > gap1X;
      } else if (staff.y > 330) {
        keys.up = true;
      } else {
        // Phase 2: Build tower
        if (gameState.selectedCitizen) {
          // Already have selected citizen, look for another
          keys.z = true;
        } else {
          // Select first citizen
          keys.z = true;
        }
      }
    } else if (gameState.tower && !gameState.tower.state.includes("topple")) {
      // Phase 3: Topple tower to the right
      keys.right = true;
    } else if (gameState.bridges.length > 0) {
      // Phase 4: Move to exit
      if (staff.x < exitPortal.x - 30) {
        keys.right = true;
      }
      if (Math.abs(staff.y - exitPortal.y) > 20) {
        keys.down = staff.y < exitPortal.y;
        keys.up = staff.y > exitPortal.y;
      }
    }
  } else if (currentLevel === 2) {
    // Level 2: Two gaps to cross
    const gap1X = 140;
    const gap2X = 320;
    
    if (gameState.bridges.length === 0) {
      // Build first bridge
      if (Math.abs(staff.x - gap1X) > 15) {
        keys.right = staff.x < gap1X;
        keys.left = staff.x > gap1X;
      } else {
        if (!gameState.tower) {
          keys.z = true;
        } else if (gameState.tower && gameState.tower.state === "standing") {
          keys.right = true;
        }
      }
    } else if (gameState.bridges.length === 1) {
      // Move to second gap
      if (Math.abs(staff.x - gap2X) > 15) {
        keys.right = staff.x < gap2X;
        keys.left = staff.x > gap2X;
      } else {
        if (!gameState.tower) {
          keys.z = true;
        } else if (gameState.tower && gameState.tower.state === "standing") {
          keys.right = true;
        }
      }
    } else {
      // Move to exit
      if (staff.x < exitPortal.x - 30) {
        keys.right = true;
      }
    }
  }

  return keys;
}

function getTestTowerAction(gameState) {
  // TEST_3: Test tower building
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    z: false,
    space: false,
    shift: false
  };

  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return keys;
  }

  const staff = gameState.player;
  if (!staff) return keys;

  // Stay in one place and build a tower
  const targetX = 150;
  const targetY = 330;

  if (Math.abs(staff.x - targetX) > 10) {
    keys.right = staff.x < targetX;
    keys.left = staff.x > targetX;
  } else if (Math.abs(staff.y - targetY) > 10) {
    keys.down = staff.y < targetY;
    keys.up = staff.y > targetY;
  } else {
    // Build tower by repeatedly pressing Z
    if (gameState.frameCount % 20 === 0) {
      keys.z = true;
    }
  }

  return keys;
}

function getTestBridgeAction(gameState) {
  // TEST_4: Test bridge creation
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    z: false,
    space: false,
    shift: false
  };

  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return keys;
  }

  const staff = gameState.player;
  if (!staff) return keys;

  const buildX = 200;
  const buildY = 330;

  if (!gameState.tower && gameState.bridges.length === 0) {
    // Move to build position
    if (Math.abs(staff.x - buildX) > 15) {
      keys.right = staff.x < buildX;
      keys.left = staff.x > buildX;
    } else if (Math.abs(staff.y - buildY) > 15) {
      keys.down = staff.y < buildY;
      keys.up = staff.y > buildY;
    } else {
      // Build tower
      keys.z = true;
    }
  } else if (gameState.tower && gameState.tower.state === "standing") {
    // Topple tower
    keys.right = true;
  } else if (gameState.bridges.length > 0) {
    // Bridge created, move across it
    keys.right = true;
  }

  return keys;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestTowerAction(gameState);
    case "TEST_4":
      return getTestBridgeAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;