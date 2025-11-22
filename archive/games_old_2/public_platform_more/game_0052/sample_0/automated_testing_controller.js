// automated_testing_controller.js - Automated testing

import { gameState } from './globals.js';

let testState = {
  positionHistory: [],
  actionHistory: [],
  lastActionFrame: 0,
  phase: 'initial',
  waitFrames: 0
};

function getTestWinAction(gs) {
  // TEST_2: Comprehensive win strategy
  const currentFrame = gs.framesSinceStart || 0;
  
  // Wait between actions
  if (currentFrame - testState.lastActionFrame < 30) {
    return null;
  }
  
  // Phase 1: Build fire and gather initial wood
  if (gs.fireTemp < 50 && gs.wood < 100) {
    if (gs.wood >= 5) {
      testState.lastActionFrame = currentFrame;
      return { keyCode: 32 }; // Light fire
    } else {
      // Navigate to collect wood
      if (gs.selectedActionIndex !== 1) {
        return { keyCode: 40 }; // DOWN
      }
      testState.lastActionFrame = currentFrame;
      return { keyCode: 32 }; // Collect wood
    }
  }
  
  // Phase 2: Build first hut
  if (gs.huts === 0 && gs.wood >= 100) {
    const hutIndex = gs.availableActions.findIndex(a => a.key === 'buildHut');
    if (hutIndex >= 0) {
      if (gs.selectedActionIndex !== hutIndex) {
        return { keyCode: gs.selectedActionIndex < hutIndex ? 40 : 38 };
      }
      testState.lastActionFrame = currentFrame;
      return { keyCode: 32 };
    }
  }
  
  // Phase 3: Gather more resources and build more huts
  if (gs.huts < 3) {
    if (gs.wood >= 100) {
      const hutIndex = gs.availableActions.findIndex(a => a.key === 'buildHut');
      if (hutIndex >= 0) {
        if (gs.selectedActionIndex !== hutIndex) {
          return { keyCode: gs.selectedActionIndex < hutIndex ? 40 : 38 };
        }
        testState.lastActionFrame = currentFrame;
        return { keyCode: 32 };
      }
    }
    
    // Collect wood while waiting
    const woodIndex = gs.availableActions.findIndex(a => a.key === 'collectWood');
    if (woodIndex >= 0) {
      if (gs.selectedActionIndex !== woodIndex) {
        return { keyCode: gs.selectedActionIndex < woodIndex ? 40 : 38 };
      }
      testState.lastActionFrame = currentFrame;
      return { keyCode: 32 };
    }
  }
  
  // Phase 4: Hunt for food
  if (gs.food < 150) {
    const huntIndex = gs.availableActions.findIndex(a => a.key === 'hunt');
    if (huntIndex >= 0) {
      if (gs.selectedActionIndex !== huntIndex) {
        return { keyCode: gs.selectedActionIndex < huntIndex ? 40 : 38 };
      }
      testState.lastActionFrame = currentFrame;
      return { keyCode: 32 };
    }
  }
  
  // Phase 5: Trap for fur
  if (gs.fur < 30) {
    const trapIndex = gs.availableActions.findIndex(a => a.key === 'trap');
    if (trapIndex >= 0) {
      if (gs.selectedActionIndex !== trapIndex) {
        return { keyCode: gs.selectedActionIndex < trapIndex ? 40 : 38 };
      }
      testState.lastActionFrame = currentFrame;
      return { keyCode: 32 };
    }
  }
  
  // Phase 6: Build workshop
  if (gs.workshops === 0 && gs.wood >= 200 && gs.fur >= 10) {
    const workshopIndex = gs.availableActions.findIndex(a => a.key === 'buildWorkshop');
    if (workshopIndex >= 0) {
      if (gs.selectedActionIndex !== workshopIndex) {
        return { keyCode: gs.selectedActionIndex < workshopIndex ? 40 : 38 };
      }
      testState.lastActionFrame = currentFrame;
      return { keyCode: 32 };
    }
  }
  
  // Phase 7: Prepare for expedition
  if (!gs.inExpedition && gs.food >= 50 && gs.wood >= 100) {
    const embarkIndex = gs.availableActions.findIndex(a => a.key === 'embark');
    if (embarkIndex >= 0) {
      if (gs.selectedActionIndex !== embarkIndex) {
        return { keyCode: gs.selectedActionIndex < embarkIndex ? 40 : 38 };
      }
      testState.lastActionFrame = currentFrame;
      return { keyCode: 32 };
    }
  }
  
  // Phase 8: Navigate expedition
  if (gs.inExpedition) {
    if (gs.inCombat) {
      // Combat: attack if we have good health, flee if low
      if (gs.playerHealth < 30) {
        if (gs.selectedActionIndex !== 1) {
          return { keyCode: 39 }; // RIGHT to flee
        }
        testState.lastActionFrame = currentFrame;
        return { keyCode: 32 };
      } else {
        if (gs.selectedActionIndex !== 0) {
          return { keyCode: 37 }; // LEFT to attack
        }
        testState.lastActionFrame = currentFrame;
        return { keyCode: 32 };
      }
    } else {
      // Move forward if we have supplies
      if (gs.supplies > 5 && gs.playerHealth > 40) {
        testState.lastActionFrame = currentFrame;
        return { keyCode: 32 }; // Move forward
      } else {
        // Return to village to resupply
        testState.lastActionFrame = currentFrame;
        return { keyCode: 16 }; // SHIFT - return
      }
    }
  }
  
  // Continue gathering resources
  const woodIndex = gs.availableActions.findIndex(a => a.key === 'collectWood');
  if (woodIndex >= 0) {
    if (gs.selectedActionIndex !== woodIndex) {
      return { keyCode: gs.selectedActionIndex < woodIndex ? 40 : 38 };
    }
    testState.lastActionFrame = currentFrame;
    return { keyCode: 32 };
  }
  
  return null;
}

