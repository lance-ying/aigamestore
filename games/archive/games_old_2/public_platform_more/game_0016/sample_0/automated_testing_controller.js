// automated_testing_controller.js - Automated testing

import { gameState } from './globals.js';
import { areRegionsAdjacent, canSailBetweenRegions, getContinentForRegion } from './entities.js';
import { ACTION_RECRUIT, ACTION_MOVE, ACTION_SAIL, ACTION_DESTROY, ACTION_BUILD_CASTLE } from './globals.js';

function getTestBasicAction(gameState) {
  // Basic random action test
  if (gameState.actionState === "SELECT_CARD") {
    // Pick random card
    if (Math.random() < 0.3 && gameState.cardMarket.length > 0) {
      return { keyCode: 32 }; // Space to select
    }
    return Math.random() < 0.5 ? { keyCode: 37 } : { keyCode: 39 }; // Navigate
  } else if (gameState.actionState === "SELECT_REGION") {
    // Navigate and select region
    if (Math.random() < 0.2) {
      return { keyCode: 32 }; // Confirm
    }
    const directions = [37, 38, 39, 40];
    return { keyCode: directions[Math.floor(Math.random() * directions.length)] };
  }
  return { keyCode: 0 };
}

function getTestWinAction(gameState) {
  // Optimal strategy to win
  const playerId = 0;
  const player = gameState.players[playerId];
  
  if (gameState.actionState === "SELECT_CARD") {
    // Strategy: prioritize coins > castles > destroy > move/recruit
    let bestCardIdx = -1;
    let bestScore = -1;
    
    gameState.cardMarket.forEach((card, idx) => {
      let score = 0;
      
      // Prioritize coins
      if (card.resource === "COIN") score += card.amount * 3;
      else if (card.resource === "FOOD") score += card.amount * 2;
      else if (card.resource === "WOOD") score += card.amount * 2;
      
      // Prioritize castle building
      if (card.action === ACTION_BUILD_CASTLE) score += 10;
      
      // Prioritize destroy if we can use it
      if (card.action === ACTION_DESTROY) {
        const canDestroy = gameState.regions.some(r => 
          r.troops[playerId] > 0 && r.troops[1 - playerId] > 0
        );
        if (canDestroy) score += 8;
      }
      
      // Recruit if we have troops
      if (card.action === ACTION_RECRUIT && player.troops >= card.value) {
        score += 5;
      }
      
      // Move/sail for expansion
      if (card.action === ACTION_MOVE || card.action === ACTION_SAIL) {
        score += 4;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestCardIdx = idx;
      }
    });
    
    if (bestCardIdx >= 0) {
      // Navigate to best card
      if (gameState.selectedCardIndex < bestCardIdx) {
        return { keyCode: 39 }; // Right
      } else if (gameState.selectedCardIndex > bestCardIdx) {
        return { keyCode: 37 }; // Left
      } else {
        return { keyCode: 32 }; // Select
      }
    }
    
    return { keyCode: 32 }; // Default: select current
  } else if (gameState.actionState === "SELECT_REGION") {
    const action = gameState.actionData?.action;
    
    if (action === ACTION_RECRUIT) {
      // Recruit to cities or strategic regions
      const cities = gameState.regions.filter(r => r.isCity && (r.troops[playerId] > 0 || r.isCity));
      const strategic = gameState.regions.filter(r => 
        r.troops[playerId] > 0 && r.troops[1 - playerId] > 0
      );
      
      const targets = cities.length > 0 ? cities : strategic;
      if (targets.length > 0) {
        const target = targets[0];
        return navigateToRegion(gameState, target.id);
      }
    } else if (action === ACTION_MOVE || action === ACTION_SAIL) {
      if (!gameState.actionData.sourceRegion) {
        // Pick source with most troops
        const sources = gameState.regions
          .filter(r => r.troops[playerId] > 0)
          .sort((a, b) => b.troops[playerId] - a.troops[playerId]);
        
        if (sources.length > 0) {
          return navigateToRegion(gameState, sources[0].id);
        }
      } else {
        // Pick destination: expand to new continent or reinforce contested
        const sourceId = gameState.actionData.sourceRegion;
        let targets = [];
        
        if (action === ACTION_MOVE) {
          targets = gameState.regions[sourceId].adjacent
            .map(id => gameState.regions[id])
            .filter(r => r.troops[playerId] === 0 || r.troops[1 - playerId] > 0);
        } else {
          targets = gameState.regions
            .filter(r => canSailBetweenRegions(sourceId, r.id) && r.id !== sourceId);
        }
        
        if (targets.length > 0) {
          return navigateToRegion(gameState, targets[0].id);
        }
      }
    } else if (action === ACTION_DESTROY) {
      // Find regions with both player and enemy troops
      const targets = gameState.regions.filter(r => 
        r.troops[playerId] > 0 && r.troops[1 - playerId] > 0
      );
      
      if (targets.length > 0) {
        return navigateToRegion(gameState, targets[0].id);
      }
    } else if (action === ACTION_BUILD_CASTLE) {
      // Build in controlled regions without castles
      const targets = gameState.regions.filter(r => 
        r.getController() === playerId && r.castle === null
      );
      
      if (targets.length > 0) {
        // Prioritize contested continents
        const bestTarget = targets[0];
        return navigateToRegion(gameState, bestTarget.id);
      }
    }
    
    // Default: confirm current selection
    return { keyCode: 32 };
  }
  
  return { keyCode: 0 };
}

function navigateToRegion(gameState, targetId) {
  if (gameState.selectedRegionId === targetId) {
    return { keyCode: 32 }; // Confirm
  }
  
  if (gameState.selectedRegionId < 0) {
    gameState.selectedRegionId = 0;
  }
  
  const current = gameState.regions[gameState.selectedRegionId];
  const target = gameState.regions[targetId];
  
  const dx = target.x - current.x;
  const dy = target.y - current.y;
  
  // Choose direction based on larger difference
  if (Math.abs(dx) > Math.abs(dy)) {
    return { keyCode: dx > 0 ? 39 : 37 }; // Right or Left
  } else {
    return { keyCode: dy > 0 ? 40 : 38 }; // Down or Up
  }
}

function getRandomAction(gameState) {
  const keys = [32, 37, 38, 39, 40, 90];
  return { keyCode: keys[Math.floor(Math.random() * keys.length)] };
}

export function get_automated_testing_action(gameState) {
  // Don't provide input during AI turn
  if (gameState.currentPlayer !== 0) {
    return { keyCode: 0 };
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;