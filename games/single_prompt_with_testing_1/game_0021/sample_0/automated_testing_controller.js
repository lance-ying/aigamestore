// automated_testing_controller.js - Automated testing functions
import { gameState, TILE_TYPES } from './globals.js';
import { findLongestMatchingPath } from './grid.js';

function findBestMatch() {
  let bestMatch = null;
  let bestScore = 0;
  
  const player = gameState.player;
  const enemies = gameState.enemies.filter(e => !e.isDead);
  const healthPercent = player.health / player.maxHealth;
  
  // Priority weights based on game state
  const needsHealing = healthPercent < 0.5;
  const underThreat = enemies.length > 2;
  const canAttack = enemies.length > 0;
  
  for (let row = 0; row < gameState.grid.length; row++) {
    for (let col = 0; col < gameState.grid[row].length; col++) {
      const path = findLongestMatchingPath(row, col, window.gameInstance);
      
      if (path.length >= 3) {
        let score = path.length * 10;
        const type = path[0].type;
        
        // Adjust score based on current needs
        if (type === TILE_TYPES.POTION && needsHealing) {
          score += 100;
        } else if (type === TILE_TYPES.SHIELD && underThreat) {
          score += 80;
        } else if (type === TILE_TYPES.SWORD && canAttack) {
          score += 60;
        }
        
        // Prefer longer matches
        score += path.length * 20;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            path: path,
            type: type,
            row: row,
            col: col
          };
        }
      }
    }
  }
  
  return bestMatch;
}

function getTestWinAction(gameState) {
  // Intelligent strategy for winning
  const player = gameState.player;
  const enemies = gameState.enemies.filter(e => !e.isDead);
  const healthPercent = player.health / player.maxHealth;
  
  // If currently drawing a path, complete it
  if (gameState.isDrawingPath && gameState.selectedPath.length >= 3) {
    return { key: ' ', keyCode: 32 };
  }
  
  // Find best match based on priorities
  const bestMatch = findBestMatch();
  
  if (bestMatch) {
    // Start drawing the path
    if (!gameState.isDrawingPath) {
      // Simulate clicking on the first tile of the best match
      // This would require more complex state management
      // For simplicity, just return space to execute if we have a selection
      if (gameState.selectedPath.length >= 3) {
        return { key: ' ', keyCode: 32 };
      }
    }
  }
  
  // Default to space to try to execute any valid path
  return { key: ' ', keyCode: 32 };
}

function getDefensiveAction(gameState) {
  // Focus on survival - prioritize healing and defense
  const bestMatch = findBestMatch();
  
  if (bestMatch) {
    const type = bestMatch.type;
    const player = gameState.player;
    const healthPercent = player.health / player.maxHealth;
    
    // Strong preference for healing when low
    if (type === TILE_TYPES.POTION && healthPercent < 0.6) {
      return { key: ' ', keyCode: 32 };
    }
    
    // Use shields when available
    if (type === TILE_TYPES.SHIELD) {
      return { key: ' ', keyCode: 32 };
    }
  }
  
  return { key: ' ', keyCode: 32 };
}

function getRandomAction(gameState) {
  // Random testing action
  const actions = [
    { key: ' ', keyCode: 32 },
    { key: 'Shift', keyCode: 16 }
  ];
  
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      // Basic testing - try to make matches
      return getRandomAction(gameState);
    case "TEST_2":
      // Win strategy
      return getTestWinAction(gameState);
    case "TEST_3":
      // Defensive play
      return getDefensiveAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;