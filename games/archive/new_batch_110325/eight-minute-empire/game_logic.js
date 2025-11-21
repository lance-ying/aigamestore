// game_logic.js - Core game logic

import { gameState, TOTAL_ROUNDS, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { ACTION_RECRUIT, ACTION_MOVE, ACTION_SAIL, ACTION_DESTROY, ACTION_BUILD_CASTLE } from './globals.js';
import { areRegionsAdjacent, canSailBetweenRegions, getContinentForRegion } from './entities.js';

export function selectCard(cardIndex) {
  if (cardIndex < 0 || cardIndex >= gameState.cardMarket.length) return false;
  
  const card = gameState.cardMarket[cardIndex];
  const player = gameState.players[gameState.currentPlayer];
  
  gameState.selectedCardIndex = cardIndex;
  
  // Add resource to player
  player.addResource(card.resource, card.amount);
  
  // Set up action
  gameState.actionData = {
    action: card.action,
    value: card.value,
    executedCount: 0
  };
  
  // Some actions don't require region selection
  if (card.action === ACTION_RECRUIT) {
    gameState.actionState = "SELECT_REGION";
  } else if (card.action === ACTION_MOVE || card.action === ACTION_SAIL) {
    gameState.actionState = "SELECT_REGION";
  } else if (card.action === ACTION_DESTROY) {
    gameState.actionState = "SELECT_REGION";
  } else if (card.action === ACTION_BUILD_CASTLE) {
    gameState.actionState = "SELECT_REGION";
  }
  
  return true;
}

export function executeAction(regionId) {
  if (!gameState.actionData) return false;
  
  const action = gameState.actionData.action;
  const player = gameState.players[gameState.currentPlayer];
  const region = gameState.regions[regionId];
  
  if (!region) return false;
  
  if (action === ACTION_RECRUIT) {
    return executeRecruit(regionId);
  } else if (action === ACTION_MOVE) {
    return executeMove(regionId);
  } else if (action === ACTION_SAIL) {
    return executeSail(regionId);
  } else if (action === ACTION_DESTROY) {
    return executeDestroy(regionId);
  } else if (action === ACTION_BUILD_CASTLE) {
    return executeBuildCastle(regionId);
  }
  
  return false;
}

function executeRecruit(regionId) {
  const player = gameState.players[gameState.currentPlayer];
  const region = gameState.regions[regionId];
  const value = gameState.actionData.value;
  
  // Can only recruit to cities or regions with player's troops
  if (!region.isCity && region.troops[player.id] === 0) {
    gameState.messageText = "Can only recruit to cities or controlled regions!";
    gameState.messageTimer = 60;
    return false;
  }
  
  // Check if player has troops
  if (player.troops < value) {
    gameState.messageText = "Not enough troops available!";
    gameState.messageTimer = 60;
    return false;
  }
  
  // Recruit troops
  region.addTroops(player.id, value);
  player.troops -= value;
  
  gameState.messageText = `Recruited ${value} troops to ${region.name}`;
  gameState.messageTimer = 60;
  
  // Action complete
  finishAction();
  return true;
}

function executeMove(regionId) {
  const player = gameState.players[gameState.currentPlayer];
  const region = gameState.regions[regionId];
  const value = gameState.actionData.value;
  
  if (!gameState.actionData.sourceRegion) {
    // Selecting source region
    if (region.troops[player.id] === 0) {
      gameState.messageText = "No troops to move from this region!";
      gameState.messageTimer = 60;
      return false;
    }
    
    gameState.actionData.sourceRegion = regionId;
    gameState.actionData.troopsToMove = Math.min(value, region.troops[player.id]);
    gameState.messageText = `Moving ${gameState.actionData.troopsToMove} troops. Select destination.`;
    gameState.messageTimer = 60;
    return false;
  } else {
    // Selecting destination region
    const sourceRegion = gameState.regions[gameState.actionData.sourceRegion];
    
    if (regionId === gameState.actionData.sourceRegion) {
      gameState.messageText = "Select a different region!";
      gameState.messageTimer = 60;
      return false;
    }
    
    if (!areRegionsAdjacent(gameState.actionData.sourceRegion, regionId)) {
      gameState.messageText = "Regions must be adjacent!";
      gameState.messageTimer = 60;
      return false;
    }
    
    // Move troops
    const troopsToMove = gameState.actionData.troopsToMove;
    sourceRegion.removeTroops(player.id, troopsToMove);
    region.addTroops(player.id, troopsToMove);
    
    gameState.messageText = `Moved ${troopsToMove} troops`;
    gameState.messageTimer = 60;
    
    finishAction();
    return true;
  }
}

function executeSail(regionId) {
  const player = gameState.players[gameState.currentPlayer];
  const region = gameState.regions[regionId];
  const value = gameState.actionData.value;
  
  if (!gameState.actionData.sourceRegion) {
    // Selecting source region
    if (region.troops[player.id] === 0) {
      gameState.messageText = "No troops to sail from this region!";
      gameState.messageTimer = 60;
      return false;
    }
    
    gameState.actionData.sourceRegion = regionId;
    gameState.actionData.troopsToMove = Math.min(value, region.troops[player.id]);
    gameState.messageText = `Sailing ${gameState.actionData.troopsToMove} troops. Select destination continent.`;
    gameState.messageTimer = 60;
    return false;
  } else {
    // Selecting destination region
    const sourceRegion = gameState.regions[gameState.actionData.sourceRegion];
    
    if (regionId === gameState.actionData.sourceRegion) {
      gameState.messageText = "Select a different region!";
      gameState.messageTimer = 60;
      return false;
    }
    
    if (!canSailBetweenRegions(gameState.actionData.sourceRegion, regionId)) {
      gameState.messageText = "Can only sail between continents!";
      gameState.messageTimer = 60;
      return false;
    }
    
    // Sail troops
    const troopsToMove = gameState.actionData.troopsToMove;
    sourceRegion.removeTroops(player.id, troopsToMove);
    region.addTroops(player.id, troopsToMove);
    
    gameState.messageText = `Sailed ${troopsToMove} troops`;
    gameState.messageTimer = 60;
    
    finishAction();
    return true;
  }
}

function executeDestroy(regionId) {
  const player = gameState.players[gameState.currentPlayer];
  const opponent = gameState.players[1 - player.id];
  const region = gameState.regions[regionId];
  const value = gameState.actionData.value;
  
  // Must have troops in region to destroy
  if (region.troops[player.id] === 0) {
    gameState.messageText = "You need troops in this region!";
    gameState.messageTimer = 60;
    return false;
  }
  
  // Must have enemy troops
  if (region.troops[opponent.id] === 0) {
    gameState.messageText = "No enemy troops to destroy!";
    gameState.messageTimer = 60;
    return false;
  }
  
  // Destroy troops
  const destroyed = Math.min(value, region.troops[opponent.id]);
  region.removeTroops(opponent.id, destroyed);
  
  gameState.messageText = `Destroyed ${destroyed} enemy troops`;
  gameState.messageTimer = 60;
  
  finishAction();
  return true;
}

function executeBuildCastle(regionId) {
  const player = gameState.players[gameState.currentPlayer];
  const region = gameState.regions[regionId];
  
  // Must control the region
  if (region.getController() !== player.id) {
    gameState.messageText = "You must control this region!";
    gameState.messageTimer = 60;
    return false;
  }
  
  // Can't already have a castle
  if (region.castle !== null) {
    gameState.messageText = "Region already has a castle!";
    gameState.messageTimer = 60;
    return false;
  }
  
  // Build castle
  region.castle = player.id;
  player.castles.push(regionId);
  
  gameState.messageText = `Built castle in ${region.name}`;
  gameState.messageTimer = 60;
  
  finishAction();
  return true;
}

function finishAction() {
  // Remove card from market
  if (gameState.selectedCardIndex >= 0) {
    gameState.cardMarket.splice(gameState.selectedCardIndex, 1);
    
    // Draw new card if deck has cards
    if (gameState.cardDeck.length > 0) {
      gameState.cardMarket.push(gameState.cardDeck.pop());
    }
  }
  
  // Clear action state
  gameState.selectedCardIndex = -1;
  gameState.selectedRegionId = -1;
  gameState.actionData = null;
  gameState.actionState = "SELECT_CARD";
  
  // Next player
  nextPlayer();
}

export function nextPlayer() {
  gameState.currentPlayer = 1 - gameState.currentPlayer;
  
  // If back to player 0, increment round
  if (gameState.currentPlayer === 0) {
    gameState.currentRound++;
    
    if (gameState.currentRound >= TOTAL_ROUNDS) {
      endGame();
    }
  }
  
  // If AI turn, trigger AI
  if (gameState.players[gameState.currentPlayer].isAI) {
    setTimeout(() => executeAITurn(), 500);
  }
}

export function endGame() {
  // Calculate final scores
  gameState.players.forEach(player => player.calculateScore());
  
  const player0Score = gameState.players[0].score;
  const player1Score = gameState.players[1].score;
  
  if (player0Score > player1Score) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
  } else {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
  }
}

