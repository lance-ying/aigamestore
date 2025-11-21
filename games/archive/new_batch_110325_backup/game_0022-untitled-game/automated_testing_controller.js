// automated_testing_controller.js - Automated testing strategies

import { PHASE_PLAYING, UI_STATE_SELECT_ACTION, UI_STATE_SELECT_LOCATION, UI_STATE_SELECT_CARD, ACTION_PLACE_WORKER, ACTION_PLAY_CARD, ACTION_PREPARE_SEASON } from './globals.js';
import { getAvailableActions } from './gameLogic.js';
import { canAffordCard } from './cards.js';

function getTestBasicAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { keyCode: 32, key: ' ' }; // Space to advance
  }
  
  const actions = getAvailableActions();
  
  if (gameState.uiState === UI_STATE_SELECT_ACTION) {
    // Random selection among available actions
    const rand = Math.random();
    
    if (rand < 0.4 && actions.includes(ACTION_PLACE_WORKER)) {
      // Select place worker
      let targetIndex = actions.indexOf(ACTION_PLACE_WORKER);
      while (gameState.selectedActionIndex !== targetIndex) {
        gameState.selectedActionIndex = (gameState.selectedActionIndex + 1) % actions.length;
      }
      return { keyCode: 32, key: ' ' };
    } else if (rand < 0.7 && actions.includes(ACTION_PLAY_CARD)) {
      // Select play card
      let targetIndex = actions.indexOf(ACTION_PLAY_CARD);
      while (gameState.selectedActionIndex !== targetIndex) {
        gameState.selectedActionIndex = (gameState.selectedActionIndex + 1) % actions.length;
      }
      return { keyCode: 32, key: ' ' };
    } else {
      // Prepare for next season
      let targetIndex = actions.indexOf(ACTION_PREPARE_SEASON);
      while (gameState.selectedActionIndex !== targetIndex) {
        gameState.selectedActionIndex = (gameState.selectedActionIndex + 1) % actions.length;
      }
      return { keyCode: 32, key: ' ' };
    }
  } else if (gameState.uiState === UI_STATE_SELECT_LOCATION) {
    // Just select the first available location
    return { keyCode: 32, key: ' ' };
  } else if (gameState.uiState === UI_STATE_SELECT_CARD) {
    // Select first affordable card
    return { keyCode: 32, key: ' ' };
  }
  
  return { keyCode: 32, key: ' ' };
}

function getTestWinAction(gameState) {
  if (gameState.gamePhase !== PHASE_PLAYING) {
    return { keyCode: 32, key: ' ' };
  }
  
  const actions = getAvailableActions();
  
  if (gameState.uiState === UI_STATE_SELECT_ACTION) {
    // Strategy: Prioritize playing high-value cards, then collecting resources, then advancing season
    
    // Check if we can play a high-value card
    const affordableCards = gameState.hand.filter(card => canAffordCard(card, gameState.resources));
    const highValueCards = affordableCards.filter(card => card.victoryPoints >= 3);
    
    if (highValueCards.length > 0 && actions.includes(ACTION_PLAY_CARD)) {
      let targetIndex = actions.indexOf(ACTION_PLAY_CARD);
      while (gameState.selectedActionIndex !== targetIndex) {
        gameState.selectedActionIndex = (gameState.selectedActionIndex + 1) % actions.length;
      }
      return { keyCode: 32, key: ' ' };
    }
    
    // Check if we should build resource production first (early game)
    if (gameState.currentSeason <= 1 && gameState.city.length < 6 && affordableCards.length > 0) {
      const productionCards = affordableCards.filter(card => 
        card.ability && card.ability.startsWith("PRODUCE_")
      );
      
      if (productionCards.length > 0 && actions.includes(ACTION_PLAY_CARD)) {
        let targetIndex = actions.indexOf(ACTION_PLAY_CARD);
        while (gameState.selectedActionIndex !== targetIndex) {
          gameState.selectedActionIndex = (gameState.selectedActionIndex + 1) % actions.length;
        }
        return { keyCode: 32, key: ' ' };
      }
    }
    
    // If we can play any card and have room, do it
    if (affordableCards.length > 0 && gameState.city.length < 15 && actions.includes(ACTION_PLAY_CARD)) {
      let targetIndex = actions.indexOf(ACTION_PLAY_CARD);
      while (gameState.selectedActionIndex !== targetIndex) {
        gameState.selectedActionIndex = (gameState.selectedActionIndex + 1) % actions.length;
      }
      return { keyCode: 32, key: ' ' };
    }
    
    // Place workers if we have them
    if (gameState.availableWorkers > 0 && actions.includes(ACTION_PLACE_WORKER)) {
      let targetIndex = actions.indexOf(ACTION_PLACE_WORKER);
      while (gameState.selectedActionIndex !== targetIndex) {
        gameState.selectedActionIndex = (gameState.selectedActionIndex + 1) % actions.length;
      }
      return { keyCode: 32, key: ' ' };
    }
    
    // Otherwise, advance season
    let targetIndex = actions.indexOf(ACTION_PREPARE_SEASON);
    while (gameState.selectedActionIndex !== targetIndex) {
      gameState.selectedActionIndex = (gameState.selectedActionIndex + 1) % actions.length;
    }
    return { keyCode: 32, key: ' ' };
    
  } else if (gameState.uiState === UI_STATE_SELECT_LOCATION) {
    // Prioritize locations with multiple resources or high-value resources
    const availableLocations = gameState.locations.filter(loc => loc.canPlaceWorker());
    
    // Find best location (most resources or contains RESIN/PEBBLE)
    let bestScore = -1;
    let bestLocalIndex = 0;
    
    availableLocations.forEach((loc, localIndex) => {
      const resourceCount = Object.values(loc.reward).reduce((sum, val) => sum + val, 0);
      let score = resourceCount;
      
      // Bonus for RESIN and PEBBLE
      if (loc.reward.RESIN) score += 0.5;
      if (loc.reward.PEBBLE) score += 0.5;
      
      if (score > bestScore) {
        bestScore = score;
        bestLocalIndex = localIndex;
      }
    });
    
    // Navigate to best location
    while (gameState.selectedLocationIndex !== bestLocalIndex) {
      gameState.selectedLocationIndex = (gameState.selectedLocationIndex + 1) % availableLocations.length;
    }
    
    return { keyCode: 32, key: ' ' };
    
  } else if (gameState.uiState === UI_STATE_SELECT_CARD) {
    // Select best card based on VP and abilities
    const affordableCards = gameState.hand.filter(card => canAffordCard(card, gameState.resources));
    
    let bestScore = -1;
    let bestLocalIndex = 0;
    
    affordableCards.forEach((card, localIndex) => {
      let score = card.victoryPoints * 10;
      
      // Bonus for production abilities in early game
      if (gameState.currentSeason <= 1 && card.ability && card.ability.startsWith("PRODUCE_")) {
        score += 15;
      }
      
      // Bonus for end game VP cards in late game
      if (gameState.currentSeason >= 2 && card.ability === "END_GAME_VP") {
        score += 20;
      }
      
      // Bonus for worker cards
      if (card.ability === "WORKER") {
        score += 12;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestLocalIndex = localIndex;
      }
    });
    
    // Navigate to best card
    while (gameState.selectedCardIndex !== bestLocalIndex) {
      gameState.selectedCardIndex = (gameState.selectedCardIndex + 1) % affordableCards.length;
    }
    
    return { keyCode: 32, key: ' ' };
  }
  
  return { keyCode: 32, key: ' ' };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getTestBasicAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;