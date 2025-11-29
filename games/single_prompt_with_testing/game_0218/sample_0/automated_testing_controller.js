// automated_testing_controller.js - Automated testing AI

import { gameState, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_SPACE } from './globals.js';

// TEST_1: Basic movement and exploration
function getTest1Action() {
  if (!gameState.player) return null;
  
  const player = gameState.player;
  
  // Simple pattern: move right, jump occasionally
  if (Math.random() < 0.7) {
    return { keyCode: KEY_RIGHT };
  } else if (Math.random() < 0.3 && player.onGround) {
    return { keyCode: KEY_UP };
  } else if (Math.random() < 0.1) {
    return { keyCode: KEY_SPACE }; // Switch character occasionally
  }
  
  return { keyCode: KEY_RIGHT };
}

// TEST_2: Optimal artifact collection strategy
function getTest2Action() {
  if (!gameState.player || !gameState.brother || !gameState.sister) return null;
  
  const player = gameState.player;
  
  // Find nearest uncollected artifact
  let nearestArtifact = null;
  let minDistance = Infinity;
  
  for (const artifact of gameState.collectibles) {
    if (!artifact.collected) {
      const dx = artifact.x - player.x;
      const dy = artifact.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestArtifact = artifact;
      }
    }
  }
  
  if (nearestArtifact) {
    const dx = nearestArtifact.x - player.x;
    const dy = nearestArtifact.y - player.y;
    
    // Navigate towards artifact
    if (Math.abs(dx) > 20) {
      // Move horizontally
      return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
    } else if (dy < -30 && player.onGround) {
      // Jump if artifact is above
      return { keyCode: KEY_UP };
    } else if (Math.abs(dx) < 20 && dy > 20) {
      // Close horizontally but need to go down
      return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
    }
  }
  
  // Check if we need to use pressure plate
  for (const element of gameState.puzzleElements) {
    if (element.constructor.name === 'PressurePlate' && !element.isPressed) {
      const dx = element.x + element.width / 2 - player.x;
      
      if (Math.abs(dx) > 20) {
        return dx > 0 ? { keyCode: KEY_RIGHT } : { keyCode: KEY_LEFT };
      }
    }
  }
  
  // Check if door is blocking and we need to switch
  for (const element of gameState.puzzleElements) {
    if (element.constructor.name === 'Door' && element.blocksMovement()) {
      // Check if other character can help
      const otherChar = gameState.activeCharacter === 'brother' ? gameState.sister : gameState.brother;
      const pressurePlate = gameState.puzzleElements.find(e => 
        e.constructor.name === 'PressurePlate' && e.doorId === element.doorId
      );
      
      if (pressurePlate) {
        const distToPlate = Math.abs(otherChar.x - (pressurePlate.x + pressurePlate.width / 2));
        if (distToPlate < 100) {
          // Switch to other character
          return { keyCode: KEY_SPACE };
        }
      }
    }
  }
  
  // Default: move right and jump
  if (Math.random() < 0.8) {
    return { keyCode: KEY_RIGHT };
  } else if (player.onGround) {
    return { keyCode: KEY_UP };
  }
  
  return { keyCode: KEY_RIGHT };
}

export function get_automated_testing_action(gameState) {
  if (gameState.controlMode === "TEST_1") {
    return getTest1Action();
  } else if (gameState.controlMode === "TEST_2") {
    return getTest2Action();
  }
  return null;
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;