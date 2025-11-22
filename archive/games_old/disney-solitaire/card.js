import { CARD_WIDTH, CARD_HEIGHT, SUITS, RANKS } from './globals.js';

export class Card {
  constructor(rank, suit) {
    this.rank = rank;
    this.suit = suit;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.isFaceUp = false;
    this.isCovered = false;
    this.isAnimating = false;
    this.animationSpeed = 0.3;
  }

  getRankValue() {
    return RANKS.indexOf(this.rank);
  }

  canMatch(otherCard) {
    if (!otherCard) return false;
    const myValue = this.getRankValue();
    const otherValue = otherCard.getRankValue();
    const diff = Math.abs(myValue - otherValue);
    return diff === 1 || diff === 12; // Adjacent or wrap-around (A-K)
  }

  update() {
    if (this.isAnimating) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isAnimating = false;
      } else {
        this.x += dx * this.animationSpeed;
        this.y += dy * this.animationSpeed;
      }
    }
  }

  moveTo(x, y, animate = true) {
    this.targetX = x;
    this.targetY = y;
    if (animate) {
      this.isAnimating = true;
    } else {
      this.x = x;
      this.y = y;
    }
  }

  draw(p) {
    p.push();
    
    // Card background
    if (this.isFaceUp) {
      p.fill(250, 248, 245);
    } else {
      // Disney-themed card back
      p.fill(80, 40, 120);
    }
    p.stroke(50);
    p.strokeWeight(2);
    p.rect(this.x, this.y, CARD_WIDTH, CARD_HEIGHT, 4);

    if (this.isFaceUp) {
      // Draw rank and suit
      const isRed = this.suit === '♥' || this.suit === '♦';
      p.fill(...(isRed ? [220, 20, 60] : [0, 0, 0]));
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text(this.rank, this.x + CARD_WIDTH / 2, this.y + CARD_HEIGHT / 2 - 8);
      p.textSize(20);
      p.text(this.suit, this.x + CARD_WIDTH / 2, this.y + CARD_HEIGHT / 2 + 10);
    } else {
      // Card back pattern
      p.noStroke();
      p.fill(150, 100, 200);
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
          p.ellipse(
            this.x + 10 + i * 15,
            this.y + 10 + j * 15,
            8, 8
          );
        }
      }
    }
    
    p.pop();
  }
}