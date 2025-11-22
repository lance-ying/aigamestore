import { CARD_WIDTH, CARD_HEIGHT, SUITS, RANKS, RANK_VALUES } from './globals.js';

export class Card {
  constructor(rank, suit, isFaceUp = false) {
    this.rank = rank;
    this.suit = suit;
    this.isFaceUp = isFaceUp;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.isAnimating = false;
  }

  getRankValue() {
    return RANK_VALUES[this.rank];
  }

  isRed() {
    return this.suit === '♥' || this.suit === '♦';
  }

  canPlaceOn(otherCard) {
    if (!otherCard) return true; // Can place on empty column
    return this.getRankValue() === otherCard.getRankValue() - 1;
  }

  draw(p, isSelected = false, isDragging = false, alpha = 255) {
    p.push();
    if (isDragging) {
      p.fill(255, 255, 255, 100);
      p.rect(this.x - 2, this.y - 2, CARD_WIDTH + 4, CARD_HEIGHT + 4, 5);
    }
    
    if (isSelected) {
      p.fill(255, 255, 0, 150);
      p.noStroke();
      p.rect(this.x - 3, this.y - 3, CARD_WIDTH + 6, CARD_HEIGHT + 6, 5);
    }

    p.stroke(0);
    p.strokeWeight(2);
    
    if (this.isFaceUp) {
      p.fill(255, 255, 255, alpha);
      p.rect(this.x, this.y, CARD_WIDTH, CARD_HEIGHT, 4);
      
      const color = this.isRed() ? [200, 0, 0, alpha] : [0, 0, 0, alpha];
      p.fill(...color);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text(this.suit, this.x + CARD_WIDTH / 2, this.y + 15);
      p.textSize(14);
      p.text(this.rank, this.x + CARD_WIDTH / 2, this.y + CARD_HEIGHT - 15);
    } else {
      p.fill(50, 100, 150, alpha);
      p.rect(this.x, this.y, CARD_WIDTH, CARD_HEIGHT, 4);
      
      p.fill(100, 150, 200, alpha);
      p.noStroke();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
          p.ellipse(this.x + 10 + i * 12, this.y + 10 + j * 15, 5, 5);
        }
      }
    }
    p.pop();
  }

  contains(x, y) {
    return x >= this.x && x <= this.x + CARD_WIDTH && y >= this.y && y <= this.y + CARD_HEIGHT;
  }

  updatePosition(p) {
    if (this.isAnimating) {
      const speed = 0.3;
      this.x = p.lerp(this.x, this.targetX, speed);
      this.y = p.lerp(this.y, this.targetY, speed);
      
      if (Math.abs(this.x - this.targetX) < 0.5 && Math.abs(this.y - this.targetY) < 0.5) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isAnimating = false;
      }
    }
  }
}