function getBasicTestAction(gs) {
  // TEST_1: Basic functionality test
  const currentFrame = gs.framesSinceStart || 0;
  
  if (currentFrame - testState.lastActionFrame < 20) {
    return null;
  }
  
  // Alternate between lighting fire and collecting wood
  if (gs.wood >= 5 && gs.fireTemp < 80) {
    if (gs.selectedActionIndex !== 0) {
      return { keyCode: 38 }; // UP
    }
    testState.lastActionFrame = currentFrame;
    return { keyCode: 32 }; // Light fire
  } else {
    if (gs.selectedActionIndex !== 1) {
      return { keyCode: 40 }; // DOWN
    }
    testState.lastActionFrame = currentFrame;
    return { keyCode: 32 }; // Collect wood
  }
}

function getVillageExpansionTest(gs) {
  // TEST_3: Village expansion test
  const currentFrame = gs.framesSinceStart || 0;
  
  if (currentFrame - testState.lastActionFrame < 30) {
    return null;
  }
  
  // Build huts
  if (gs.wood >= 100 && gs.huts < 5) {
    const hutIndex = gs.availableActions.findIndex(a => a.key === 'buildHut');
    if (hutIndex >= 0) {
      if (gs.selectedActionIndex !== hutIndex) {
        return { keyCode: gs.selectedActionIndex < hutIndex ? 40 : 38 };
      }
      testState.lastActionFrame = currentFrame;
      return { keyCode: 32 };
    }
  }
  
  // Collect wood
  const woodIndex = gs.availableActions.findIndex(a => a.key === 'collectWood');
  if (woodIndex >= 0) {
    if (gs.selectedActionIndex !== woodIndex) {
      return { keyCode: gs.selectedActionIndex < woodIndex ? 40 : 38 };
    }
    testState.lastActionFrame = currentFrame;
    return { keyCode: 32 };
  }
  
  return null;
}

