// game_logic.js
import { gameState, GAME_PHASES, ROOMS } from './globals.js';
import { addToInventory, removeFromInventory, hasItem, combineItems } from './inventory.js';

export function interact(interactable, rooms) {
  if (!interactable || interactable.collected) return;
  
  if (interactable.type === "item") {
    addToInventory(interactable.id);
    interactable.collected = true;
    interactable.visible = false;
    gameState.score += 10;
    return `Collected ${interactable.name}`;
  }
  
  if (interactable.type === "door") {
    return securePoint(interactable, rooms);
  }
  
  if (interactable.type === "window") {
    return securePoint(interactable, rooms);
  }
  
  if (interactable.type === "useable" && interactable.id === "cage") {
    if (hasItem("locked_chain") || hasItem("rope_chain")) {
      gameState.score += 50;
      return "Cage prepared - could be used as last resort containment";
    } else {
      return "Need a chain with lock or rope to secure the cage";
    }
  }
  
  return null;
}

function securePoint(interactable, rooms) {
  if (interactable.secured) {
    return `${interactable.name} already secured`;
  }
  
  // Check if player has necessary items
  if (interactable.type === "door") {
    if (hasItem("barricade") || (hasItem("planks") && hasItem("nails") && hasItem("hammer"))) {
      interactable.secured = true;
      gameState.securedPoints[interactable.id] = true;
      removeFromInventory("barricade");
      removeFromInventory("barricade_ready");
      gameState.score += 30;
      return `${interactable.name} barricaded!`;
    } else if (hasItem("locked_chain")) {
      interactable.secured = true;
      gameState.securedPoints[interactable.id] = true;
      removeFromInventory("locked_chain");
      gameState.score += 25;
      return `${interactable.name} chained!`;
    } else {
      return "Need planks, nails, and hammer OR a locked chain to secure door";
    }
  }
  
  if (interactable.type === "window") {
    if (hasItem("barricade") || (hasItem("planks") && hasItem("nails") && hasItem("hammer"))) {
      interactable.secured = true;
      gameState.securedPoints[interactable.id] = true;
      removeFromInventory("barricade");
      removeFromInventory("barricade_ready");
      gameState.score += 25;
      return `${interactable.name} boarded up!`;
    } else {
      return "Need planks, nails, and hammer to board up window";
    }
  }
  
  return "Cannot secure this";
}

export function checkWinCondition() {
  // Win if: secured at least 3 points, used sedative, and time is up
  const securedCount = Object.values(gameState.securedPoints).filter(v => v).length;
  
  if (gameState.timeRemaining <= 0) {
    if (securedCount >= 3 && gameState.usedSedative) {
      return "WIN";
    } else {
      return "LOSE";
    }
  }
  
  return null;
}

export function useSedative() {
  if (hasItem("sedative")) {
    removeFromInventory("sedative");
    gameState.usedSedative = true;
    gameState.timeRemaining += 30; // Bonus time
    gameState.score += 40;
    return "Used sedative - gained extra time to prepare!";
  }
  return null;
}

export function updateTimer(deltaTime) {
  gameState.framesSinceLastSecond += deltaTime;
  
  if (gameState.framesSinceLastSecond >= 60) {
    gameState.timeRemaining--;
    gameState.framesSinceLastSecond = 0;
  }
}