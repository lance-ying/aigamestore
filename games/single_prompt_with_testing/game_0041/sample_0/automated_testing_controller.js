// automated_testing_controller.js - Automated testing
import { gameState } from './globals.js';

let testState = {
  targetGem: null,
  targetStation: null,
  returning: false,
  stuckCounter: 0,
  lastPosition: { x: 0, y: 0 },
  stuckThreshold: 60,
  avoidanceMode: false,
  avoidanceCounter: 0
};

function getTestWinAction(gs) {
  const player = gs.player;
  if (!player || !player.alive) return {};
  
  // Check if stuck
  const distMoved = Math.sqrt(
    Math.pow(player.x - testState.lastPosition.x, 2) + 
    Math.pow(player.y - testState.lastPosition.y, 2)
  );
  
  if (distMoved < 0.5) {
    testState.stuckCounter++;
  } else {
    testState.stuckCounter = 0;
  }
  
  testState.lastPosition = { x: player.x, y: player.y };
  
  // Avoidance mode if stuck
  if (testState.stuckCounter > testState.stuckThreshold) {
    testState.avoidanceMode = true;
    testState.avoidanceCounter = 30;
    testState.stuckCounter = 0;
  }
  
  if (testState.avoidanceMode) {
    testState.avoidanceCounter--;
    if (testState.avoidanceCounter <= 0) {
      testState.avoidanceMode = false;
    }
    // Move up and away from walls
    return {
      up: true,
      left: player.x > 300,
      right: player.x <= 300,
      shift: true
    };
  }
  
  // Return to surface if collected gems
  if (gs.gemsCollected > 0 && player.y < 200) {
    testState.returning = true;
  }
  
  if (testState.returning) {
    if (player.y > 120) {
      return {
        up: true,
        left: player.x > 300,
        right: player.x < 300
      };
    } else {
      // At surface
      return {};
    }
  }
  
  // Need fuel?
  if (gs.fuel < 40 && !testState.returning) {
    const nearestStation = gs.fuelStations
      .filter(s => s.y > player.y)
      .sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.x - player.x, 2) + Math.pow(a.y - player.y, 2));
        const distB = Math.sqrt(Math.pow(b.x - player.x, 2) + Math.pow(b.y - player.y, 2));
        return distA - distB;
      })[0];
    
    if (nearestStation) {
      testState.targetStation = nearestStation;
      
      const dx = nearestStation.x - player.x;
      const dy = nearestStation.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 30 && Math.abs(player.vy) < 1) {
        // Landing
        return {
          space: true,
          left: dx < -5,
          right: dx > 5,
          up: dy > 0 && player.vy > -0.5
        };
      }
      
      return {
        left: dx < -10,
        right: dx > 10,
        up: dy > 5 || player.vy > 1,
        space: dist < 50
      };
    }
  }
  
  // Find nearest uncollected gem
  const nearestGem = gs.gems
    .filter(g => !g.collected)
    .sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.x - player.x, 2) + Math.pow(a.y - player.y, 2));
      const distB = Math.sqrt(Math.pow(b.x - player.x, 2) + Math.pow(b.y - player.y, 2));
      return distA - distB;
    })[0];
  
  if (nearestGem) {
    testState.targetGem = nearestGem;
    
    const dx = nearestGem.x - player.x;
    const dy = nearestGem.y - player.y;
    
    return {
      left: dx < -5,
      right: dx > 5,
      up: dy > 10 || player.vy > 2,
      shift: Math.abs(dx) > 100 || Math.abs(dy) > 100
    };
  }
  
  // No gems left, return to surface
  testState.returning = true;
  return {
    up: true,
    left: player.x > 300,
    right: player.x < 300
  };
}

function getTestMovementAction(gs) {
  const player = gs.player;
  if (!player) return {};
  
  const time = gs.framesSinceStart;
  
  // Test different movement patterns
  if (time < 60) {
    return { up: true };
  } else if (time < 120) {
    return { left: true, up: true };
  } else if (time < 180) {
    return { right: true, up: true };
  } else if (time < 240) {
    return { up: true, shift: true };
  }
  
  return {};
}

function getTestCollisionAction(gs) {
  const player = gs.player;
  if (!player) return {};
  
  // Move towards walls to test collision
  if (player.x < 300) {
    return { left: true };
  } else {
    return { right: true };
  }
}

function getTestFuelAction(gs) {
  const player = gs.player;
  if (!player) return {};
  
  // Continuously thrust to test fuel depletion
  if (gs.fuel > 0) {
    return { up: true, shift: true };
  }
  
  return {};
}

function getTestGemCollectionAction(gs) {
  const player = gs.player;
  if (!player) return {};
  
  // Navigate to nearest gem
  const nearestGem = gs.gems
    .filter(g => !g.collected)
    .sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.x - player.x, 2) + Math.pow(a.y - player.y, 2));
      const distB = Math.sqrt(Math.pow(b.x - player.x, 2) + Math.pow(b.y - player.y, 2));
      return distA - distB;
    })[0];
  
  if (nearestGem) {
    const dx = nearestGem.x - player.x;
    const dy = nearestGem.y - player.y;
    
    return {
      left: dx < -10,
      right: dx > 10,
      up: dy > 10 || player.vy > 2
    };
  }
  
  return {};
}

function getRandomAction(gs) {
  const actions = ['up', 'left', 'right', 'shift'];
  const action = {};
  
  for (let a of actions) {
    action[a] = Math.random() < 0.1;
  }
  
  return action;
}

export function get_automated_testing_action(gs) {
  switch (gs.controlMode) {
    case "TEST_1":
      return getTestMovementAction(gs);
    case "TEST_2":
      return getTestWinAction(gs);
    case "TEST_3":
      return getTestCollisionAction(gs);
    case "TEST_4":
      return getTestFuelAction(gs);
    case "TEST_5":
      return getTestGemCollectionAction(gs);
    default:
      return getRandomAction(gs);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;