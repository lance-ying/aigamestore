// automated_testing_controller.js - Automated testing

import { gameState } from './globals.js';

let testState = {
  actionQueue: [],
  currentStep: 0,
  stuckCounter: 0,
  lastX: 0,
  frameCounter: 0,
  waitFrames: 0
};

function getTestWinAction(gs) {
  // Strategy to complete the game
  const player = gs.player;
  if (!player || !player.alive) return [];
  
  testState.frameCounter++;
  
  // Wait if in wait mode
  if (testState.waitFrames > 0) {
    testState.waitFrames--;
    return [];
  }
  
  // Check if stuck
  if (Math.abs(player.x - testState.lastX) < 1) {
    testState.stuckCounter++;
  } else {
    testState.stuckCounter = 0;
  }
  testState.lastX = player.x;
  
  // If stuck, try jumping
  if (testState.stuckCounter > 60) {
    testState.stuckCounter = 0;
    return [32]; // Jump
  }
  
  const actions = [];
  const currentCheckpoint = gs.currentCheckpoint;
  
  // Checkpoint-specific strategies
  if (currentCheckpoint === 0) {
    // Move right, jump over trap
    if (player.x < 380) {
      actions.push(39); // Right
    } else if (player.x < 450 && player.x > 370) {
      actions.push(39, 32); // Right + Jump
    } else if (player.x < 700) {
      actions.push(39); // Right
    }
  } else if (currentCheckpoint === 1) {
    // Grab crate, move to platform, jump up
    const crate = gs.interactables.find(obj => obj.type === 'crate' && obj.checkpointIndex === 1);
    
    if (crate && Math.abs(player.x - crate.x) > 30) {
      // Move to crate
      if (player.x < crate.x) {
        actions.push(39); // Right
      } else {
        actions.push(37); // Left
      }
    } else if (crate && player.x < 880) {
      // Grab and move crate
      actions.push(90, 39); // Z + Right
    } else if (player.x < 920 && player.y > 240) {
      // Jump onto crate
      actions.push(32); // Jump
    } else if (player.x < 1100) {
      // Continue right
      actions.push(39); // Right
    } else if (player.x < 1200) {
      // Jump over spider
      actions.push(39, 32); // Right + Jump
    }
  } else if (currentCheckpoint === 2) {
    // Activate lever, go through gate
    const lever = gs.interactables.find(obj => obj.type === 'lever' && obj.checkpointIndex === 2);
    
    if (lever && !lever.activated) {
      if (Math.abs(player.x - 1280) > 20) {
        // Move to lever
        if (player.x < 1280) {
          actions.push(39); // Right
        } else {
          actions.push(37); // Left
        }
      } else if (player.x > 1240 && player.x < 1300) {
        // Activate lever
        actions.push(90); // Z
        testState.waitFrames = 30;
      }
    } else if (player.x < 1450) {
      // Move through gate
      actions.push(39); // Right
    } else if (player.x < 1500) {
      // Jump over spikes
      actions.push(39, 32); // Right + Jump
    } else if (player.x < 1600) {
      actions.push(39); // Right
    }
  } else if (currentCheckpoint === 3) {
    // Use crates to reach high platform
    const crate2 = gs.interactables.find(obj => obj.type === 'crate' && obj.x > 1570 && obj.x < 1590);
    
    if (player.y > 300 && crate2 && Math.abs(player.x - crate2.x) > 30) {
      // Get first crate
      if (player.x < crate2.x) {
        actions.push(39); // Right
      } else {
        actions.push(37); // Left
      }
    } else if (player.y > 300 && crate2 && player.x < 1650) {
      // Move crate right
      actions.push(90, 39); // Z + Right
    } else if (player.y > 250 && player.x > 1620 && player.x < 1680) {
      // Jump onto crate
      actions.push(32); // Jump
    } else if (player.y < 250 && player.x < 1850) {
      // Move to next area
      actions.push(39); // Right
    } else if (player.x < 2000) {
      // Jump to checkpoint
      actions.push(39, 32); // Right + Jump
    }
  } else if (currentCheckpoint === 4) {
    // Multi-lever puzzle
    const lever2 = gs.interactables.find(obj => obj.type === 'lever' && obj.x > 2060 && obj.x < 2080);
    const lever3 = gs.interactables.find(obj => obj.type === 'lever' && obj.x > 2210 && obj.x < 2230);
    
    if (lever2 && !lever2.activated) {
      if (Math.abs(player.x - 2070) > 20) {
        if (player.x < 2070) {
          actions.push(39); // Right
        } else {
          actions.push(37); // Left
        }
      } else {
        actions.push(90); // Z
        testState.waitFrames = 30;
      }
    } else if (lever3 && !lever3.activated) {
      if (Math.abs(player.x - 2220) > 20) {
        if (player.x < 2220) {
          actions.push(39); // Right
        } else {
          actions.push(37); // Left
        }
      } else {
        actions.push(90); // Z
        testState.waitFrames = 30;
      }
    } else if (player.x < 2360) {
      actions.push(39); // Right
    } else if (player.x < 2650) {
      // Jump over traps
      if (testState.frameCounter % 40 < 20) {
        actions.push(39, 32); // Right + Jump
      } else {
        actions.push(39); // Right
      }
    } else {
      // Final stretch
      actions.push(39); // Right
    }
  } else if (currentCheckpoint === 5) {
    // Just move right to end
    actions.push(39); // Right
  }
  
  return actions;
}

function getBasicTestAction(gs) {
  // Simple movement and interaction test
  const player = gs.player;
  if (!player || !player.alive) return [];
  
  testState.frameCounter++;
  
  const actions = [];
  
  // Basic pattern: move right, occasional jumps and grabs
  if (testState.frameCounter % 80 < 60) {
    actions.push(39); // Right
  }
  
  if (testState.frameCounter % 80 === 30) {
    actions.push(32); // Jump
  }
  
  if (testState.frameCounter % 120 === 60) {
    actions.push(90); // Grab
  }
  
  return actions;
}

function getRandomAction(gs) {
  const actions = [];
  const rand = Math.random();
  
  if (rand < 0.4) {
    actions.push(39); // Right
  } else if (rand < 0.5) {
    actions.push(37); // Left
  }
  
  if (rand > 0.8) {
    actions.push(32); // Jump
  }
  
  if (rand > 0.9) {
    actions.push(90); // Grab
  }
  
  return actions;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;