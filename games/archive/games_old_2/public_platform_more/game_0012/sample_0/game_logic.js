// game_logic.js - Core game logic and mechanics

import { gameState, GAME_PHASES, COLORS, initializeDeck } from './globals.js';
import { generateMap, generateDestinationTickets, checkDestinationTickets } from './map.js';

export function initializeGame(p) {
  // Reset game state
  gameState.score = 0;
  gameState.trainCars = 45;
  gameState.hand = [];
  gameState.destinationTickets = [];
  gameState.claimedRoutes = [];
  gameState.cardsDrawnThisTurn = 0;
  gameState.turnPhase = "ACTION";
  gameState.uiMode = "DRAW_CARDS";
  gameState.selectedCardIndex = 0;
  gameState.selectedRouteIndex = 0;
  gameState.entities = [];
  
  // Initialize map
  const { cities, routes } = generateMap();
  gameState.cities = cities;
  gameState.routes = routes;
  
  // Initialize deck
  gameState.deck = initializeDeck();
  shuffleDeck(p);
  
  // Draw initial hand
  for (let i = 0; i < 4; i++) {
    drawCardFromDeck();
  }
  
  // Draw face up cards
  gameState.faceUpCards = [];
  for (let i = 0; i < 5; i++) {
    drawFaceUpCard();
  }
  
  // Generate and assign destination tickets
  const allTickets = generateDestinationTickets(gameState.cities);
  // Give player 3 random tickets
  for (let i = 0; i < 3; i++) {
    if (allTickets.length > 0) {
      const idx = Math.floor(p.random() * allTickets.length);
      gameState.destinationTickets.push(allTickets.splice(idx, 1)[0]);
    }
  }
  
  // Create player entity (for logging purposes)
  gameState.player = {
    x: 300,
    y: 200,
    gameX: 300,
    gameY: 200
  };
  gameState.entities.push(gameState.player);
}

function shuffleDeck(p) {
  // Fisher-Yates shuffle
  for (let i = gameState.deck.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
  }
}

function drawCardFromDeck() {
  if (gameState.deck.length === 0) {
    return null;
  }
  const card = gameState.deck.pop();
  gameState.hand.push(card);
  return card;
}

function drawFaceUpCard() {
  if (gameState.deck.length === 0) {
    return null;
  }
  const card = gameState.deck.pop();
  gameState.faceUpCards.push(card);
  return card;
}

export function handleDrawCard(selectedIndex) {
  if (gameState.cardsDrawnThisTurn >= 2) {
    return false; // Can't draw more than 2 cards per turn
  }
  
  let drawnCard = null;
  
  if (selectedIndex >= 0 && selectedIndex < 5) {
    // Draw from face up
    drawnCard = gameState.faceUpCards[selectedIndex];
    gameState.hand.push(drawnCard);
    gameState.faceUpCards.splice(selectedIndex, 1);
    
    // Replace face up card
    drawFaceUpCard();
    
    // If drew a wild, that counts as both draws
    if (drawnCard === COLORS.WILD) {
      gameState.cardsDrawnThisTurn = 2;
    } else {
      gameState.cardsDrawnThisTurn++;
    }
  } else if (selectedIndex === 5) {
    // Draw from deck
    drawnCard = drawCardFromDeck();
    if (drawnCard) {
      gameState.cardsDrawnThisTurn++;
    }
  }
  
  // Reset selection
  if (gameState.selectedCardIndex > 0) {
    gameState.selectedCardIndex = 0;
  }
  
  return drawnCard !== null;
}

export function canClaimRoute(routeIndex) {
  if (routeIndex < 0 || routeIndex >= gameState.routes.length) {
    return false;
  }
  
  const route = gameState.routes[routeIndex];
  
  // Check if already claimed
  if (gameState.claimedRoutes.includes(routeIndex)) {
    return false;
  }
  
  // Check if player has enough train cars
  if (gameState.trainCars < route.length) {
    return false;
  }
  
  // Count cards of the route color and wilds
  let colorCount = 0;
  let wildCount = 0;
  
  for (let card of gameState.hand) {
    if (card === route.color) {
      colorCount++;
    } else if (card === COLORS.WILD) {
      wildCount++;
    }
  }
  
  // Check if we have enough cards
  const totalUsable = colorCount + wildCount;
  return totalUsable >= route.length;
}

export function claimRoute(routeIndex) {
  if (!canClaimRoute(routeIndex)) {
    return false;
  }
  
  const route = gameState.routes[routeIndex];
  
  // Remove cards from hand
  let cardsNeeded = route.length;
  const newHand = [];
  
  // First, remove matching color cards
  for (let card of gameState.hand) {
    if (cardsNeeded > 0 && card === route.color) {
      cardsNeeded--;
    } else {
      newHand.push(card);
    }
  }
  
  // Then, remove wilds if needed
  if (cardsNeeded > 0) {
    const finalHand = [];
    for (let card of newHand) {
      if (cardsNeeded > 0 && card === COLORS.WILD) {
        cardsNeeded--;
      } else {
        finalHand.push(card);
      }
    }
    gameState.hand = finalHand;
  } else {
    gameState.hand = newHand;
  }
  
  // Claim the route
  gameState.claimedRoutes.push(routeIndex);
  gameState.trainCars -= route.length;
  
  // Award points based on route length
  const points = [0, 1, 2, 4, 7, 10, 15][Math.min(route.length, 6)];
  gameState.score += points;
  
  // Check if any tickets completed
  checkDestinationTickets(gameState.claimedRoutes, gameState.routes, gameState.destinationTickets);
  
  // Reset turn
  gameState.cardsDrawnThisTurn = 0;
  
  return true;
}

export function checkGameEnd() {
  // Game ends when train cars <= 2
  if (gameState.trainCars <= 2) {
    calculateFinalScore();
    
    // Determine win/lose
    if (gameState.score >= 50) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    } else {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    }
    
    return true;
  }
  
  return false;
}

function calculateFinalScore() {
  // Add/subtract ticket points
  for (let ticket of gameState.destinationTickets) {
    if (ticket.completed) {
      gameState.score += ticket.points;
    } else {
      gameState.score -= ticket.points;
    }
  }
}

export function updateGame() {
  // Check for game end
  checkGameEnd();
  
  // Update player position (for logging)
  if (gameState.player) {
    gameState.player.x = 300;
    gameState.player.y = 200;
    gameState.player.gameX = 300;
    gameState.player.gameY = 200;
  }
}