function getHuntingTest(gs) {
  // TEST_4: Hunting and trapping test
  const currentFrame = gs.framesSinceStart || 0;
  
  if (currentFrame - testState.lastActionFrame < 25) {
    return null;
  }
  
  // Build huts to unlock hunting
  if (gs.huts < 2) {
    if (gs.wood >= 100) {
      const hutIndex = gs.availableActions.findIndex(a => a.key === 'buildHut');
      if (hutIndex >= 0) {
        if (gs.selectedActionIndex !== hutIndex) {
          return { keyCode: gs.selectedActionIndex < hutIndex ? 40 : 38 };
        }
        testState.lastActionFrame = currentFrame;
        return { keyCode: 32 };
      }
    }
  }
  
  // Hunt
  const huntIndex = gs.availableActions.findIndex(a => a.key === 'hunt');
  if (huntIndex >= 0 && gs.wood >= 10) {
    if (gs.selectedActionIndex !== huntIndex) {
      return { keyCode: gs.selectedActionIndex < huntIndex ? 40 : 38 };
    }
    testState.lastActionFrame = currentFrame;
    return { keyCode: 32 };
  }
  
  // Trap
  const trapIndex = gs.availableActions.findIndex(a => a.key === 'trap');
  if (trapIndex >= 0 && gs.wood >= 20) {
    if (gs.selectedActionIndex !== trapIndex) {
      return { keyCode: gs.selectedActionIndex < trapIndex ? 40 : 38 };
    }
    testState.lastActionFrame = currentFrame;
    return { keyCode: 32 };
  }
  
  // Collect wood
  const woodIndex = gs.availableActions.findIndex(a => a.key === 'collectWood');
  if (woodIndex >= 0) {
    if (gs.selectedActionIndex !== woodIndex) {
      return { keyCode: gs.selectedActionIndex < woodIndex ? 40 : 38 };
    }
    testState.lastActionFrame = currentFrame;
    return { keyCode: 32 };
  }
  
  return null;
}

function getExpeditionTest(gs) {
  // TEST_5: Expedition test
  const currentFrame = gs.framesSinceStart || 0;
  
  if (currentFrame - testState.lastActionFrame < 30) {
    return null;
  }
  
  if (!gs.inExpedition) {
    // Prepare for expedition
    if (gs.food < 50) {
      const huntIndex = gs.availableActions.findIndex(a => a.key === 'hunt');
      if (huntIndex >= 0 && gs.wood >= 10) {
        if (gs.selectedActionIndex !== huntIndex) {
          return { keyCode: gs.selectedActionIndex < huntIndex ? 40 : 38 };
        }
        testState.lastActionFrame = currentFrame;
        return { keyCode: 32 };
      }
    }
    
    if (gs.wood < 100) {
      const woodIndex = gs.availableActions.findIndex(a => a.key === 'collectWood');
      if (woodIndex >= 0) {
        if (gs.selectedActionIndex !== woodIndex) {
          return { keyCode: gs.selectedActionIndex < woodIndex ? 40 : 38 };
        }
        testState.lastActionFrame = currentFrame;
        return { keyCode: 32 };
      }
    }
    
    if (gs.food >= 50 && gs.wood >= 100) {
      const embarkIndex = gs.availableActions.findIndex(a => a.key === 'embark');
      if (embarkIndex >= 0) {
        if (gs.selectedActionIndex !== embarkIndex) {
          return { keyCode: gs.selectedActionIndex < embarkIndex ? 40 : 38 };
        }
        testState.lastActionFrame = currentFrame;
        return { keyCode: 32 };
      }
    }
  } else {
    // In expedition
    if (gs.inCombat) {
      // Attack
      if (gs.selectedActionIndex !== 0) {
        return { keyCode: 37 };
      }
      testState.lastActionFrame = currentFrame;
      return { keyCode: 32 };
    } else {
      // Move forward
      testState.lastActionFrame = currentFrame;
      return { keyCode: 32 };
    }
  }
  
  return null;
}

function getRandomAction(gs) {
  const actions = [38, 40, 32]; // UP, DOWN, SPACE
  return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

export function get_automated_testing_action(gs) {
  switch (gs.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    case "TEST_3":
      return getVillageExpansionTest(gs);
    case "TEST_4":
      return getHuntingTest(gs);
    case "TEST_5":
      return getExpeditionTest(gs);
    default:
      return getRandomAction(gs);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;