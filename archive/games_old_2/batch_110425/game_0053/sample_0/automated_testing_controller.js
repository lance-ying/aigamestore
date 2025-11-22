// automated_testing_controller.js
import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  // Optimal strategy to win the game
  
  // In minigame, perform optimal actions
  if (gameState.minigameActive) {
    if (gameState.minigameType === "SCUBA") {
      // Find nearest uncaught fish and move towards it
      let nearestFish = null;
      let minDist = Infinity;
      
      for (let target of gameState.minigameTargets) {
        if (!target.caught) {
          const dist = Math.sqrt((target.x - gameState.entities[1].cursorX) ** 2 + (target.y - gameState.entities[1].cursorY) ** 2);
          if (dist < minDist) {
            minDist = dist;
            nearestFish = target;
          }
        }
      }
      
      if (nearestFish) {
        const actions = [];
        if (nearestFish.x < gameState.entities[1].cursorX - 5) actions.push(37); // LEFT
        if (nearestFish.x > gameState.entities[1].cursorX + 5) actions.push(39); // RIGHT
        if (nearestFish.y < gameState.entities[1].cursorY - 5) actions.push(38); // UP
        if (nearestFish.y > gameState.entities[1].cursorY + 5) actions.push(40); // DOWN
        if (minDist < 25) actions.push(90); // Z to catch
        return actions;
      }
    } else if (gameState.minigameType === "SANDCASTLE") {
      // Rapidly press Z
      return [90];
    } else if (gameState.minigameType === "SURFING") {
      // Find nearest wave and align with it
      let nearestWave = null;
      let minDist = Infinity;
      
      for (let target of gameState.minigameTargets) {
        if (!target.hit && target.x > 0 && target.x < 600) {
          const dist = Math.abs(target.x - gameState.entities[1].cursorX);
          if (dist < minDist) {
            minDist = dist;
            nearestWave = target;
          }
        }
      }
      
      if (nearestWave) {
        const actions = [];
        if (nearestWave.y < gameState.entities[1].cursorY - 5) actions.push(38); // UP
        if (nearestWave.y > gameState.entities[1].cursorY + 5) actions.push(40); // DOWN
        if (Math.abs(nearestWave.x - gameState.entities[1].cursorX) < 30 && Math.abs(nearestWave.y - gameState.entities[1].cursorY) < 30) {
          actions.push(90); // Z to hit
        }
        return actions;
      }
    }
    return [];
  }
  
  // If not moving and wheel not spinning, spin the wheel
  if (!gameState.moving && !gameState.wheelSpinning) {
    return [32]; // SPACE to spin
  }
  
  return [];
}

function getBasicTestAction(gameState) {
  // Basic movement test - just spin and move
  if (!gameState.moving && !gameState.wheelSpinning && !gameState.minigameActive) {
    return [32]; // SPACE
  }
  
  // In minigames, do random actions
  if (gameState.minigameActive) {
    const actions = [];
    if (Math.random() < 0.3) actions.push(90); // Z
    if (Math.random() < 0.2) actions.push(37 + Math.floor(Math.random() * 4)); // Random arrow
    return actions;
  }
  
  return [];
}

function getRandomAction(gameState) {
  if (Math.random() < 0.05) {
    return [32]; // SPACE occasionally
  }
  return [];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      // Additional test for minigame-specific testing
      if (gameState.minigameActive) {
        return getTestWinAction(gameState);
      }
      return getBasicTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;