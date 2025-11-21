// automated_testing_controller.js - Automated testing

import { 
  gameState, 
  PHASE_PLAYING,
  MUTATION_BLOCKER,
  MUTATION_EXPLODER,
  MUTATION_JUMPER,
  MUTATION_RUNNER,
  MUTATION_COSTS
} from './globals.js';

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  const actions = [];
  
  // Strategy: Apply mutations intelligently to win
  const activeZombies = gameState.zombies.filter(z => z.active && !z.mutation);
  const activeHumans = gameState.humans.filter(h => h.active && !h.infected);
  
  // Priority 1: Use exploders to destroy obstacles if we have points
  if (gameState.mutationPoints >= MUTATION_COSTS[MUTATION_EXPLODER]) {
    const obstacles = gameState.obstacles.filter(o => o.active && o.destructible);
    if (obstacles.length > 0 && activeZombies.length > 0) {
      // Select exploder mutation and apply
      actions.push({ keyCode: 50 }); // Select exploder
      actions.push({ keyCode: 32 }); // Apply mutation
      return actions[0];
    }
  }
  
  // Priority 2: Use jumpers to cross pits
  if (gameState.mutationPoints >= MUTATION_COSTS[MUTATION_JUMPER]) {
    const pits = gameState.pits.filter(p => p.active);
    if (pits.length > 0 && activeZombies.length > 0) {
      const zombieNearPit = activeZombies.find(z => {
        return pits.some(pit => Math.abs(z.x - pit.x) < 100);
      });
      
      if (zombieNearPit) {
        actions.push({ keyCode: 51 }); // Select jumper
        actions.push({ keyCode: 32 }); // Apply mutation
        return actions[0];
      }
    }
  }
  
  // Priority 3: Use runners to catch humans faster
  if (gameState.mutationPoints >= MUTATION_COSTS[MUTATION_RUNNER] && activeHumans.length > 0) {
    actions.push({ keyCode: 52 }); // Select runner
    actions.push({ keyCode: 32 }); // Apply mutation
    return actions[0];
  }
  
  // Priority 4: Pan camera to follow zombies
  if (activeZombies.length > 0) {
    const leadZombie = activeZombies.reduce((max, z) => z.x > max.x ? z : max, activeZombies[0]);
    if (leadZombie.x - gameState.cameraX > 400) {
      return { keyCode: 39 }; // Right arrow
    } else if (leadZombie.x - gameState.cameraX < 200) {
      return { keyCode: 37 }; // Left arrow
    }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Simple test: pan camera and occasionally apply mutations
  const frame = gameState.frameCounter;
  
  if (frame % 120 === 0) {
    return { keyCode: 39 }; // Right arrow
  } else if (frame % 180 === 60 && gameState.mutationPoints >= 10) {
    return { keyCode: 49 }; // Select blocker
  } else if (frame % 180 === 90) {
    return { keyCode: 32 }; // Apply mutation
  }
  
  return null;
}

function getMovementTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Test camera movement
  const frame = gameState.frameCounter;
  
  if (frame % 60 < 30) {
    return { keyCode: 39 }; // Right
  } else {
    return { keyCode: 37 }; // Left
  }
}

function getMutationTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Test all mutations
  const frame = gameState.frameCounter;
  const cycle = Math.floor(frame / 60) % 10;
  
  if (cycle < 5) {
    return { keyCode: 49 + cycle }; // Select mutations 1-5
  } else if (cycle === 5) {
    return { keyCode: 32 }; // Apply
  }
  
  return null;
}

function getInteractionTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Test human-zombie interaction by guiding zombies toward humans
  const activeZombies = gameState.zombies.filter(z => z.active);
  const activeHumans = gameState.humans.filter(h => h.active && !h.infected);
  
  if (activeZombies.length > 0 && activeHumans.length > 0) {
    const leadZombie = activeZombies[0];
    
    // Pan camera to keep action in view
    if (leadZombie.x - gameState.cameraX > 400) {
      return { keyCode: 39 };
    } else if (leadZombie.x - gameState.cameraX < 100) {
      return { keyCode: 37 };
    }
  }
  
  return null;
}

function getLoseTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }
  
  // Do nothing to let zombies die naturally
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getMutationTestAction(gameState);
    case "TEST_4":
      return getInteractionTestAction(gameState);
    case "TEST_5":
      return getLoseTestAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;