// automated_testing_controller.js
import { gameState, GAME_PHASES, GAME_MODES } from './globals.js';
import { EQUIPMENT_RECIPES, JOB_TYPES } from './globals.js';

const KEY_CODES = {
  UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39,
  SPACE: 32, SHIFT: 16, Z: 90
};

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  // Strategy: Build up resources, craft equipment, recruit team, explore maze
  
  // Phase 1: Gather resources (first 3 seconds)
  if (gameState.timeElapsed < 3) {
    return { keyCode: KEY_CODES.SPACE }; // Hold space to speed up time
  }
  
  // Phase 2: Switch to castle and craft equipment
  if (gameState.currentMode === GAME_MODES.MAZE && gameState.timeElapsed < 10) {
    return { keyCode: KEY_CODES.Z };
  }
  
  if (gameState.currentMode === GAME_MODES.CASTLE && gameState.timeElapsed < 10) {
    // Craft items
    if (gameState.castleTab !== 0) {
      return { keyCode: KEY_CODES.LEFT };
    }
    
    // Try to craft if we have resources
    const recipe = EQUIPMENT_RECIPES[gameState.selectedRecipe];
    let canCraft = true;
    for (let mat in recipe.cost) {
      if (gameState.materials[mat] < recipe.cost[mat]) {
        canCraft = false;
        break;
      }
    }
    
    if (canCraft && gameState.inventory.length < 3) {
      return { keyCode: KEY_CODES.SHIFT }; // Quick craft
    } else if (!canCraft) {
      return { keyCode: KEY_CODES.SPACE }; // Speed up time
    }
  }
  
  // Phase 3: Recruit adventurers
  if (gameState.currentMode === GAME_MODES.CASTLE && 
      gameState.timeElapsed >= 10 && 
      gameState.timeElapsed < 15) {
    
    if (gameState.castleTab !== 1) {
      return { keyCode: KEY_CODES.RIGHT };
    }
    
    // Recruit if we can
    if (gameState.adventurers.length < gameState.maxTeamSize) {
      const jobType = JOB_TYPES[gameState.selectedAdventurer % JOB_TYPES.length];
      if (gameState.materials.iron >= jobType.cost) {
        return { keyCode: KEY_CODES.SPACE };
      } else {
        return { keyCode: KEY_CODES.DOWN };
      }
    }
    
    // Equip items to adventurers
    if (gameState.inventory.length > 0) {
      return { keyCode: KEY_CODES.SPACE };
    }
  }
  
  // Phase 4: Enter maze and explore
  if (gameState.currentMode === GAME_MODES.CASTLE && gameState.timeElapsed >= 15) {
    if (gameState.adventurers.length > 0) {
      return { keyCode: KEY_CODES.Z };
    } else {
      // Need more resources
      return { keyCode: KEY_CODES.SPACE };
    }
  }
  
  if (gameState.currentMode === GAME_MODES.MAZE && gameState.timeElapsed >= 15) {
    const currentNode = gameState.currentNode;
    
    if (!currentNode) return null;
    
    // Interact with uncompleted nodes
    if (!currentNode.cleared) {
      return { keyCode: KEY_CODES.SPACE };
    }
    
    // Move deeper into the maze (prefer higher depth nodes)
    if (currentNode.connections.length > 0) {
      // Find the connection with highest depth that hasn't been explored
      let bestIdx = 0;
      let bestDepth = -1;
      
      for (let i = 0; i < currentNode.connections.length; i++) {
        const conn = currentNode.connections[i];
        if (!conn.explored && conn.depth > bestDepth) {
          bestIdx = i;
          bestDepth = conn.depth;
        }
      }
      
      // If all explored, pick any deeper node
      if (bestDepth === -1) {
        for (let i = 0; i < currentNode.connections.length; i++) {
          const conn = currentNode.connections[i];
          if (conn.depth > currentNode.depth) {
            bestIdx = i;
            break;
          }
        }
      }
      
      // Navigate to the best connection
      if (gameState.selectedNodeIndex !== bestIdx) {
        if (gameState.selectedNodeIndex < bestIdx) {
          return { keyCode: KEY_CODES.DOWN };
        } else {
          return { keyCode: KEY_CODES.UP };
        }
      } else {
        return { keyCode: KEY_CODES.SPACE };
      }
    }
  }
  
  return { keyCode: KEY_CODES.SPACE };
}

function getBasicTestAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  // Simple test: switch modes and navigate menus
  const actions = [
    { keyCode: KEY_CODES.Z },
    { keyCode: KEY_CODES.SPACE },
    { keyCode: KEY_CODES.DOWN },
    { keyCode: KEY_CODES.UP },
    { keyCode: KEY_CODES.LEFT },
    { keyCode: KEY_CODES.RIGHT }
  ];
  
  const frameIndex = Math.floor(gameState.timeElapsed * 10) % actions.length;
  return actions[frameIndex];
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const actions = [
    { keyCode: KEY_CODES.UP },
    { keyCode: KEY_CODES.DOWN },
    { keyCode: KEY_CODES.LEFT },
    { keyCode: KEY_CODES.RIGHT },
    { keyCode: KEY_CODES.SPACE },
    { keyCode: KEY_CODES.Z }
  ];
  
  const rand = Math.floor(Math.random() * actions.length);
  return actions[rand];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getRandomAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;