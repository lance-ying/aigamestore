// automated_testing_controller.js - Automated testing
import { gameState, SHAPE_TALL, SHAPE_SHORT } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player || gameState.obstacles.length === 0) {
    return { keyCode: 38 }; // Default to tall
  }
  
  // Find the next obstacle ahead of the player
  let nextObstacle = null;
  for (let obstacle of gameState.obstacles) {
    if (obstacle.x > gameState.player.x && !obstacle.passed) {
      nextObstacle = obstacle;
      break;
    }
  }
  
  if (!nextObstacle) {
    return { keyCode: 38 }; // Default to tall
  }
  
  // Calculate optimal shape based on gap position
  const gapCenter = nextObstacle.gapY + nextObstacle.gapSize / 2;
  const canvasCenter = 200; // CANVAS_HEIGHT / 2
  
  // Predict if tall or short shape fits better
  const tallHeight = 60;
  const shortHeight = 30;
  
  // Check if we need to change shape preemptively
  const distanceToObstacle = nextObstacle.x - gameState.player.x;
  const reactionDistance = 100; // Start changing shape when this close
  
  if (distanceToObstacle < reactionDistance) {
    // Determine which shape fits the gap better
    const gapTop = nextObstacle.gapY;
    const gapBottom = nextObstacle.gapY + nextObstacle.gapSize;
    const playerTop = canvasCenter - (gameState.player.shape === SHAPE_TALL ? tallHeight : shortHeight) / 2;
    const playerBottom = canvasCenter + (gameState.player.shape === SHAPE_TALL ? tallHeight : shortHeight) / 2;
    
    // Check if current shape fits
    const tallWouldFit = (canvasCenter - tallHeight / 2 >= gapTop) && 
                         (canvasCenter + tallHeight / 2 <= gapBottom);
    const shortWouldFit = (canvasCenter - shortHeight / 2 >= gapTop) && 
                          (canvasCenter + shortHeight / 2 <= gapBottom);
    
    // If gap is in upper half, use short shape
    if (gapCenter < canvasCenter - 20) {
      return { keyCode: 40 }; // SHORT
    }
    // If gap is in lower half, use short shape
    else if (gapCenter > canvasCenter + 20) {
      return { keyCode: 40 }; // SHORT
    }
    // If gap is centered and large enough, use tall
    else if (tallWouldFit) {
      return { keyCode: 38 }; // TALL
    }
    // Otherwise use short
    else {
      return { keyCode: 40 }; // SHORT
    }
  }
  
  // Default behavior when far from obstacles
  return { keyCode: 38 }; // TALL
}

function getRandomTestAction(gameState) {
  if (!gameState.player) {
    return { keyCode: 38 };
  }
  
  // Random shape changes
  if (Math.random() < 0.1) {
    return { keyCode: Math.random() < 0.5 ? 38 : 40 };
  }
  
  return null;
}

function getComboTestAction(gameState) {
  // Similar to win test but focuses on maintaining combo
  return getTestWinAction(gameState);
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getRandomTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getComboTestAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;