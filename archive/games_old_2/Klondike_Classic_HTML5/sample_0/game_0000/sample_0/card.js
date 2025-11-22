// card.js - Card class and utilities
import { CARD_WIDTH, CARD_HEIGHT, SUITS } from './globals.js';

export class Card {
  constructor(suit, rank, p) {
    this.suit = suit;
    this.rank = rank;
    this.isFaceUp = false;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.p = p;
    this.animating = false;
    this.animProgress = 0;
  }

  getRankValue() {
    const rankValues = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
    return rankValues[this.rank];
  }

  getColor() {
    return (this.suit === '♥' || this.suit === '♦') ? 'red' : 'black';
  }

  moveTo(x, y, animate = true) {
    this.targetX = x;
    this.targetY = y;
    if (animate) {
      this.animating = true;
      this.animProgress = 0;
    } else {
      this.x = x;
      this.y = y;
      this.animating = false;
    }
  }

  update() {
    if (this.animating) {
      this.animProgress += 0.15;
      if (this.animProgress >= 1) {
        this.animProgress = 1;
        this.animating = false;
      }
      this.x = this.p.lerp(this.x, this.targetX, this.animProgress);
      this.y = this.p.lerp(this.y, this.targetY, this.animProgress);
    }
  }

  draw() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Card background
    if (this.isFaceUp) {
      this.p.fill(255);
    } else {
      this.p.fill(40, 60, 120);
    }
    this.p.stroke(0);
    this.p.strokeWeight(2);
    this.p.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, 4);
    
    if (this.isFaceUp) {
      // Draw rank and suit
      const color = this.getColor() === 'red' ? [200, 0, 0] : [0, 0, 0];
      this.p.fill(...color);
      this.p.noStroke();
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(12);
      this.p.text(this.rank, CARD_WIDTH / 2, CARD_HEIGHT / 4);
      this.p.textSize(16);
      this.p.text(this.suit, CARD_WIDTH / 2, CARD_HEIGHT / 2);
      this.p.textSize(12);
      this.p.text(this.rank, CARD_WIDTH / 2, CARD_HEIGHT * 3 / 4);
    } else {
      // Draw card back pattern
      this.p.noFill();
      this.p.stroke(100, 150, 200);
      this.p.strokeWeight(1);
      for (let i = 0; i < 5; i++) {
        this.p.rect(5 + i * 3, 5 + i * 3, CARD_WIDTH - 10 - i * 6, CARD_HEIGHT - 10 - i * 6, 2);
      }
    }
    
    this.p.pop();
  }

  contains(x, y) {
    return x >= this.x && x <= this.x + CARD_WIDTH && y >= this.y && y <= this.y + CARD_HEIGHT;
  }
}

export function createDeck(p) {
  const deck = [];
  for (let suit of SUITS) {
    for (let rank of RANKS) {
      deck.push(new Card(suit, rank, p));
    }
  }
  return deck;
}

export function shuffleDeck(deck, p) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(p.random(i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}