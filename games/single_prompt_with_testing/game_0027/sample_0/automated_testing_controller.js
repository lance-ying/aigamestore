// automated_testing_controller.js - Automated testing

import { gameState, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN } from './globals.js';
import { PHASE_PLAYING } from './globals.js';
import { getObjectsAt } from './movement.js';

let testState = {
  moveHistory: [],
  stuckCounter: 0,
  currentPlan: [],
  planIndex: 0
};

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }

  // Find player position
  let playerPos = null;
  for (const entity of gameState.entities) {
    if (!entity.deleted && gameState.playerControlledTypes.includes(entity.type)) {
      playerPos = { x: entity.gridX, y: entity.gridY };
      break;
    }
  }

  if (!playerPos) {
    return null;
  }

  // Find win object
  let winPos = null;
  for (const rule of gameState.activeRules) {
    if (rule.property === "WIN") {
      for (const entity of gameState.entities) {
        if (!entity.deleted && entity.type === rule.noun) {
          winPos = { x: entity.gridX, y: entity.gridY };
          break;
        }
      }
    }
  }

  if (!winPos) {
    return getRandomAction(gameState);
  }

  // Simple pathfinding - move towards win object
  const dx = winPos.x - playerPos.x;
  const dy = winPos.y - playerPos.y;

  // Prioritize larger distance
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) return { keyCode: KEY_RIGHT };
    if (dx < 0) return { keyCode: KEY_LEFT };
  } else {
    if (dy > 0) return { keyCode: KEY_DOWN };
    if (dy < 0) return { keyCode: KEY_UP };
  }

  return getRandomAction(gameState);
}

function getMovementTestAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }

  // Test all four directions in sequence
  const moves = [KEY_RIGHT, KEY_DOWN, KEY_LEFT, KEY_UP];
  const moveIndex = Math.floor(gameState.moves / 3) % moves.length;
  return { keyCode: moves[moveIndex] };
}

function getRuleManipulationAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }

  // Find word blocks and try to push them
  if (gameState.wordBlocks.length > 0) {
    const word = gameState.wordBlocks[0];
    let playerPos = null;
    
    for (const entity of gameState.entities) {
      if (!entity.deleted && gameState.playerControlledTypes.includes(entity.type)) {
        playerPos = { x: entity.gridX, y: entity.gridY };
        break;
      }
    }

    if (playerPos) {
      const dx = word.gridX - playerPos.x;
      const dy = word.gridY - playerPos.y;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) return { keyCode: KEY_RIGHT };
        if (dx < 0) return { keyCode: KEY_LEFT };
      } else {
        if (dy > 0) return { keyCode: KEY_DOWN };
        if (dy < 0) return { keyCode: KEY_UP };
      }
    }
  }

  return getRandomAction(gameState);
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return null;
  }

  const actions = [KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN];
  const randomIndex = Math.floor(Math.random() * actions.length);
  return { keyCode: actions[randomIndex] };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getMovementTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getRuleManipulationAction(gameState);
    case "TEST_4":
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