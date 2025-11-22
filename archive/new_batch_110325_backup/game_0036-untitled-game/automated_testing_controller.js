// automated_testing_controller.js
import { gameState, CHECKPOINT_DISTANCE } from './globals.js';

let testState = {
  lastX: 0,
  stuckCounter: 0,
  runCount: 0,
  lastPurchaseFrame: 0
};

function getTestWinAction(gs) {
  // Strategy: Complete multiple runs, upgrade progressively, reach checkpoint
  
  // Between runs, purchase upgrades
  if (gs.gamePhase === "START" && gs.upgradeShopOpen) {
    // Simulate upgrade purchases
    if (gs.frameCount - testState.lastPurchaseFrame > 30) {
      // Priority: engine > fuel > armor > nitro > weapon
      const upgradePriority = ['engine', 'fuel', 'armor', 'nitro', 'weapon'];
      
      for (let upgrade of upgradePriority) {
        const level = gs.upgrades[upgrade];
        if (level < 5) {
          const costs = {
            engine: [100, 200, 400, 800, 1600],
            fuel: [80, 160, 320, 640, 1280],
            armor: [120, 240, 480, 960, 1920],
            weapon: [150, 300, 600, 1200, 2400],
            nitro: [100, 200, 400, 800, 1600]
          };
          
          const cost = costs[upgrade][level];
          if (gs.cash >= cost) {
            testState.lastPurchaseFrame = gs.frameCount;
            // Note: Actual purchase happens via shop interaction in real game
            break;
          }
        }
      }
    }
    
    return null; // Wait for ENTER from human to start run
  }
  
  if (gs.gamePhase !== "PLAYING" || !gs.player) {
    return null;
  }
  
  const player = gs.player;
  const action = {
    nitro: false,
    brake: false,
    pitchLeft: false,
    pitchRight: false
  };
  
  // Check if stuck
  if (Math.abs(player.x - testState.lastX) < 1) {
    testState.stuckCounter++;
  } else {
    testState.stuckCounter = 0;
  }
  testState.lastX = player.x;
  
  // Nitro strategy: use when safe and have enough
  const shouldUseNitro = gs.nitro > 30 && gs.fuel > 20 && player.vx < 10;
  if (shouldUseNitro) {
    action.nitro = true;
  }
  
  // Pitch control in air
  if (!player.onGround) {
    // Try to keep level or slightly nose down
    if (player.rotation > 0.1) {
      action.pitchLeft = true;
    } else if (player.rotation < -0.1) {
      action.pitchRight = true;
    }
  }
  
  // If stuck, try to recover
  if (testState.stuckCounter > 60) {
    if (player.vx < 1) {
      action.nitro = true;
    }
  }
  
  return action;
}

function getBasicTestAction(gs) {
  // Basic movement test: drive forward, use nitro occasionally
  if (gs.gamePhase !== "PLAYING" || !gs.player) {
    return null;
  }
  
  const player = gs.player;
  const action = {
    nitro: false,
    brake: false,
    pitchLeft: false,
    pitchRight: false
  };
  
  // Use nitro periodically when available
  if (gs.nitro > 50 && gs.frameCount % 120 < 60) {
    action.nitro = true;
  }
  
  // Basic pitch control
  if (!player.onGround) {
    if (player.rotation > 0.15) {
      action.pitchLeft = true;
    } else if (player.rotation < -0.15) {
      action.pitchRight = true;
    }
  }
  
  return action;
}

function getRandomAction(gs) {
  if (gs.gamePhase !== "PLAYING" || !gs.player) {
    return null;
  }
  
  return {
    nitro: Math.random() < 0.1,
    brake: Math.random() < 0.05,
    pitchLeft: Math.random() < 0.1,
    pitchRight: Math.random() < 0.1
  };
}

export function get_automated_testing_action(gs) {
  switch (gs.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    default:
      return getRandomAction(gs);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;