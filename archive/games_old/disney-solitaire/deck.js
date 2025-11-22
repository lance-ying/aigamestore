import { Card } from './card.js';
import { SUITS, RANKS } from './globals.js';

export function createDeck(p) {
  const deck = [];
  for (let suit of SUITS) {
    for (let rank of RANKS) {
      deck.push(new Card(rank, suit));
    }
  }
  return shuffleDeck(deck, p);
}

export function shuffleDeck(deck, p) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}