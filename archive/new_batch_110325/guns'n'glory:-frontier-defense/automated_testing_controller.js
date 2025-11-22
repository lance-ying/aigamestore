// automated_testing_controller.js - Automated testing strategies

import { gameState, CONTROL_TEST_1, CONTROL_TEST_2, KEY_SPACE, KEY_Z, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, UNIT_BANDIT, UNIT_MEXICAN, UNIT_INDIAN, PHASE_PLAYING } from './globals.js';

let testState = {
  actionQueue: [],
  lastActionFrame: 0,
  unitDeployed: false,
  upgradePhase: false,
  positionHistory: [],
  lastGold: 0
};

function getTestBasicAction(gs) {
  // Basic testing: deploy units and let them attack
  const currentFrame = gs.frameCount;
  
  // Throttle actions
  if (currentFrame - testState.lastActionFrame < 10) {
    return null;
  }
  
  // Deploy initial units
  if (gs.units.length === 0 && gs.gold >= 50) {
    testState.lastActionFrame = currentFrame;
    return { keyPressed: KEY_Z }; // Open menu
  }
  
  // Navigate and recruit
  if (gs.menuOpen && gs.gold >= 50) {
    testState.lastActionFrame = currentFrame;
    if (Math.random() < 0.5) {
      return { keyPressed: KEY_SPACE }; // Recruit
    }
    return { keyPressed: KEY_DOWN }; // Navigate
  }
  
  // Close menu
  if (gs.menuOpen && gs.gold < 50) {
    testState.lastActionFrame = currentFrame;
    return { keyPressed: 16 }; // SHIFT to close
  }
  
  // Select and move units occasionally
  if (gs.units.length > 0 && Math.random() < 0.02) {
    testState.lastActionFrame = currentFrame;
    
    if (!gs.selectedUnit) {
      return { keyPressed: KEY_SPACE }; // Select unit
    } else {
      // Move toward path center
      const directions = [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN];
      return { keyPressed: directions[Math.floor(Math.random() * directions.length)] };
    }
  }
  
  return null;
}

function getTestWinAction(gs) {
  // Optimal strategy to win the game
  const currentFrame = gs.frameCount;
  
  // Throttle actions
  if (currentFrame - testState.lastActionFrame < 8) {
    return null;
  }
  
  // Phase 1: Deploy initial units near path
  if (gs.units.length < 2 && gs.gold >= 50) {
    testState.lastActionFrame = currentFrame;
    
    if (!gs.menuOpen) {
      return { keyPressed: KEY_Z }; // Open menu
    } else {
      // Recruit bandit (first option)
      return { keyPressed: KEY_SPACE };
    }
  }
  
  // Phase 2: Position units strategically
  if (gs.units.length >= 1 && gs.units.length <= 3) {
    // Select unit and move to strategic positions
    if (!gs.selectedUnit && Math.random() < 0.3) {
      testState.lastActionFrame = currentFrame;
      return { keyPressed: KEY_SPACE }; // Select unit
    }
    
    if (gs.selectedUnit) {
      // Move unit toward middle of path
      const targetY = 200;
      const targetX = 300;
      
      testState.lastActionFrame = currentFrame;
      
      if (Math.abs(gs.selectedUnit.y - targetY) > 20) {
        return { keyPressed: gs.selectedUnit.y < targetY ? KEY_DOWN : KEY_UP };
      } else if (Math.abs(gs.selectedUnit.x - targetX) > 20) {
        return { keyPressed: gs.selectedUnit.x < targetX ? KEY_RIGHT : KEY_LEFT };
      } else {
        // Deselect
        return { keyPressed: KEY_SPACE };
      }
    }
  }
  
  // Phase 3: Recruit better units when gold is sufficient
  if (gs.gold >= 100 && gs.units.length < 5) {
    testState.lastActionFrame = currentFrame;
    
    if (!gs.menuOpen) {
      return { keyPressed: KEY_Z };
    } else {
      // Navigate to Indian unit (stronger)
      if (gs.menuSelection < 2) {
        return { keyPressed: KEY_DOWN };
      } else {
        return { keyPressed: KEY_SPACE };
      }
    }
  }
  
  // Phase 4: Upgrade units
  if (gs.gold >= 40 && gs.units.length >= 3) {
    testState.lastActionFrame = currentFrame;
    
    if (!gs.selectedUnit && gs.units.length > 0) {
      return { keyPressed: KEY_SPACE }; // Select unit
    }
    
    if (gs.selectedUnit && !gs.menuOpen) {
      return { keyPressed: KEY_Z }; // Open menu for upgrades
    }
    
    if (gs.menuOpen && gs.selectedUnit) {
      // Navigate to upgrade options
      if (gs.menuSelection < 3) {
        return { keyPressed: KEY_DOWN };
      } else {
        return { keyPressed: KEY_SPACE }; // Upgrade
      }
    }
  }
  
  // Close menu if open and no actions needed
  if (gs.menuOpen && gs.gold < 40) {
    testState.lastActionFrame = currentFrame;
    return { keyPressed: 16 }; // SHIFT
  }
  
  // Reactive movement: Move units toward enemies that are getting through
  if (gs.enemies.length > 0 && gs.units.length > 0) {
    const escapingEnemies = gs.enemies.filter(e => !e.dead && e.pathIndex > gs.paths.length - 3);
    
    if (escapingEnemies.length > 0 && Math.random() < 0.1) {
      testState.lastActionFrame = currentFrame;
      
      if (!gs.selectedUnit) {
        return { keyPressed: KEY_SPACE };
      } else {
        // Move toward escaping enemy
        const target = escapingEnemies[0];
        const dx = target.x - gs.selectedUnit.x;
        const dy = target.y - gs.selectedUnit.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          return { keyPressed: dx > 0 ? KEY_RIGHT : KEY_LEFT };
        } else {
          return { keyPressed: dy > 0 ? KEY_DOWN : KEY_UP };
        }
      }
    }
  }
  
  return null;
}

function getRandomAction(gs) {
  // Random actions for fallback
  if (Math.random() < 0.05) {
    const actions = [KEY_SPACE, KEY_Z, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN];
    return { keyPressed: actions[Math.floor(Math.random() * actions.length)] };
  }
  return null;
}

export function get_automated_testing_action(gs) {
  if (gs.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  switch (gs.controlMode) {
    case CONTROL_TEST_1:
      return getTestBasicAction(gs);
    case CONTROL_TEST_2:
      return getTestWinAction(gs);
    default:
      return getRandomAction(gs);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;