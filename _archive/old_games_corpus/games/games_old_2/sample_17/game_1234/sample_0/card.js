// card.js - Card class and utilities

import { SUITS, RANKS } from './globals.js';

export class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
    this.faceUp = false;
    this.x = 0;
    this.y = 0;
  }

  get color() {
    return (this.suit === '♥' || this.suit === '♦') ? 'red' : 'black';
  }

  get rankValue() {
    return RANKS.indexOf(this.rank) + 1;
  }

  canPlaceOnTableau(otherCard) {
    if (!otherCard) {
      return this.rank === 'K';
    }
    return this.color !== otherCard.color && 
           this.rankValue === otherCard.rankValue - 1;
  }

  canPlaceOnFoundation(foundationPile) {
    if (foundationPile.length === 0) {
      return this.rank === 'A';
    }
    const topCard = foundationPile[foundationPile.length - 1];
    return this.suit === topCard.suit && 
           this.rankValue === topCard.rankValue + 1;
  }

  draw(p, alpha = 255) {
    p.push();
    p.translate(this.x, this.y);
    
    if (this.faceUp) {
      // Face-up card
      p.fill(255, 255, 255, alpha);
      p.stroke(0, alpha);
      p.strokeWeight(2);
      p.rect(0, 0, 50, 70, 5);
      
      // Rank and suit
      if (this.color === 'red') {
        p.fill(220, 20, 20, alpha);
      } else {
        p.fill(0, 0, 0, alpha);
      }
      p.noStroke();
      p.textSize(12);
      p.textAlign(p.LEFT, p.TOP);
      p.text(this.rank, 3, 3);
      p.textAlign(p.RIGHT, p.BOTTOM);
      p.text(this.rank, 47, 67);
      
      p.textSize(18);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.suit, 25, 35);
    } else {
      // Face-down card
      p.fill(50, 100, 180, alpha);
      p.stroke(0, alpha);
      p.strokeWeight(2);
      p.rect(0, 0, 50, 70, 5);
      
      // Pattern
      p.stroke(30, 60, 120, alpha);
      p.strokeWeight(1);
      for (let i = 10; i < 50; i += 10) {
        p.line(i, 10, i, 60);
      }
      for (let i = 10; i < 70; i += 10) {
        p.line(10, i, 40, i);
      }
    }
    p.pop();
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