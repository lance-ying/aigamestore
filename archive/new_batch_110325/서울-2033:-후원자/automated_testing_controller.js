// automated_testing_controller.js - Automated testing

import { GAME_PHASES } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Make optimal choices to survive as long as possible
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  if (!gameState.currentEvent) {
    return null;
  }
  
  const event = gameState.currentEvent;
  const choices = event.choices;
  
  // Evaluate each choice
  let bestChoice = 0;
  let bestScore = -Infinity;
  
  for (let i = 0; i < choices.length; i++) {
    const choice = choices[i];
    
    if (!choice.canChoose()) {
      continue; // Skip locked choices
    }
    
    // Estimate choice value based on current state
    let score = 0;
    
    // Health priority when low
    if (gameState.health < 40) {
      if (choice.text.toLowerCase().includes("rest") || 
          choice.text.toLowerCase().includes("heal") ||
          choice.text.toLowerCase().includes("medicine")) {
        score += 100;
      }
    }
    
    // Stress management when high
    if (gameState.stress > 70) {
      if (choice.text.toLowerCase().includes("rest") ||
          choice.text.toLowerCase().includes("peace") ||
          choice.text.toLowerCase().includes("calm")) {
        score += 80;
      }
    }
    
    // Avoid risky choices when stats are critical
    if (gameState.health < 30 || gameState.stress > 80) {
      if (choice.text.toLowerCase().includes("fight") ||
          choice.text.toLowerCase().includes("force") ||
          choice.text.toLowerCase().includes("push")) {
        score -= 100;
      }
    }
    
    // Prefer choices that match our high stats
    if (choice.requirements) {
      if (choice.requirements.str && gameState.strength >= choice.requirements.str) {
        score += 30;
      }
      if (choice.requirements.int && gameState.intelligence >= choice.requirements.int) {
        score += 30;
      }
      if (choice.requirements.cha && gameState.charisma >= choice.requirements.cha) {
        score += 30;
      }
    }
    
    // Prefer helping others when we can afford it (builds charisma)
    if (gameState.money >= 30 && choice.text.toLowerCase().includes("help")) {
      score += 20;
    }
    
    // Prefer study/learning choices (builds intelligence)
    if (choice.text.toLowerCase().includes("study") ||
        choice.text.toLowerCase().includes("learn") ||
        choice.text.toLowerCase().includes("read")) {
      score += 25;
    }
    
    // Avoid expensive choices when money is low
    if (gameState.money < 20 && choice.requirements && choice.requirements.money) {
      score -= 50;
    }
    
    // Random tiebreaker
    score += Math.random() * 5;
    
    if (score > bestScore) {
      bestScore = score;
      bestChoice = i;
    }
  }
  
  // Navigate to best choice and select it
  if (gameState.selectedChoiceIndex !== bestChoice) {
    // Navigate up or down
    if (bestChoice < gameState.selectedChoiceIndex) {
      return { key: 'ArrowUp', keyCode: 38 };
    } else {
      return { key: 'ArrowDown', keyCode: 40 };
    }
  } else {
    // Select the choice
    return { key: ' ', keyCode: 32 };
  }
}

function getBasicTestAction(gameState) {
  // Basic testing: random valid choices
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  if (!gameState.currentEvent) {
    return null;
  }
  
  // Find available choices
  const event = gameState.currentEvent;
  const availableChoices = [];
  for (let i = 0; i < event.choices.length; i++) {
    if (event.choices[i].canChoose()) {
      availableChoices.push(i);
    }
  }
  
  if (availableChoices.length === 0) {
    // No valid choices, try to select current anyway
    return { key: ' ', keyCode: 32 };
  }
  
  // Pick random available choice
  const targetChoice = availableChoices[Math.floor(Math.random() * availableChoices.length)];
  
  if (gameState.selectedChoiceIndex !== targetChoice) {
    if (targetChoice < gameState.selectedChoiceIndex) {
      return { key: 'ArrowUp', keyCode: 38 };
    } else {
      return { key: 'ArrowDown', keyCode: 40 };
    }
  } else {
    return { key: ' ', keyCode: 32 };
  }
}

function getEdgeTestAction(gameState) {
  // Test edge cases: push stats to extremes
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  if (!gameState.currentEvent) {
    return null;
  }
  
  const event = gameState.currentEvent;
  const choices = event.choices;
  
  // Strategy: alternate between risky and safe choices to test boundaries
  let targetChoice = 0;
  
  if (gameState.eventsCompleted % 2 === 0) {
    // Try risky choices
    for (let i = 0; i < choices.length; i++) {
      if (choices[i].canChoose() && 
          (choices[i].text.toLowerCase().includes("fight") ||
           choices[i].text.toLowerCase().includes("force") ||
           choices[i].text.toLowerCase().includes("push"))) {
        targetChoice = i;
        break;
      }
    }
  } else {
    // Try healing choices
    for (let i = 0; i < choices.length; i++) {
      if (choices[i].canChoose() &&
          (choices[i].text.toLowerCase().includes("rest") ||
           choices[i].text.toLowerCase().includes("heal"))) {
        targetChoice = i;
        break;
      }
    }
  }
  
  if (gameState.selectedChoiceIndex !== targetChoice) {
    if (targetChoice < gameState.selectedChoiceIndex) {
      return { key: 'ArrowUp', keyCode: 38 };
    } else {
      return { key: 'ArrowDown', keyCode: 40 };
    }
  } else {
    return { key: ' ', keyCode: 32 };
  }
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getEdgeTestAction(gameState);
    default:
      return null;
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;