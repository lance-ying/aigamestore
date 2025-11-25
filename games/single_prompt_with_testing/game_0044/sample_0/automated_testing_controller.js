// automated_testing_controller.js - Automated testing functions

import { gameState, REQUEST_TYPES } from './globals.js';

let positionHistory = [];
let stuckCounter = 0;

function getTestWinAction(gameState) {
  const player = gameState.player;
  if (!player || gameState.requests.length === 0) {
    return { keyCode: null };
  }

  // Find the most urgent request in match zone
  let urgentRequest = null;
  let minDistance = Infinity;

  for (const request of gameState.requests) {
    if (!request.completed && !request.missed && request.isInMatchZone()) {
      const distance = request.x;
      if (distance < minDistance) {
        minDistance = distance;
        urgentRequest = request;
      }
    }
  }

  // If no request in match zone, find the closest upcoming one
  if (!urgentRequest) {
    for (const request of gameState.requests) {
      if (!request.completed && !request.missed && request.x > 100) {
        const distance = request.x;
        if (distance < minDistance) {
          minDistance = distance;
          urgentRequest = request;
        }
      }
    }
  }

  if (!urgentRequest) {
    return { keyCode: null };
  }

  // Determine the action needed
  switch (urgentRequest.type) {
    case REQUEST_TYPES.MOVE_UP:
      if (player.y > 150) return { keyCode: 38 }; // Up
      break;
    case REQUEST_TYPES.MOVE_DOWN:
      if (player.y < 250) return { keyCode: 40 }; // Down
      break;
    case REQUEST_TYPES.MOVE_LEFT:
      if (player.x > 200) return { keyCode: 37 }; // Left
      break;
    case REQUEST_TYPES.MOVE_RIGHT:
      if (player.x < 400) return { keyCode: 39 }; // Right
      break;
    case REQUEST_TYPES.EXPRESSION_HAPPY:
      if (player.expression !== "HAPPY") return { keyCode: 90 }; // Z
      break;
    case REQUEST_TYPES.EXPRESSION_SAD:
      if (player.expression !== "SAD") return { keyCode: 90 }; // Z
      break;
    case REQUEST_TYPES.EXPRESSION_SURPRISED:
      if (player.expression !== "SURPRISED") return { keyCode: 90 }; // Z
      break;
    case REQUEST_TYPES.ACTION:
      if (!player.isPerformingAction) return { keyCode: 32 }; // Space
      break;
  }

  return { keyCode: null };
}

function getBasicTestAction(gameState) {
  const player = gameState.player;
  if (!player) return { keyCode: null };

  const frameCount = gameState.frameCount;

  // Test sequence: move around, change expressions, perform actions
  const cycle = frameCount % 240;

  if (cycle < 40) {
    return { keyCode: 39 }; // Right
  } else if (cycle < 80) {
    return { keyCode: 40 }; // Down
  } else if (cycle < 120) {
    return { keyCode: 37 }; // Left
  } else if (cycle < 160) {
    return { keyCode: 38 }; // Up
  } else if (cycle < 180) {
    return { keyCode: 90 }; // Z - change expression
  } else if (cycle < 200) {
    return { keyCode: 32 }; // Space - action
  } else if (cycle < 220) {
    return { keyCode: 16 }; // Shift - zoom
  }

  return { keyCode: null };
}

function getStressTestAction(gameState) {
  // Rapidly change between different actions
  const actions = [37, 38, 39, 40, 90, 32, 16];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  return { keyCode: randomAction };
}

function getRandomAction(gameState) {
  if (Math.random() < 0.7) {
    return { keyCode: null };
  }

  const actions = [37, 38, 39, 40, 90, 32];
  const randomAction = actions[Math.floor(Math.random() * actions.length)];
  return { keyCode: randomAction };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getStressTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;