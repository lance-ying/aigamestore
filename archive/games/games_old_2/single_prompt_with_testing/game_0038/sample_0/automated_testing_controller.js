// automated_testing_controller.js - Automated testing

import { gameState, GAME_PHASES, PLAY_PHASES } from './globals.js';

let testState = {
  initialized: false,
  phase: "INIT",
  selectedComboIndex: 0,
  targetTerritoryIndex: 0,
  actionCooldown: 0,
  conquestCount: 0,
  lastRound: 0
};

function getTestWinAction(gameState) {
  // Cooldown between actions
  if (testState.actionCooldown > 0) {
    testState.actionCooldown--;
    return null;
  }
  
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  if (gameState.currentPlayer !== 0) {
    return null; // Wait for player turn
  }
  
  const player = gameState.players[0];
  
  // Strategy: Always select first available race combo with most tokens
  if (gameState.playPhase === PLAY_PHASES.SELECT_RACE) {
    if (testState.selectedComboIndex >= gameState.availableRaceCombos.length) {
      testState.selectedComboIndex = 0;
    }
    
    // Select best combo (most tokens)
    let bestIndex = 0;
    let maxTokens = 0;
    gameState.availableRaceCombos.forEach((combo, i) => {
      if (combo.race.tokens > maxTokens) {
        maxTokens = combo.race.tokens;
        bestIndex = i;
      }
    });
    
    // Navigate to best combo
    if (gameState.selectedRaceCombo === null) {
      testState.actionCooldown = 2;
      return { keyCode: 40 }; // Down to start selection
    }
    
    if (gameState.selectedRaceCombo < bestIndex) {
      testState.actionCooldown = 2;
      return { keyCode: 40 }; // Down
    } else if (gameState.selectedRaceCombo > bestIndex) {
      testState.actionCooldown = 2;
      return { keyCode: 38 }; // Up
    } else {
      testState.actionCooldown = 5;
      return { keyCode: 32 }; // Space to confirm
    }
  }
  
  // Deployment phase
  if (gameState.playPhase === PLAY_PHASES.DEPLOY_TOKENS) {
    if (player.availableTokens === 0) {
      // End turn
      testState.actionCooldown = 10;
      return { keyCode: 32 }; // Space to end turn
    }
    
    // Find best territory to conquer
    const playerTerritories = gameState.territories.filter(
      t => t.owner === 0 && !t.isDeclined
    );
    
    let bestTarget = null;
    let bestPriority = -1;
    
    gameState.territories.forEach(territory => {
      if (territory.terrain.name === "Water") return;
      if (territory.owner === 0) return; // Already owned
      
      const cost = territory.getConquestCost();
      if (cost > player.availableTokens) return; // Can't afford
      
      // Check adjacency
      if (playerTerritories.length > 0) {
        const isAdjacent = playerTerritories.some(owned => {
          const dq = Math.abs(owned.q - territory.q);
          const dr = Math.abs(owned.r - territory.r);
          const ds = Math.abs((owned.q + owned.r) - (territory.q + territory.r));
          return dq <= 1 && dr <= 1 && ds <= 1 && (dq + dr + ds === 2);
        });
        if (!isAdjacent) return;
      }
      
      // Calculate priority
      let priority = 10 - cost + territory.bonusPoints * 2;
      if (territory.owner !== null) priority += 3; // Prefer attacking
      
      if (priority > bestPriority) {
        bestPriority = priority;
        bestTarget = territory;
      }
    });
    
    if (bestTarget) {
      // Navigate to target
      const targetIndex = gameState.territories.indexOf(bestTarget);
      const currentIndex = gameState.selectedTerritory 
        ? gameState.territories.indexOf(gameState.selectedTerritory)
        : 0;
      
      if (currentIndex < targetIndex) {
        testState.actionCooldown = 2;
        return { keyCode: 39 }; // Right
      } else if (currentIndex > targetIndex) {
        testState.actionCooldown = 2;
        return { keyCode: 37 }; // Left
      } else {
        // At target, deploy
        testState.actionCooldown = 5;
        testState.conquestCount++;
        return { keyCode: 32 }; // Space
      }
    } else {
      // No valid target, check if should decline
      if (playerTerritories.length > 4 && !player.declinedRace) {
        testState.actionCooldown = 10;
        return { keyCode: 16 }; // Shift to decline
      }
      
      // End turn
      testState.actionCooldown = 10;
      return { keyCode: 32 }; // Space
    }
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // Basic navigation test
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  if (gameState.currentPlayer !== 0) {
    return null;
  }
  
  if (testState.actionCooldown > 0) {
    testState.actionCooldown--;
    return null;
  }
  
  // Cycle through arrow keys
  const keys = [37, 38, 39, 40];
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  
  testState.actionCooldown = 5;
  return { keyCode: randomKey };
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const rand = Math.random();
  if (rand < 0.25) return { keyCode: 37 }; // Left
  if (rand < 0.5) return { keyCode: 38 };  // Up
  if (rand < 0.75) return { keyCode: 39 }; // Right
  return { keyCode: 40 }; // Down
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

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;