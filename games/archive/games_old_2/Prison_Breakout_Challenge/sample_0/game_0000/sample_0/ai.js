// ai.js - AI test controllers
import { gameState } from './globals.js';

export function getTestAction(p) {
  if (gameState.controlMode === "TEST_1") {
    return basicTest(p);
  } else if (gameState.controlMode === "TEST_2") {
    return winTest(p);
  }
  return null;
}

function basicTest(p) {
  // Simple test: move right and jump occasionally
  const action = {
    moveLeft: false,
    moveRight: true,
    jump: false,
    interact: false
  };
  
  if (p.frameCount % 90 === 0) {
    action.jump = true;
  }
  
  if (gameState.player && gameState.player.canInteract) {
    action.interact = true;
  }
  
  return action;
}

function winTest(p) {
  // More intelligent test to try to win
  if (!gameState.player) return null;
  
  const action = {
    moveLeft: false,
    moveRight: false,
    jump: false,
    interact: false
  };
  
  // Find nearest incomplete objective
  let nearest = null;
  let minDist = Infinity;
  
  for (let obj of gameState.objectives) {
    if (!obj.completed && obj.type !== "EXIT") {
      const dist = Math.abs(gameState.player.x - obj.x);
      if (dist < minDist) {
        minDist = dist;
        nearest = obj;
      }
    }
  }
  
  // If all objectives done, go to exit
  if (!nearest || gameState.objectivesCompleted >= gameState.totalObjectives) {
    for (let obj of gameState.objectives) {
      if (obj.type === "EXIT") {
        nearest = obj;
        break;
      }
    }
  }
  
  if (nearest) {
    const dx = nearest.x - gameState.player.x;
    
    if (Math.abs(dx) > 30) {
      if (dx > 0) {
        action.moveRight = true;
      } else {
        action.moveLeft = true;
      }
    }
    
    // Jump if needed
    if (gameState.player.grounded && Math.random() < 0.05) {
      action.jump = true;
    }
    
    // Interact when near
    if (gameState.player.canInteract) {
      action.interact = true;
    }
  }
  
  return action;
}