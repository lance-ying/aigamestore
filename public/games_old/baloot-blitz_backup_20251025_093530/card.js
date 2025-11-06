// card.js - Card class and related functions
import { CARD_WIDTH, CARD_HEIGHT, RANKS, SUITS } from './globals.js';

export class Card {
  constructor(rank, suit, x, y) {
    this.rank = rank;
    this.suit = suit;
    this.x = x;
    this.y = y;
    this.targetY = y;
    this.vx = 0;
    this.vy = 0;
    this.gridRow = -1;
    this.gridCol = -1;
    this.isSettled = false;
    this.alpha = 255;
    this.scale = 1;
    this.clearing = false;
  }

  update() {
    if (!this.isSettled) {
      // Smooth movement to target
      if (Math.abs(this.y - this.targetY) > 1) {
        this.y += (this.targetY - this.y) * 0.3;
      } else {
        this.y = this.targetY;
      }
    }

    if (this.clearing) {
      this.alpha -= 15;
      this.scale -= 0.05;
      if (this.alpha <= 0) {
        this.alpha = 0;
      }
      if (this.scale <= 0) {
        this.scale = 0;
      }
    }
  }

  draw(p, highlight = false) {
    p.push();
    p.translate(this.x + CARD_WIDTH / 2, this.y + CARD_HEIGHT / 2);
    p.scale(this.scale);
    p.translate(-(CARD_WIDTH / 2), -(CARD_HEIGHT / 2));

    // Card background
    p.fill(255, this.alpha);
    p.stroke(0, this.alpha);
    if (highlight) {
      p.strokeWeight(3);
      p.stroke(255, 255, 0, this.alpha);
    } else {
      p.strokeWeight(2);
    }
    p.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, 5);

    // Rank
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    const isRed = this.suit === '♥' || this.suit === '♦';
    p.fill(...(isRed ? [200, 0, 0, this.alpha] : [0, 0, 0, this.alpha]));
    p.noStroke();
    p.text(this.rank, CARD_WIDTH / 2, CARD_HEIGHT * 0.35);

    // Suit
    p.textSize(24);
    p.text(this.suit, CARD_WIDTH / 2, CARD_HEIGHT * 0.65);

    p.pop();
  }

  getRankValue() {
    return RANKS.indexOf(this.rank);
  }

  matches(otherCard) {
    return this.rank === otherCard.rank;
  }

  sameSuit(otherCard) {
    return this.suit === otherCard.suit;
  }
}

export function createRandomCard(x, y) {
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  return new Card(rank, suit, x, y);
}