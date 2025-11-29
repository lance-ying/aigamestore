// automated_testing_controller.js - Automated testing logic

import { gameState, ENTITY_TYPES, RESOURCE_TYPES } from './globals.js';

let testState = {
  targetEntity: null,
  avoidanceMode: false,
  buildHabitatNext: false,
  resourceCollectionPhase: true,
  lastPosition: { x: 0, y: 0 },
  stuckCounter: 0,
  lastActions: []
};

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player) return [];
  
  // Priority 1: Survival (oxygen/temperature)
  if (player.oxygen < 40 || player.temperature < 40) {
    return goToSafety(gameState);
  }
  
  // Priority 2: Avoid leviathans
  const nearbyLeviathan = findNearbyLeviathan(gameState);
  if (nearbyLeviathan) {
    return evadeLeviathan(gameState, nearbyLeviathan);
  }
  
  // Priority 3: Collect artifacts (main objective)
  if (gameState.artifactsCollected < gameState.totalArtifacts) {
    const artifact = findNearestArtifact(gameState);
    if (artifact) {
      return moveTowardsAndCollect(gameState, artifact);
    }
  }
  
  // Priority 4: Build habitats if we have resources
  if (shouldBuildHabitat(gameState)) {
    return [90]; // Z key to build
  }
  
  // Priority 5: Collect resources
  const resource = findNearestResource(gameState);
  if (resource) {
    return moveTowardsAndCollect(gameState, resource);
  }
  
  // Default: explore
  return exploreWorld(gameState);
}

function getTestMovementAction(gameState) {
  const player = gameState.player;
  if (!player) return [];
  
  const actions = [];
  
  // Test all directions
  const cycle = Math.floor(gameState.frameCount / 60) % 4;
  switch (cycle) {
    case 0: actions.push(39); break; // RIGHT
    case 1: actions.push(40); break; // DOWN
    case 2: actions.push(37); break; // LEFT
    case 3: actions.push(38); break; // UP
  }
  
  // Occasionally sprint
  if (gameState.frameCount % 120 < 60) {
    actions.push(16); // Shift
  }
  
  return actions;
}

function getTestSurvivalAction(gameState) {
  const player = gameState.player;
  if (!player) return [];
  
  // Test oxygen management
  if (player.oxygen < 50) {
    return goToSafety(gameState);
  }
  
  // Test habitat building
  if (shouldBuildHabitat(gameState) && gameState.habitats.length < 2) {
    // Collect resources first
    const resource = findNearestResource(gameState);
    if (resource) {
      const actions = moveTowardsAndCollect(gameState, resource);
      if (isNear(player, resource, 40)) {
        actions.push(32); // Space
      }
      return actions;
    }
    return [90]; // Build
  }
  
  // Move to cold areas to test temperature
  return moveToTarget(gameState, { x: 300, y: 600 });
}

function getTestEnemyAction(gameState) {
  const player = gameState.player;
  if (!player) return [];
  
  // Move towards dangerous areas
  const leviathan = gameState.entities.find(e => e.type === ENTITY_TYPES.LEVIATHAN);
  if (leviathan) {
    // Get close but not too close
    const dist = Math.sqrt((player.x - leviathan.x) ** 2 + (player.y - leviathan.y) ** 2);
    if (dist > 100) {
      return moveToTarget(gameState, leviathan);
    } else {
      return evadeLeviathan(gameState, leviathan);
    }
  }
  
  return exploreWorld(gameState);
}

