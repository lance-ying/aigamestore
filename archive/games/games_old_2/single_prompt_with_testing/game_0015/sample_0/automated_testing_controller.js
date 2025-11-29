// automated_testing_controller.js - Automated testing AI

import { GAME_PHASES } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Navigate to all clue locations systematically, then to exit
  
  const clueTargets = [
    { x: -200, z: -200, name: "NW clue" },
    { x: 200, z: -200, name: "NE clue" },
    { x: -200, z: 200, name: "SW clue" },
    { x: 200, z: 200, name: "SE clue" },
    { x: 0, z: -230, name: "North clue" }
  ];
  
  const exitTarget = { x: 0, z: 250, name: "Exit" };
  
  // Determine current target
  let target = null;
  
  if (gameState.cluesCollected < 5) {
    // Find nearest uncollected clue
    for (let clueTarget of clueTargets) {
      const hasClueNearby = gameState.interactables.some(obj => 
        obj.type === 'clue' && 
        !obj.collected &&
        Math.abs(obj.x - clueTarget.x) < 50 &&
        Math.abs(obj.z - clueTarget.z) < 50
      );
      
      if (hasClueNearby) {
        target = clueTarget;
        break;
      }
    }
  } else {
    target = exitTarget;
  }
  
  if (!target) {
    target = exitTarget;
  }
  
  return navigateToTarget(gameState, target);
}

function getTestBasicAction(gameState) {
  // Test basic movement and interactions
  const frameCount = gameState.timeElapsed || 0;
  
  // Simple patrol pattern
  if (frameCount < 100) {
    return { forward: true };
  } else if (frameCount < 120) {
    return { right: true };
  } else if (frameCount < 220) {
    return { forward: true };
  } else if (frameCount < 240) {
    return { right: true };
  } else if (frameCount < 260) {
    return { interact: true };
  } else if (frameCount < 280) {
    return { toggleFlashlight: true };
  }
  
  return { forward: true };
}

function getTestInteractionAction(gameState) {
  // Navigate to nearest interactable and interact
  if (gameState.nearbyObject && !gameState.nearbyObject.collected) {
    return { interact: true };
  }
  
  // Find nearest interactable
  let nearest = null;
  let minDist = Infinity;
  
  for (let obj of gameState.interactables) {
    if (obj.collected) continue;
    
    const dist = Math.sqrt(
      Math.pow(gameState.player.x - obj.x, 2) +
      Math.pow(gameState.player.z - obj.z, 2)
    );
    
    if (dist < minDist) {
      minDist = dist;
      nearest = obj;
    }
  }
  
  if (nearest) {
    return navigateToTarget(gameState, { x: nearest.x, z: nearest.z });
  }
  
  return { forward: true };
}

function getTestFlashlightAction(gameState) {
  // Test flashlight in dark areas
  const frameCount = gameState.timeElapsed || 0;
  
  if (frameCount % 200 === 0) {
    return { toggleFlashlight: true };
  }
  
  return getTestBasicAction(gameState);
}

function getTestSprintAction(gameState) {
  // Test sprint mechanics
  return { forward: true, sprint: true };
}

function navigateToTarget(gameState, target) {
  const player = gameState.player;
  if (!player) return { forward: true };
  
  const dx = target.x - player.x;
  const dz = target.z - player.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  // If close enough, try to interact
  if (distance < 50) {
    if (gameState.nearbyObject) {
      return { interact: true };
    }
  }
  
  // Calculate angle to target
  const targetAngle = Math.atan2(dz, dx);
  let angleDiff = targetAngle - player.angle;
  
  // Normalize angle difference
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  
  // Turn towards target
  if (Math.abs(angleDiff) > 0.1) {
    if (angleDiff > 0) {
      return { right: true };
    } else {
      return { left: true };
    }
  }
  
  // Move forward with sprint if far
  return { forward: true, sprint: distance > 100 };
}

function getRandomAction(gameState) {
  const actions = ['forward', 'backward', 'left', 'right', 'interact'];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  
  return {
    forward: randomAction === 'forward',
    backward: randomAction === 'backward',
    left: randomAction === 'left',
    right: randomAction === 'right',
    interact: randomAction === 'interact'
  };
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestInteractionAction(gameState);
    case "TEST_4":
      return getTestFlashlightAction(gameState);
    case "TEST_5":
      return getTestSprintAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;