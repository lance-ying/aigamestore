// cards.js - Card management

import { CARD_COLORS, VISIBLE_CARD_COUNT } from './globals.js';
import { gameState } from './globals.js';
import { shuffleArray } from './board.js';

export function initializeCards(p) {
  // Create train card deck (12 of each color)
  gameState.trainCardDeck = [];
  CARD_COLORS.forEach(colorObj => {
    for (let i = 0; i < 12; i++) {
      gameState.trainCardDeck.push(colorObj.name);
    }
  });
  
  shuffleArray(gameState.trainCardDeck, p);
  gameState.trainCardDiscard = [];
  
  // Deal visible cards
  gameState.visibleCards = [];
  for (let i = 0; i < VISIBLE_CARD_COUNT; i++) {
    if (gameState.trainCardDeck.length > 0) {
      gameState.visibleCards.push(gameState.trainCardDeck.pop());
    }
  }
}

export function drawTrainCard(fromVisible, visibleIndex, p) {
  let card = null;
  
  if (fromVisible && visibleIndex >= 0 && visibleIndex < gameState.visibleCards.length) {
    card = gameState.visibleCards[visibleIndex];
    // Replace visible card
    if (gameState.trainCardDeck.length > 0) {
      gameState.visibleCards[visibleIndex] = gameState.trainCardDeck.pop();
    } else {
      gameState.visibleCards.splice(visibleIndex, 1);
    }
  } else if (!fromVisible) {
    if (gameState.trainCardDeck.length > 0) {
      card = gameState.trainCardDeck.pop();
    } else if (gameState.trainCardDiscard.length > 0) {
      // Reshuffle discard pile
      gameState.trainCardDeck = [...gameState.trainCardDiscard];
      gameState.trainCardDiscard = [];
      shuffleArray(gameState.trainCardDeck, p);
      if (gameState.trainCardDeck.length > 0) {
        card = gameState.trainCardDeck.pop();
      }
    }
  }
  
  return card;
}

export function drawDestinationTickets(count, p) {
  const drawn = [];
  for (let i = 0; i < count && gameState.destinationDeck.length > 0; i++) {
    drawn.push(gameState.destinationDeck.pop());
  }
  return drawn;
}