// automated_testing_controller.js - Automated testing AI

import { gameState, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_SPACE, KEY_Z } from './globals.js';

function getTestWinAction(gameState) {
  if (!gameState.player) return null;
  
  // Priority 1: Use Gear Boy if available and enemies nearby
  if (gameState.gearBoyCooldown === 0 && !gameState.gearBoyActive) {
    for (const enemy of gameState.enemies) {
      const dist = Math.sqrt(
        Math.pow(gameState.player.x - enemy.x, 2) + 
        Math.pow(gameState.player.y - enemy.y, 2)
      );
      if (dist < 150 && !enemy.visibleToPlayer) {
        return { keyCode: KEY_SPACE };
      }
    }
  }
  
  // Priority 2: Collect nearest uncollected clue
  let nearestClue = null;
  let nearestDist = Infinity;
  
  for (const clue of gameState.clues) {
    if (!clue.collected) {
      const canCollect = clue.requiredEvidence.every(req => 
        gameState.evidenceCollected.includes(req)
      );
      
      if (canCollect) {
        const dist = Math.sqrt(
          Math.pow(gameState.player.x - clue.x, 2) + 
          Math.pow(gameState.player.y - clue.y, 2)
        );
        
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestClue = clue;
        }
      }
    }
  }
  
  // If near a clue, interact
  if (nearestClue && nearestDist < 50) {
    return { keyCode: KEY_Z };
  }
  
  // Move towards nearest clue
  if (nearestClue) {
    const dx = nearestClue.x - gameState.player.x;
    const dy = nearestClue.y - gameState.player.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
    } else {
      return dy > 0 ? { keyCode: KEY_DOWN } : { keyCode: KEY_UP };
    }
  }
  
  // Priority 3: Try to unlock doors
  for (const door of gameState.doors) {
    if (door.isLocked) {
      const hasAllKeys = door.requiredKeys.every(key => 
        gameState.evidenceCollected.includes(key)
      );
      
      if (hasAllKeys) {
        const dist = Math.sqrt(
          Math.pow(gameState.player.x - door.x, 2) + 
          Math.pow(gameState.player.y - door.y, 2)
        );
        
        if (dist < 50) {
          return { keyCode: KEY_Z };
        }
        
        // Move towards door
        const dx = door.x - gameState.player.x;
        const dy = door.y - gameState.player.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
        } else {
          return dy > 0 ? { keyCode: KEY_DOWN } : { keyCode: KEY_UP };
        }
      }
    }
  }
  
  // Default: explore
  return { keyCode: [KEY_RIGHT, KEY_DOWN, KEY_LEFT, KEY_UP][Math.floor(Math.random() * 4)] };
}

function getRandomAction(gameState) {
  const actions = [KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_SPACE, KEY_Z];
  return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getRandomAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;