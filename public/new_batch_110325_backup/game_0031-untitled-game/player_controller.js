// player_controller.js - Human and AI player control

import { gameState, GAME_PHASES } from './globals.js';
import { drawTrainCard, drawDestinationTickets } from './cards.js';
import { claimRoute, nextTurn } from './game_logic.js';

export function handlePlayerInput(keyCode, p) {
  const player = gameState.players[gameState.currentPlayerIndex];
  
  if (gameState.turnPhase === "CHOOSE_ACTION") {
    handleActionSelection(keyCode, p);
  } else if (gameState.turnPhase === "DRAWING_CARDS") {
    handleCardDrawing(keyCode, p);
  } else if (gameState.turnPhase === "CLAIMING_ROUTE") {
    handleRouteClaiming(keyCode, p);
  } else if (gameState.turnPhase === "CHOOSING_DESTINATIONS") {
    handleDestinationChoice(keyCode, p);
  }
}

function handleActionSelection(keyCode, p) {
  const actions = ["Draw Cards", "Claim Route", "Draw Destinations"];
  
  if (keyCode === 38) { // UP
    gameState.menuSelection = (gameState.menuSelection - 1 + actions.length) % actions.length;
  } else if (keyCode === 40) { // DOWN
    gameState.menuSelection = (gameState.menuSelection + 1) % actions.length;
  } else if (keyCode === 32) { // SPACE
    gameState.selectedAction = actions[gameState.menuSelection];
    
    if (gameState.selectedAction === "Draw Cards") {
      gameState.turnPhase = "DRAWING_CARDS";
      gameState.menuSelection = 0;
      gameState.cardsDrawnThisTurn = 0;
    } else if (gameState.selectedAction === "Claim Route") {
      gameState.turnPhase = "CLAIMING_ROUTE";
      gameState.menuSelection = 0;
      gameState.selectedRouteIndex = -1;
    } else if (gameState.selectedAction === "Draw Destinations") {
      const newDestinations = drawDestinationTickets(3, p);
      if (newDestinations.length > 0) {
        gameState.tempDestinations = newDestinations;
        gameState.turnPhase = "CHOOSING_DESTINATIONS";
        gameState.menuSelection = 0;
        gameState.selectedCardIndices = [];
      } else {
        // No destinations available, end turn
        nextTurn(p);
      }
    }
  }
}

function handleCardDrawing(keyCode, p) {
  const player = gameState.players[gameState.currentPlayerIndex];
  
  if (keyCode === 90) { // Z - Cancel
    gameState.turnPhase = "CHOOSE_ACTION";
    gameState.cardsDrawnThisTurn = 0;
    gameState.menuSelection = 0;
    return;
  }
  
  const totalOptions = gameState.visibleCards.length + 1; // visible + deck
  
  if (keyCode === 37) { // LEFT
    gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.menuSelection = Math.min(totalOptions - 1, gameState.menuSelection + 1);
  } else if (keyCode === 32) { // SPACE
    let card = null;
    
    if (gameState.menuSelection < gameState.visibleCards.length) {
      card = drawTrainCard(true, gameState.menuSelection, p);
    } else {
      card = drawTrainCard(false, -1, p);
    }
    
    if (card) {
      player.addCard(card);
      gameState.cardsDrawnThisTurn++;
      
      p.logs.game_info.push({
        data: { 
          action: "DRAW_CARD",
          player: gameState.currentPlayerIndex,
          color: card
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      if (gameState.cardsDrawnThisTurn >= 2) {
        nextTurn(p);
      } else {
        gameState.menuSelection = 0;
      }
    }
  }
}

function handleRouteClaiming(keyCode, p) {
  if (keyCode === 90) { // Z - Cancel
    gameState.turnPhase = "CHOOSE_ACTION";
    gameState.selectedRouteIndex = -1;
    gameState.menuSelection = 0;
    return;
  }
  
  const unclaimedRoutes = gameState.routes
    .map((route, index) => ({ route, index }))
    .filter(item => item.route.claimedBy === -1);
  
  if (unclaimedRoutes.length === 0) {
    gameState.turnPhase = "CHOOSE_ACTION";
    return;
  }
  
  if (keyCode === 38) { // UP
    gameState.menuSelection = (gameState.menuSelection - 1 + unclaimedRoutes.length) % unclaimedRoutes.length;
  } else if (keyCode === 40) { // DOWN
    gameState.menuSelection = (gameState.menuSelection + 1) % unclaimedRoutes.length;
  } else if (keyCode === 32) { // SPACE
    const selectedRouteData = unclaimedRoutes[gameState.menuSelection];
    if (claimRoute(selectedRouteData.index, p)) {
      nextTurn(p);
    }
  }
}

function handleDestinationChoice(keyCode, p) {
  const player = gameState.players[gameState.currentPlayerIndex];
  
  if (keyCode === 38) { // UP
    gameState.menuSelection = Math.max(0, gameState.menuSelection - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.menuSelection = Math.min(gameState.tempDestinations.length - 1, gameState.menuSelection + 1);
  } else if (keyCode === 32) { // SPACE - Toggle selection
    const index = gameState.selectedCardIndices.indexOf(gameState.menuSelection);
    if (index === -1) {
      gameState.selectedCardIndices.push(gameState.menuSelection);
    } else {
      gameState.selectedCardIndices.splice(index, 1);
    }
  } else if (keyCode === 90) { // Z - Confirm (must keep at least 1)
    if (gameState.selectedCardIndices.length > 0) {
      gameState.selectedCardIndices.forEach(index => {
        player.destinationTickets.push(gameState.tempDestinations[index]);
      });
      
      p.logs.game_info.push({
        data: { 
          action: "DRAW_DESTINATIONS",
          player: gameState.currentPlayerIndex,
          count: gameState.selectedCardIndices.length
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      gameState.tempDestinations = [];
      nextTurn(p);
    }
  }
}

export function executeAITurn(p) {
  const player = gameState.players[gameState.currentPlayerIndex];
  
  // Simple AI logic
  if (Math.random() < 0.7) {
    // Try to claim a route
    const unclaimedRoutes = gameState.routes
      .map((route, index) => ({ route, index }))
      .filter(item => item.route.claimedBy === -1);
    
    for (const { route, index } of unclaimedRoutes) {
      if (claimRoute(index, p)) {
        nextTurn(p);
        return;
      }
    }
  }
  
  // Otherwise draw cards
  const card1 = drawTrainCard(false, -1, p);
  if (card1) player.addCard(card1);
  
  const card2 = drawTrainCard(false, -1, p);
  if (card2) player.addCard(card2);
  
  nextTurn(p);
}