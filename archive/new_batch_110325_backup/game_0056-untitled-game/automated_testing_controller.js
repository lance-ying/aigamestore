// automated_testing_controller.js - Automated testing strategies

import { gameState } from './globals.js';
import { gridDistance } from './utils.js';
import {
  ENTITY_GIRL, ENTITY_LANTERN, ENTITY_STELE, ENTITY_CRYSTAL,
  ENTITY_PLATFORM, ENTITY_ROBOT, ENTITY_CORE, ENTITY_EXIT
} from './globals.js';

let testState = {
  strategy: 'explore',
  targetEntity: null,
  actionQueue: [],
  visitedPositions: new Set(),
  stuckCounter: 0,
  lastPosition: null
};

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player || player.isMoving) return null;

  // Check if level is complete
  if (gameState.levelComplete) {
    return null;
  }

  // Strategy: Activate lights in order, collect items, reach exit
  const entities = gameState.entities;

  // 1. Find and activate all light sources (lanterns, steles, crystals) that reduce water
  const inactiveLights = entities.filter(e =>
    (e.type === ENTITY_LANTERN || e.type === ENTITY_STELE || e.type === ENTITY_CRYSTAL) &&
    !e.active &&
    e.isAccessible(gameState.waterLevel) &&
    e.waterReduction !== undefined
  );

  if (inactiveLights.length > 0) {
    // Sort by water reduction (activate those that reduce water most first)
    inactiveLights.sort((a, b) => a.waterReduction - b.waterReduction);
    const target = inactiveLights[0];

    // Move to target if not there
    if (player.gridX !== target.gridX || player.gridY !== target.gridY) {
      return { move: { x: target.gridX, y: target.gridY } };
    } else {
      return { activate: true };
    }
  }

  // 2. Collect accessible cores
  const uncollectedCores = entities.filter(e =>
    e.type === ENTITY_CORE &&
    !e.collected &&
    e.isAccessible(gameState.waterLevel)
  );

  if (uncollectedCores.length > 0) {
    // Find nearest core
    let nearest = uncollectedCores[0];
    let minDist = gridDistance(player.gridX, player.gridY, nearest.gridX, nearest.gridY);

    for (const core of uncollectedCores) {
      const dist = gridDistance(player.gridX, player.gridY, core.gridX, core.gridY);
      if (dist < minDist) {
        minDist = dist;
        nearest = core;
      }
    }

    if (player.gridX !== nearest.gridX || player.gridY !== nearest.gridY) {
      return { move: { x: nearest.gridX, y: nearest.gridY } };
    } else {
      return { activate: true };
    }
  }

  // 3. Activate accessible robots
  const inactiveRobots = entities.filter(e =>
    e.type === ENTITY_ROBOT &&
    !e.active &&
    e.isAccessible(gameState.waterLevel)
  );

  if (inactiveRobots.length > 0) {
    const target = inactiveRobots[0];
    if (player.gridX !== target.gridX || player.gridY !== target.gridY) {
      return { move: { x: target.gridX, y: target.gridY } };
    } else {
      return { activate: true };
    }
  }

  // 4. Move to exit
  const exit = entities.find(e => e.type === ENTITY_EXIT);
  if (exit && exit.isAccessible(gameState.waterLevel)) {
    if (player.gridX !== exit.gridX || player.gridY !== exit.gridY) {
      return { move: { x: exit.gridX, y: exit.gridY } };
    } else {
      return { activate: true };
    }
  }

  // Fallback: try to activate any nearby platform or switch
  const platforms = entities.filter(e =>
    e.type === ENTITY_PLATFORM &&
    !e.active &&
    e.isAccessible(gameState.waterLevel)
  );

  if (platforms.length > 0) {
    const target = platforms[0];
    if (player.gridX !== target.gridX || player.gridY !== target.gridY) {
      return { move: { x: target.gridX, y: target.gridY } };
    } else {
      return { activate: true };
    }
  }

  return null;
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player || player.isMoving) return null;

  // Simple test: move around and interact with nearby entities
  const entities = gameState.entities;
  const interactableTypes = [ENTITY_LANTERN, ENTITY_STELE, ENTITY_CRYSTAL, ENTITY_CORE, ENTITY_EXIT];

  // Find nearest interactable entity
  let nearest = null;
  let minDist = Infinity;

  for (const entity of entities) {
    if (interactableTypes.includes(entity.type) && entity.isAccessible(gameState.waterLevel)) {
      const dist = gridDistance(player.gridX, player.gridY, entity.gridX, entity.gridY);
      if (dist < minDist) {
        minDist = dist;
        nearest = entity;
      }
    }
  }

  if (nearest) {
    if (player.gridX !== nearest.gridX || player.gridY !== nearest.gridY) {
      return { move: { x: nearest.gridX, y: nearest.gridY } };
    } else {
      return { activate: true };
    }
  }

  // Random movement if stuck
  const directions = [
    { x: player.gridX + 1, y: player.gridY },
    { x: player.gridX - 1, y: player.gridY },
    { x: player.gridX, y: player.gridY + 1 },
    { x: player.gridX, y: player.gridY - 1 }
  ];

  const validMoves = directions.filter(pos =>
    pos.x >= 0 && pos.x <= 10 && pos.y >= 0 && pos.y <= 7
  );

  if (validMoves.length > 0) {
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    return { move: { x: randomMove.x, y: randomMove.y } };
  }

  return null;
}

function getRandomAction(gameState) {
  const player = gameState.player;
  if (!player || player.isMoving) return null;

  // Random walk
  const directions = [
    { x: player.gridX + 1, y: player.gridY },
    { x: player.gridX - 1, y: player.gridY },
    { x: player.gridX, y: player.gridY + 1 },
    { x: player.gridX, y: player.gridY - 1 }
  ];

  const validMoves = directions.filter(pos =>
    pos.x >= 1 && pos.x <= 9 && pos.y >= 1 && pos.y <= 6
  );

  if (validMoves.length > 0 && Math.random() < 0.7) {
    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    return { move: { x: randomMove.x, y: randomMove.y } };
  }

  if (Math.random() < 0.3) {
    return { activate: true };
  }

  return null;
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

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;