export function executeAITurn() {
  if (gameState.gamePhase !== "PLAYING") return;
  if (!gameState.players[gameState.currentPlayer].isAI) return;
  
  // Simple AI: pick random valid card and execute
  const validCards = gameState.cardMarket.map((card, idx) => idx);
  
  if (validCards.length === 0) {
    nextPlayer();
    return;
  }
  
  const cardIdx = validCards[Math.floor(Math.random() * validCards.length)];
  selectCard(cardIdx);
  
  // Execute action on random valid region
  setTimeout(() => {
    const validRegions = findValidRegionsForAction();
    if (validRegions.length > 0) {
      const regionId = validRegions[Math.floor(Math.random() * validRegions.length)];
      const success = executeAction(regionId);
      
      // If action needs second step (move/sail), try again
      if (!success && gameState.actionData && gameState.actionData.sourceRegion !== undefined) {
        setTimeout(() => {
          const validRegions2 = findValidRegionsForAction();
          if (validRegions2.length > 0) {
            const regionId2 = validRegions2[Math.floor(Math.random() * validRegions2.length)];
            executeAction(regionId2);
          } else {
            finishAction();
          }
        }, 300);
      }
    } else {
      finishAction();
    }
  }, 500);
}

function findValidRegionsForAction() {
  const playerId = gameState.currentPlayer;
  const action = gameState.actionData?.action;
  
  if (!action) return [];
  
  if (action === ACTION_RECRUIT) {
    return gameState.regions
      .filter(r => r.isCity || r.troops[playerId] > 0)
      .map(r => r.id);
  } else if (action === ACTION_MOVE || action === ACTION_SAIL) {
    if (!gameState.actionData.sourceRegion) {
      return gameState.regions
        .filter(r => r.troops[playerId] > 0)
        .map(r => r.id);
    } else {
      const sourceId = gameState.actionData.sourceRegion;
      if (action === ACTION_MOVE) {
        return gameState.regions[sourceId].adjacent;
      } else {
        return gameState.regions
          .filter(r => canSailBetweenRegions(sourceId, r.id) && r.id !== sourceId)
          .map(r => r.id);
      }
    }
  } else if (action === ACTION_DESTROY) {
    const opponentId = 1 - playerId;
    return gameState.regions
      .filter(r => r.troops[playerId] > 0 && r.troops[opponentId] > 0)
      .map(r => r.id);
  } else if (action === ACTION_BUILD_CASTLE) {
    return gameState.regions
      .filter(r => r.getController() === playerId && r.castle === null)
      .map(r => r.id);
  }
  
  return [];
}

export function cancelAction() {
  gameState.selectedCardIndex = -1;
  gameState.selectedRegionId = -1;
  gameState.actionData = null;
  gameState.actionState = "SELECT_CARD";
  gameState.messageText = "Action cancelled";
  gameState.messageTimer = 60;
}