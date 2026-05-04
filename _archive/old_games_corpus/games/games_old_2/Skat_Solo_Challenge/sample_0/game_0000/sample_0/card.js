// card.js - Card class and deck management

import { SUITS, RANKS, CARD_VALUES } from './globals.js';

export class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.value = CARD_VALUES[rank];
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.faceUp = false;
  }
  
  updatePosition() {
    const speed = 0.2;
    this.x += (this.targetX - this.x) * speed;
    this.y += (this.targetY - this.y) * speed;
  }
  
  getSuitSymbol() {
    const symbols = {
      'CLUBS': '♣',
      'SPADES': '♠',
      'HEARTS': '♥',
      'DIAMONDS': '♦'
    };
    return symbols[this.suit];
  }
  
  getSuitColor(p) {
    if (this.suit === 'HEARTS' || this.suit === 'DIAMONDS') {
      return [200, 50, 50];
    }
    return [30, 30, 30];
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
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}