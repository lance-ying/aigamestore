// automated_testing_controller.js - Automated testing

import { NUM_SEGMENTS } from './globals.js';

// Helper function to find the safest segment
function findSafestSegment(gameState) {
  const segmentDanger = new Array(NUM_SEGMENTS).fill(0);
  
  // Analyze upcoming obstacles
  for (const obstacle of gameState.obstacles) {
    if (obstacle.z > -50 && obstacle.z < 200) {
      const dangerWeight = 1 / (obstacle.z + 1);
      segmentDanger[obstacle.segment] += dangerWeight * 10;
    }
  }
  
  // Find segment with minimum danger
  let minDanger = Infinity;
  let safestSegment = gameState.playerSegment;
  
  for (let i = 0; i < NUM_SEGMENTS; i++) {
    if (segmentDanger[i] < minDanger) {
      minDanger = segmentDanger[i];
      safestSegment = i;
    }
  }
  
  return safestSegment;
}

// Calculate rotation needed to reach target segment
function getRotationToSegment(currentSegment, targetSegment) {
  let diff = targetSegment - currentSegment;
  
  // Choose shortest rotation direction
  if (diff > NUM_SEGMENTS / 2) {
    diff -= NUM_SEGMENTS;
  } else if (diff < -NUM_SEGMENTS / 2) {
    diff += NUM_SEGMENTS;
  }
  
  return diff;
}

// TEST_1: Basic random movement testing
function getRandomAction(gameState) {
  const rand = Math.random();
  
  if (rand < 0.3) {
    return { left: true };
  } else if (rand < 0.6) {
    return { right: true };
  } else if (rand < 0.7) {
    return { flip: true };
  }
  
  return {};
}

// TEST_2: Win strategy - survive 60 seconds
function getWinAction(gameState) {
  const action = {};
  
  // Don't take action during flip animation
  if (gameState.isFlipping) {
    return action;
  }
  
  const safestSegment = findSafestSegment(gameState);
  const rotationNeeded = getRotationToSegment(gameState.playerSegment, safestSegment);
  
  // Calculate effective player segment considering tunnel rotation
  const SEGMENT_ANGLE = (Math.PI * 2) / NUM_SEGMENTS;
  const effectiveSegment = Math.round((-gameState.tunnelRotation / SEGMENT_ANGLE)) % NUM_SEGMENTS;
  const normalizedSegment = effectiveSegment < 0 ? effectiveSegment + NUM_SEGMENTS : effectiveSegment;
  const actualPlayerSegment = (gameState.playerSegment + normalizedSegment) % NUM_SEGMENTS;
  
  // Check for immediate danger
  let immediateDanger = false;
  let dangerSegment = -1;
  
  for (const obstacle of gameState.obstacles) {
    if (obstacle.z > 0 && obstacle.z < 80) {
      if (obstacle.segment === actualPlayerSegment) {
        immediateDanger = true;
        dangerSegment = obstacle.segment;
        break;
      }
    }
  }
  
  // If immediate danger, use flip if it helps, otherwise rotate
  if (immediateDanger) {
    const oppositeSegment = (actualPlayerSegment + NUM_SEGMENTS / 2) % NUM_SEGMENTS;
    
    // Check if opposite segment is safer
    let oppositeSafe = true;
    for (const obstacle of gameState.obstacles) {
      if (obstacle.z > 0 && obstacle.z < 80 && obstacle.segment === oppositeSegment) {
        oppositeSafe = false;
        break;
      }
    }
    
    if (oppositeSafe) {
      action.flip = true;
      return action;
    }
  }
  
  // Rotate toward safest segment
  if (Math.abs(rotationNeeded) > 0.5) {
    if (rotationNeeded > 0) {
      action.right = true;
    } else {
      action.left = true;
    }
  }
  
  return action;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getRandomAction(gameState);
    case "TEST_2":
      return getWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;