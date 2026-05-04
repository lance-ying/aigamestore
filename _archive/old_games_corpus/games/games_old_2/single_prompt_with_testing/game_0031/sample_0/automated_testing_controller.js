// automated_testing_controller.js - Automated testing logic
import { gameState } from './globals.js';

function getTestBasicAction(gameState) {
  // TEST_1: Basic movement testing
  const frame = gameState.player?.p?.frameCount || 0;
  
  // Simple pattern: drive forward and turn
  if (frame < 120) {
    return { up: true, left: false, right: false, down: false, space: false, shift: false };
  } else if (frame < 180) {
    return { up: true, left: false, right: true, down: false, space: false, shift: false };
  } else if (frame < 300) {
    return { up: true, left: false, right: false, down: false, space: false, shift: false };
  } else if (frame < 360) {
    return { up: true, left: true, right: false, down: false, space: false, shift: false };
  } else {
    return { up: true, left: false, right: false, down: false, space: false, shift: false };
  }
}

function getTestWinAction(gameState) {
  // TEST_2: Complete a route successfully
  if (!gameState.player || !gameState.currentRoute) {
    return { up: false, left: false, right: false, down: false, space: false, shift: false };
  }

  const bus = gameState.player;
  const currentStop = gameState.currentRoute[gameState.routeProgress];
  
  if (!currentStop) {
    return { up: false, left: false, right: false, down: false, space: false, shift: false };
  }

  // Calculate direction to next stop
  const dx = currentStop.x - bus.x;
  const dy = currentStop.y - bus.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const targetAngle = Math.atan2(dy, dx);
  
  let angleDiff = targetAngle - bus.angle;
  
  // Normalize angle difference
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
  
  // At stop - wait for passenger exchange
  if (gameState.atStop) {
    return { up: false, left: false, right: false, down: false, space: false, shift: false };
  }
  
  // Near stop - slow down
  if (distance < 40) {
    return {
      up: false,
      down: Math.abs(bus.speed) > 0.3,
      left: angleDiff < -0.1,
      right: angleDiff > 0.1,
      space: Math.abs(bus.speed) > 1,
      shift: false
    };
  }
  
  // Navigate to stop
  return {
    up: true,
    down: false,
    left: angleDiff < -0.05,
    right: angleDiff > 0.05,
    space: false,
    shift: distance < 100
  };
}

function getTestNavigationAction(gameState) {
  // TEST_3: Test various navigation scenarios
  if (!gameState.player) {
    return { up: false, left: false, right: false, down: false, space: false, shift: false };
  }

  const frame = gameState.player.p?.frameCount || 0;
  const phase = Math.floor(frame / 180) % 4;
  
  switch (phase) {
    case 0: // Drive straight
      return { up: true, left: false, right: false, down: false, space: false, shift: false };
    case 1: // Turn left
      return { up: true, left: true, right: false, down: false, space: false, shift: false };
    case 2: // Emergency brake test
      return { up: false, left: false, right: false, down: false, space: true, shift: false };
    case 3: // Turn right
      return { up: true, left: false, right: true, down: false, space: false, shift: true };
    default:
      return { up: true, left: false, right: false, down: false, space: false, shift: false };
  }
}

function getRandomAction(gameState) {
  // Random movements for unspecified test modes
  const rand = Math.random();
  return {
    up: rand > 0.3,
    down: rand < 0.1,
    left: rand > 0.7,
    right: rand > 0.8,
    space: rand > 0.95,
    shift: rand > 0.9
  };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestNavigationAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;