import { Card } from './card.js';
import { SUITS, RANKS } from './globals.js';

export function createDeck(numSuits) {
  const deck = [];
  const suitsToUse = SUITS.slice(0, numSuits);
  
  for (let deckNum = 0; deckNum < 2; deckNum++) {
    for (let suit of suitsToUse) {
      for (let rank of RANKS) {
        deck.push(new Card(rank, suit));
      }
    }
  }
  
  return deck;
}

export function shuffleDeck(deck, p) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}