// Helper functions
function findNearestArtifact(gameState) {
  const player = gameState.player;
  let nearest = null;
  let minDist = Infinity;
  
  gameState.entities.forEach(entity => {
    if (entity.type === ENTITY_TYPES.ARTIFACT && !entity.collected) {
      const dist = Math.sqrt((player.x - entity.x) ** 2 + (player.y - entity.y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = entity;
      }
    }
  });
  
  return nearest;
}

function findNearestResource(gameState) {
  const player = gameState.player;
  let nearest = null;
  let minDist = Infinity;
  
  gameState.entities.forEach(entity => {
    if (entity.type === ENTITY_TYPES.RESOURCE && !entity.collected) {
      const dist = Math.sqrt((player.x - entity.x) ** 2 + (player.y - entity.y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        nearest = entity;
      }
    }
  });
  
  return nearest;
}

function findNearbyLeviathan(gameState) {
  const player = gameState.player;
  
  for (let entity of gameState.entities) {
    if (entity.type === ENTITY_TYPES.LEVIATHAN) {
      const dist = Math.sqrt((player.x - entity.x) ** 2 + (player.y - entity.y) ** 2);
      if (dist < 180) {
        return entity;
      }
    }
  }
  
  return null;
}

function moveTowardsAndCollect(gameState, target) {
  const player = gameState.player;
  const actions = moveToTarget(gameState, target);
  
  if (isNear(player, target, 40)) {
    actions.push(32); // Space to collect
  }
  
  return actions;
}

function moveToTarget(gameState, target) {
  const player = gameState.player;
  const actions = [];
  
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  
  if (Math.abs(dx) > 10) {
    actions.push(dx > 0 ? 39 : 37); // RIGHT or LEFT
  }
  
  if (Math.abs(dy) > 10) {
    actions.push(dy > 0 ? 40 : 38); // DOWN or UP
  }
  
  // Sprint if far away and oxygen is okay
  if ((Math.abs(dx) > 100 || Math.abs(dy) > 100) && player.oxygen > 60) {
    actions.push(16); // Shift
  }
  
  return actions;
}

function evadeLeviathan(gameState, leviathan) {
  const player = gameState.player;
  const actions = [];
  
  // Move away from leviathan
  const dx = player.x - leviathan.x;
  const dy = player.y - leviathan.y;
  
  if (dx !== 0) {
    actions.push(dx > 0 ? 39 : 37); // Move away in x
  }
  if (dy !== 0) {
    actions.push(dy > 0 ? 40 : 38); // Move away in y
  }
  
  actions.push(16); // Sprint!
  
  return actions;
}

function goToSafety(gameState) {
  const player = gameState.player;
  
  // Go to nearest habitat
  if (gameState.habitats.length > 0) {
    const nearest = gameState.habitats.reduce((closest, habitat) => {
      const dist = Math.sqrt((player.x - habitat.x) ** 2 + (player.y - habitat.y) ** 2);
      const closestDist = Math.sqrt((player.x - closest.x) ** 2 + (player.y - closest.y) ** 2);
      return dist < closestDist ? habitat : closest;
    });
    return moveToTarget(gameState, nearest);
  }
  
  // Go to surface (safe shallows)
  return moveToTarget(gameState, { x: 300, y: 100 });
}

function shouldBuildHabitat(gameState) {
  return gameState.resources.TITANIUM >= 2 &&
         gameState.resources.COPPER >= 1 &&
         gameState.resources.QUARTZ >= 1 &&
         gameState.habitats.length < 3;
}

function isNear(entity1, entity2, range) {
  const dist = Math.sqrt((entity1.x - entity2.x) ** 2 + (entity1.y - entity2.y) ** 2);
  return dist < range;
}

function exploreWorld(gameState) {
  const player = gameState.player;
  const cycle = Math.floor(gameState.frameCount / 120) % 6;
  
  const explorationTargets = [
    { x: 300, y: 200 },   // Safe shallows
    { x: 900, y: 200 },   // Twisty bridges
    { x: 1500, y: 200 },  // Crystal caverns
    { x: 300, y: 600 },   // Glacial basin
    { x: 900, y: 600 },   // Thermal vents
    { x: 1500, y: 600 }   // Deep trench
  ];
  
  return moveToTarget(gameState, explorationTargets[cycle]);
}

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40]; // Arrow keys
  const randomKey = actions[Math.floor(Math.random() * actions.length)];
  return [randomKey];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestMovementAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestSurvivalAction(gameState);
    case "TEST_4":
      return getTestEnemyAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;