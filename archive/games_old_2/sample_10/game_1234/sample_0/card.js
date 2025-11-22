// card.js - Card class and deck utilities

import { SUITS, RANKS, RANK_VALUES } from './globals.js';

export class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.faceUp = false;
    this.value = RANK_VALUES[rank];
  }

  isRed() {
    return this.suit === '♥' || this.suit === '♦';
  }

  isBlack() {
    return this.suit === '♠' || this.suit === '♣';
  }

  canPlaceOnTableau(otherCard) {
    if (!otherCard) return this.rank === 'K';
    return this.value === otherCard.value - 1 && 
           ((this.isRed() && otherCard.isBlack()) || (this.isBlack() && otherCard.isRed()));
  }

  canPlaceOnFoundation(foundationPile) {
    if (foundationPile.length === 0) return this.rank === 'A';
    const topCard = foundationPile[foundationPile.length - 1];
    return this.suit === topCard.suit && this.value === topCard.value + 1;
  }
}

export function createDeck() {
  const deck = [];
  for (let suit of SUITS) {
    for (let rank of RANKS) {
      deck.push(new Card(suit, rank));
    }
  }
  return deck;
}

export function shuffleDeck(deck, p) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}