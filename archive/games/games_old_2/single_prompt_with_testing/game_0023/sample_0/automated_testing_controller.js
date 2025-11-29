import {
  gameState,
  KEY_ARROW_UP,
  KEY_ARROW_DOWN
} from './globals.js';

function getTestWinAction(gameState) {
  // Optimal strategy: always press UP (correct) as fast as possible
  // Add small delay to make it realistic
  if (gameState.framesSinceLastAction > 15) { // ~0.25 seconds at 60fps
    return { keyCode: KEY_ARROW_UP };
  }
  return null;
}

function getBasicTestAction(gameState) {
  // Alternate between correct and skip with varying delays
  const timeSinceAction = gameState.framesSinceLastAction;
  
  if (timeSinceAction > 30) { // ~0.5 seconds
    // Alternate based on total cards shown
    if (gameState.totalCardsShown % 2 === 0) {
      return { keyCode: KEY_ARROW_UP };
    } else {
      return { keyCode: KEY_ARROW_DOWN };
    }
  }
  return null;
}

function getSkipHeavyAction(gameState) {
  // Skip most cards, occasionally answer correctly
  const timeSinceAction = gameState.framesSinceLastAction;
  
  if (timeSinceAction > 25) {
    // 75% skip, 25% correct
    if (gameState.totalCardsShown % 4 === 0) {
      return { keyCode: KEY_ARROW_UP };
    } else {
      return { keyCode: KEY_ARROW_DOWN };
    }
  }
  return null;
}

function getRandomAction(gameState) {
  const timeSinceAction = gameState.framesSinceLastAction;
  
  if (timeSinceAction > 20) {
    const rand = Math.random();
    if (rand < 0.6) {
      return { keyCode: KEY_ARROW_UP };
    } else {
      return { keyCode: KEY_ARROW_DOWN };
    }
  }
  return null;
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getSkipHeavyAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;