// automated_testing_controller.js - Automated testing

import { gameState } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Make optimal choices to maximize total score
  
  // During event selection
  if (gameState.showingEvent && gameState.currentEvent) {
    const choices = gameState.currentEvent.choices;
    
    // Calculate total value for each choice
    let bestChoice = 0;
    let bestValue = -Infinity;
    
    choices.forEach((choice, index) => {
      const knowledge = choice.knowledge || 0;
      const wealth = choice.wealth || 0;
      const happiness = choice.happiness || 0;
      
      // Prioritize balanced growth
      const currentTotal = gameState.knowledge + gameState.wealth + gameState.happiness;
      const total = knowledge + wealth + happiness;
      
      // Prefer choices that don't make stats negative
      const wouldMakeNegative = (gameState.knowledge + knowledge < 0) ||
                                (gameState.wealth + wealth < 0) ||
                                (gameState.happiness + happiness < 0);
      
      let value = total * 10;
      
      // Bonus for positive choices
      if (!wouldMakeNegative) value += 50;
      
      // Balance bonus - prefer choices that help the lowest stat
      const minStat = Math.min(gameState.knowledge, gameState.wealth, gameState.happiness);
      if (knowledge > 0 && gameState.knowledge === minStat) value += 30;
      if (wealth > 0 && gameState.wealth === minStat) value += 30;
      if (happiness > 0 && gameState.happiness === minStat) value += 30;
      
      if (value > bestValue) {
        bestValue = value;
        bestChoice = index;
      }
    });
    
    // Navigate to best choice
    if (gameState.selectedChoice < bestChoice) {
      return { keyCode: 40 }; // DOWN
    } else if (gameState.selectedChoice > bestChoice) {
      return { keyCode: 38 }; // UP
    } else {
      return { keyCode: 90 }; // Z - confirm
    }
  }
  
  // Spin when ready
  if (!gameState.spinning && !gameState.moving && !gameState.showingEvent) {
    return { keyCode: 32 }; // SPACE
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // Basic testing: random but valid actions
  
  if (gameState.showingEvent && gameState.currentEvent) {
    // Randomly navigate or confirm
    const rand = Math.random();
    if (rand < 0.3 && gameState.selectedChoice > 0) {
      return { keyCode: 38 }; // UP
    } else if (rand < 0.6 && gameState.selectedChoice < gameState.currentEvent.choices.length - 1) {
      return { keyCode: 40 }; // DOWN
    } else {
      return { keyCode: 90 }; // Z
    }
  }
  
  if (!gameState.spinning && !gameState.moving && !gameState.showingEvent) {
    return { keyCode: 32 }; // SPACE
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
      return null;
  }
}

if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;