// events.js - Event handling

import { EVENTS, SPACE_TYPES, gameState } from './globals.js';

export function triggerSpaceEvent(space, p) {
  let event = null;
  
  switch (space.type) {
    case SPACE_TYPES.EDUCATION:
      event = p.random(EVENTS.EDUCATION);
      break;
    case SPACE_TYPES.CAREER:
      event = p.random(EVENTS.CAREER);
      break;
    case SPACE_TYPES.RELATIONSHIP:
      event = p.random(EVENTS.RELATIONSHIP);
      break;
    case SPACE_TYPES.PROPERTY:
      event = p.random(EVENTS.PROPERTY);
      break;
    case SPACE_TYPES.EVENT:
      event = p.random(EVENTS.RANDOM);
      break;
    case SPACE_TYPES.PAYDAY:
      event = {
        title: "Payday!",
        description: "You earned your salary!",
        choices: [
          { text: "Collect Pay", knowledge: 0, wealth: 20, happiness: 10 }
        ]
      };
      break;
    case SPACE_TYPES.RETIREMENT:
      event = null; // Handle retirement separately
      break;
  }
  
  return event;
}

export function applyEventChoice(choice) {
  if (choice.knowledge) gameState.knowledge += choice.knowledge;
  if (choice.wealth) gameState.wealth += choice.wealth;
  if (choice.happiness) gameState.happiness += choice.happiness;
  
  // Cap stats
  gameState.knowledge = Math.max(0, gameState.knowledge);
  gameState.wealth = Math.max(0, gameState.wealth);
  gameState.happiness = Math.max(0, gameState.happiness);
  
  // Check for unlocks
  checkUnlocks();
}

function checkUnlocks() {
  const total = gameState.knowledge + gameState.wealth + gameState.happiness;
  
  if (total > 100 && !gameState.unlockedCosmetics.includes("hat")) {
    gameState.unlockedCosmetics.push("hat");
  }
  if (total > 200 && !gameState.unlockedCosmetics.includes("outfit")) {
    gameState.unlockedCosmetics.push("outfit");
  }
  if (total > 300 && !gameState.unlockedCosmetics.includes("vehicle")) {
    gameState.unlockedCosmetics.push("vehicle");
  }
}