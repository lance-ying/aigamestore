// gameLogic.js - Core game logic

import { gameState, PHASE_PLAYING, PHASE_GAME_OVER_WIN, SEASONS, ACTION_PLACE_WORKER, ACTION_PLAY_CARD, ACTION_PREPARE_SEASON, UI_STATE_SELECT_ACTION, UI_STATE_SELECT_LOCATION, UI_STATE_SELECT_CARD } from './globals.js';
import { createDeck, canAffordCard, payForCard, applyCardAbility, calculateEndGameBonus } from './cards.js';
import { createLocations } from './locations.js';

export function initializeGame(p) {
  gameState.currentSeason = 0;
  gameState.turnNumber = 0;
  gameState.score = 0;
  
  gameState.resources.BERRY = 3;
  gameState.resources.TWIG = 2;
  gameState.resources.RESIN = 1;
  gameState.resources.PEBBLE = 0;
  
  gameState.city = [];
  gameState.hand = [];
  gameState.deck = shuffleArray(createDeck(), p);
  
  // Draw initial hand
  for (let i = 0; i < 5; i++) {
    if (gameState.deck.length > 0) {
      gameState.hand.push(gameState.deck.pop());
    }
  }
  
  gameState.locations = createLocations();
  gameState.workers = [];
  gameState.availableWorkers = 2;
  
  gameState.uiState = UI_STATE_SELECT_ACTION;
  gameState.selectedActionIndex = 0;
  gameState.selectedLocationIndex = 0;
  gameState.selectedCardIndex = 0;
  
  gameState.message = "";
  gameState.messageTimer = 0;
}

export function shuffleArray(array, p) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getAvailableActions() {
  const actions = [];
  
  // Can place worker if we have workers and available locations
  if (gameState.availableWorkers > 0) {
    const hasAvailableLocation = gameState.locations.some(loc => loc.canPlaceWorker());
    if (hasAvailableLocation) {
      actions.push(ACTION_PLACE_WORKER);
    }
  }
  
  // Can play card if we have cards in hand, space in city, and can afford at least one
  if (gameState.hand.length > 0 && gameState.city.length < 15) {
    const canAffordAny = gameState.hand.some(card => canAffordCard(card, gameState.resources));
    if (canAffordAny) {
      actions.push(ACTION_PLAY_CARD);
    }
  }
  
  // Can always prepare for next season
  actions.push(ACTION_PREPARE_SEASON);
  
  return actions;
}

export function placeWorker(locationIndex) {
  const location = gameState.locations[locationIndex];
  
  if (!location.canPlaceWorker()) {
    return false;
  }
  
  if (gameState.availableWorkers <= 0) {
    return false;
  }
  
  const worker = { location: locationIndex };
  location.placeWorker(worker);
  gameState.workers.push(worker);
  gameState.availableWorkers--;
  
  // Collect resources
  for (const [resourceType, amount] of Object.entries(location.reward)) {
    gameState.resources[resourceType] += amount;
  }
  
  gameState.turnNumber++;
  gameState.uiState = UI_STATE_SELECT_ACTION;
  gameState.selectedActionIndex = 0;
  
  showMessage(`Placed worker at ${location.name}`);
  
  return true;
}

export function playCard(cardIndex) {
  const card = gameState.hand[cardIndex];
  
  if (!card) return false;
  if (gameState.city.length >= 15) return false;
  if (!canAffordCard(card, gameState.resources)) return false;
  
  // Pay cost
  payForCard(card, gameState.resources);
  
  // Add to city
  gameState.city.push(card);
  gameState.hand.splice(cardIndex, 1);
  
  // Apply ability
  applyCardAbility(card, gameState);
  
  // Draw a card to replenish hand
  if (gameState.deck.length > 0) {
    gameState.hand.push(gameState.deck.pop());
  }
  
  gameState.turnNumber++;
  gameState.uiState = UI_STATE_SELECT_ACTION;
  gameState.selectedActionIndex = 0;
  
  showMessage(`Played ${card.name}`);
  
  return true;
}

export function prepareForNextSeason() {
  // Recall all workers
  gameState.locations.forEach(loc => loc.removeAllWorkers());
  gameState.workers = [];
  gameState.availableWorkers = 2;
  
  // Apply resource production from city
  gameState.city.forEach(card => {
    if (card.ability && card.ability.startsWith("PRODUCE_")) {
      applyCardAbility(card, gameState);
    }
  });
  
  // Advance season
  gameState.currentSeason++;
  
  // Grant bonus workers in later seasons
  if (gameState.currentSeason === 1) { // Summer
    gameState.availableWorkers += 1;
  } else if (gameState.currentSeason === 2) { // Autumn
    gameState.availableWorkers += 1;
  } else if (gameState.currentSeason === 3) { // Winter
    gameState.availableWorkers += 1;
  }
  
  // Check if game is over
  if (gameState.currentSeason >= 4) {
    endGame();
  } else {
    showMessage(`Prepared for ${SEASONS[gameState.currentSeason]}`);
  }
  
  gameState.turnNumber++;
  gameState.uiState = UI_STATE_SELECT_ACTION;
  gameState.selectedActionIndex = 0;
}

export function endGame() {
  // Calculate final score
  let totalScore = 0;
  
  // Points from cards
  gameState.city.forEach(card => {
    totalScore += card.victoryPoints;
  });
  
  // End game bonuses
  totalScore += calculateEndGameBonus(gameState);
  
  // Resource conversion (every 3 resources = 1 point)
  const totalResources = Object.values(gameState.resources).reduce((sum, val) => sum + val, 0);
  totalScore += Math.floor(totalResources / 3);
  
  gameState.score = totalScore;
  gameState.gamePhase = PHASE_GAME_OVER_WIN;
}

export function showMessage(msg) {
  gameState.message = msg;
  gameState.messageTimer = 120; // Show for 2 seconds at 60fps
}

export function updateGame() {
  if (gameState.messageTimer > 0) {
    gameState.messageTimer--;
  }
}