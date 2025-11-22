// mode_handler.js
import { gameState, EQUIPMENT_RECIPES, JOB_TYPES } from './globals.js';
import { startCrafting, recruitAdventurer, equipItemToAdventurer } from './castle_manager.js';
import { moveToNode, interactWithNode } from './maze_manager.js';

export function handleCastleInput(keyCode) {
  const keys = {
    UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39,
    SPACE: 32, SHIFT: 16, Z: 90
  };
  
  // Tab switching
  if (keyCode === keys.LEFT) {
    gameState.castleTab = Math.max(0, gameState.castleTab - 1);
  }
  if (keyCode === keys.RIGHT) {
    gameState.castleTab = Math.min(1, gameState.castleTab + 1);
  }
  
  if (gameState.castleTab === 0) { // Crafting tab
    if (keyCode === keys.UP) {
      gameState.selectedRecipe = Math.max(0, gameState.selectedRecipe - 1);
    }
    if (keyCode === keys.DOWN) {
      gameState.selectedRecipe = Math.min(EQUIPMENT_RECIPES.length - 1, gameState.selectedRecipe + 1);
    }
    if (keyCode === keys.SPACE) {
      const recipe = EQUIPMENT_RECIPES[gameState.selectedRecipe];
      startCrafting(recipe, false);
    }
    if (keyCode === keys.SHIFT) {
      const recipe = EQUIPMENT_RECIPES[gameState.selectedRecipe];
      startCrafting(recipe, true);
    }
  } else if (gameState.castleTab === 1) { // Team tab
    if (keyCode === keys.UP) {
      gameState.selectedAdventurer = Math.max(0, gameState.selectedAdventurer - 1);
    }
    if (keyCode === keys.DOWN) {
      gameState.selectedAdventurer = Math.min(
        Math.max(0, JOB_TYPES.length - 1),
        gameState.selectedAdventurer + 1
      );
    }
    if (keyCode === keys.SPACE) {
      if (gameState.selectedAdventurer < JOB_TYPES.length) {
        const jobType = JOB_TYPES[gameState.selectedAdventurer];
        recruitAdventurer(jobType);
      } else {
        // Equip item to adventurer
        const advIndex = gameState.selectedAdventurer - JOB_TYPES.length;
        if (advIndex >= 0 && gameState.inventory.length > 0) {
          equipItemToAdventurer(advIndex, 0);
        }
      }
    }
  }
}

export function handleMazeInput(keyCode) {
  const keys = {
    UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39,
    SPACE: 32, SHIFT: 16, Z: 90
  };
  
  const currentNode = gameState.currentNode;
  if (!currentNode) return;
  
  // Navigate through available connections
  if (keyCode === keys.UP) {
    gameState.selectedNodeIndex = Math.max(0, gameState.selectedNodeIndex - 1);
  }
  if (keyCode === keys.DOWN) {
    gameState.selectedNodeIndex = Math.min(
      currentNode.connections.length - 1,
      gameState.selectedNodeIndex + 1
    );
  }
  
  if (keyCode === keys.SPACE) {
    // Try to interact with current node first
    if (!currentNode.cleared) {
      interactWithNode();
    } else {
      // Move to selected connection
      const targetIndex = gameState.mazeNodes.indexOf(
        currentNode.connections[gameState.selectedNodeIndex]
      );
      if (targetIndex >= 0) {
        moveToNode(targetIndex);
        gameState.selectedNodeIndex = 0;
      }
    }
  }
}