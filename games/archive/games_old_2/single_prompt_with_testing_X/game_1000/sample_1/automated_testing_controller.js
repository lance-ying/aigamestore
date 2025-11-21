import { gameState, CONTAINER_X, CONTAINER_WIDTH, FRUIT_TYPES } from './globals.js';

let testState = {
  strategy: "build_stacks",
  dropColumn: "left",
  waitFrames: 0,
  lastFruitCount: 0,
  positionHistory: [],
  stuckCounter: 0,
  targetX: CONTAINER_X + CONTAINER_WIDTH * 0.3
};

function getTestWinAction(gameState) {
  // Strategy: Build balanced stacks, wait for merges, create watermelon
  
  if (!gameState.canDrop) {
    return { action: "wait" };
  }
  
  // Wait for fruits to settle
  if (!gameState.fruitsSettled && gameState.entities.length > 2) {
    testState.waitFrames++;
    if (testState.waitFrames < 40) {
      return { action: "wait" };
    }
  }
  testState.waitFrames = 0;
  
  // Detect if stuck
  if (gameState.entities.length === testState.lastFruitCount) {
    testState.stuckCounter++;
  } else {
    testState.stuckCounter = 0;
    testState.lastFruitCount = gameState.entities.length;
  }
  
  // If stuck for too long, try different strategy
  if (testState.stuckCounter > 10) {
    testState.stuckCounter = 0;
    testState.dropColumn = testState.dropColumn === "left" ? "right" : "left";
  }
  
  // Determine drop position based on current fruits
  let targetX = CONTAINER_X + CONTAINER_WIDTH / 2;
  
  if (gameState.entities.length > 0) {
    // Find matching fruit type to drop on
    const previewType = gameState.previewFruit?.type;
    const matchingFruits = gameState.entities.filter(f => f.type === previewType);
    
    if (matchingFruits.length > 0) {
      // Drop on matching fruit
      matchingFruits.sort((a, b) => a.y - b.y);
      targetX = matchingFruits[0].x;
    } else {
      // Alternate between left and right columns
      if (testState.dropColumn === "left") {
        targetX = CONTAINER_X + CONTAINER_WIDTH * 0.3;
      } else {
        targetX = CONTAINER_X + CONTAINER_WIDTH * 0.7;
      }
    }
  }
  
  targetX = Math.max(CONTAINER_X + 30, Math.min(CONTAINER_X + CONTAINER_WIDTH - 30, targetX));
  
  // Move towards target
  const currentX = gameState.previewX;
  const diff = targetX - currentX;
  
  if (Math.abs(diff) > 5) {
    return { action: diff > 0 ? "right" : "left" };
  } else {
    testState.dropColumn = testState.dropColumn === "left" ? "right" : "left";
    return { action: "drop" };
  }
}

function getTestMovementAction(gameState) {
  // Test movement by sweeping left and right
  
  if (!testState.sweepDirection) {
    testState.sweepDirection = "right";
    testState.sweepCount = 0;
  }
  
  const minX = CONTAINER_X + 30;
  const maxX = CONTAINER_X + CONTAINER_WIDTH - 30;
  
  if (testState.sweepDirection === "right") {
    if (gameState.previewX < maxX) {
      return { action: "right" };
    } else {
      testState.sweepDirection = "left";
      if (gameState.canDrop) {
        testState.sweepCount++;
        return { action: "drop" };
      }
    }
  } else {
    if (gameState.previewX > minX) {
      return { action: "left" };
    } else {
      testState.sweepDirection = "right";
      if (gameState.canDrop && testState.sweepCount < 5) {
        testState.sweepCount++;
        return { action: "drop" };
      }
    }
  }
  
  return { action: "wait" };
}

function getTestGameOverAction(gameState) {
  // Fill one column to trigger game over
  
  if (!gameState.canDrop) {
    return { action: "wait" };
  }
  
  const targetX = CONTAINER_X + CONTAINER_WIDTH / 2;
  const currentX = gameState.previewX;
  const diff = targetX - currentX;
  
  if (Math.abs(diff) > 3) {
    return { action: diff > 0 ? "right" : "left" };
  } else {
    return { action: "drop" };
  }
}

function getTestMergeAction(gameState) {
  // Create specific merge scenarios
  
  if (!gameState.canDrop) {
    return { action: "wait" };
  }
  
  if (!testState.mergePhase) {
    testState.mergePhase = 0;
    testState.dropX = CONTAINER_X + CONTAINER_WIDTH * 0.4;
  }
  
  // Drop pairs of same fruits close together
  const targetX = testState.dropX;
  const currentX = gameState.previewX;
  const diff = targetX - currentX;
  
  if (Math.abs(diff) > 5) {
    return { action: diff > 0 ? "right" : "left" };
  } else {
    testState.mergePhase++;
    if (testState.mergePhase % 2 === 0) {
      testState.dropX = CONTAINER_X + CONTAINER_WIDTH * (0.4 + Math.random() * 0.2);
    }
    return { action: "drop" };
  }
}

function getRandomAction(gameState) {
  // Random actions for basic testing
  
  if (!gameState.canDrop) {
    return { action: "wait" };
  }
  
  const rand = Math.random();
  if (rand < 0.3) {
    return { action: "left" };
  } else if (rand < 0.6) {
    return { action: "right" };
  } else {
    return { action: "drop" };
  }
}

export function get_automated_testing_action(gameState) {
  let action;
  
  switch (gameState.controlMode) {
    case "TEST_1":
      action = getTestWinAction(gameState);
      break;
    case "TEST_2":
      action = getTestMovementAction(gameState);
      break;
    case "TEST_3":
      action = getTestGameOverAction(gameState);
      break;
    case "TEST_4":
      action = getTestMergeAction(gameState);
      break;
    default:
      action = getRandomAction(gameState);
  }
  
  return action;
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;