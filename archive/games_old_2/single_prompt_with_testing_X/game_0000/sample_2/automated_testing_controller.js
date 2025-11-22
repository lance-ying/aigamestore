// automated_testing_controller.js
import { gameState, GAME_PHASES } from './globals.js';

let testState = {
  lastActionFrame: 0,
  targetAngle: null,
  positionHistory: [],
  waitingForRetract: false,
  shopVisited: false,
  itemsGrabbed: 0
};

function getTestWinAction(gameState) {
  const currentFrame = window.gameInstance ? window.gameInstance.frameCount : 0;
  
  // Don't act too frequently
  if (currentFrame - testState.lastActionFrame < 10) {
    return null;
  }
  
  if (gameState.gamePhase === GAME_PHASES.SHOP) {
    // Buy strength potion if we have money
    if (gameState.totalMoney >= 200 && gameState.inventory.strength === 0) {
      gameState.shopSelection = 1; // Strength potion
      testState.lastActionFrame = currentFrame;
      return { key: 'ArrowRight', keyCode: 39 };
    }
    // Exit shop
    testState.lastActionFrame = currentFrame;
    return { key: 'Enter', keyCode: 13 };
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const claw = gameState.claw;
  if (!claw) return null;
  
  // If claw is idle, look for best item to grab
  if (claw.state === "IDLE") {
    testState.waitingForRetract = false;
    
    // Find best target (prioritize diamonds and large gold)
    let bestItem = null;
    let bestScore = -1;
    
    for (let item of gameState.items) {
      if (item.grabbed) continue;
      
      // Calculate value per weight ratio
      let valueRatio = item.value / item.weight;
      
      // Avoid rocks unless desperate
      if (item.type === "ROCK") {
        valueRatio *= 0.1;
      }
      
      // Calculate angle to item
      let dx = item.x - claw.baseX;
      let dy = item.y - claw.baseY;
      let targetAngle = Math.atan2(dx, dy);
      
      // Prefer items we can reach easily
      let angleDiff = Math.abs(targetAngle - claw.angle);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      let score = valueRatio * 100 - angleDiff * 20;
      
      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
        testState.targetAngle = targetAngle;
      }
    }
    
    // Drop claw when close to target angle
    if (bestItem && testState.targetAngle !== null) {
      let angleDiff = Math.abs(testState.targetAngle - claw.angle);
      if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
      
      if (angleDiff < 0.15) {
        testState.lastActionFrame = currentFrame;
        testState.waitingForRetract = true;
        testState.itemsGrabbed++;
        return { key: ' ', keyCode: 32 };
      }
    }
  }
  
  // Use dynamite on rocks if we have it
  if (claw.state === "RETRACTING" && claw.grabbedItem) {
    if (claw.grabbedItem.type === "ROCK" && gameState.inventory.dynamite > 0) {
      testState.lastActionFrame = currentFrame;
      return { key: 'z', keyCode: 90 };
    }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  const currentFrame = window.gameInstance ? window.gameInstance.frameCount : 0;
  
  if (currentFrame - testState.lastActionFrame < 40) {
    return null;
  }
  
  if (gameState.gamePhase === GAME_PHASES.SHOP) {
    testState.lastActionFrame = currentFrame;
    return { key: 'Enter', keyCode: 13 };
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const claw = gameState.claw;
  if (!claw) return null;
  
  if (claw.state === "IDLE") {
    // Drop claw periodically
    testState.lastActionFrame = currentFrame;
    return { key: ' ', keyCode: 32 };
  }
  
  return null;
}

function getRandomAction(gameState) {
  const actions = [
    { key: ' ', keyCode: 32, weight: 2 },
    { key: 'z', keyCode: 90, weight: 1 },
    null, null, null // More likely to do nothing
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
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

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;