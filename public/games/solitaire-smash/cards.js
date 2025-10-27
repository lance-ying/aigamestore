import { SUITS, RANKS, CARD_WIDTH, CARD_HEIGHT } from './globals.js';

export class Card {
  constructor(suit, rank, id) {
    this.suit = suit;
    this.rank = rank;
    this.id = id;
    this.isFaceUp = false;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.isAnimating = false;
  }

  getRankValue() {
    return RANKS.indexOf(this.rank);
  }

  isRed() {
    return this.suit === '♥' || this.suit === '♦';
  }

  canStackOnTableau(otherCard) {
    if (!otherCard) return this.rank === 'K';
    return this.getRankValue() === otherCard.getRankValue() - 1 &&
           this.isRed() !== otherCard.isRed();
  }

  canStackOnFoundation(foundationPile) {
    if (foundationPile.length === 0) {
      return this.rank === 'A';
    }
    const topCard = foundationPile[foundationPile.length - 1];
    return this.suit === topCard.suit && 
           this.getRankValue() === topCard.getRankValue() + 1;
  }

  update() {
    if (this.isAnimating) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 2) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isAnimating = false;
      } else {
        this.x += dx * 0.3;
        this.y += dy * 0.3;
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
    p.translate(this.x, this.y);
    
    if (this.isFaceUp) {
      p.fill(255);
      p.stroke(0);
      p.strokeWeight(2);
      p.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, 4);
      
      const color = this.isRed() ? [200, 0, 0] : [0, 0, 0];
      p.fill(...color);
      p.noStroke();
      p.textSize(10);
      p.textAlign(p.LEFT, p.TOP);
      p.text(this.rank, 3, 2);
      p.text(this.suit, 3, 14);
      
      p.textAlign(p.RIGHT, p.BOTTOM);
      p.text(this.rank, CARD_WIDTH - 3, CARD_HEIGHT - 2);
      p.text(this.suit, CARD_WIDTH - 3, CARD_HEIGHT - 14);
      
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text(this.suit, CARD_WIDTH / 2, CARD_HEIGHT / 2);
    } else {
      p.fill(50, 80, 120);
      p.stroke(0);
      p.strokeWeight(2);
      p.rect(0, 0, CARD_WIDTH, CARD_HEIGHT, 4);
      
      p.fill(80, 110, 150);
      p.noStroke();
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
          p.ellipse(10 + i * 15, 15 + j * 20, 8, 8);
        }
      }
    }
    
    p.pop();
  }
}

export function createDeck() {
  const deck = [];
  let id = 0;
  for (let suit of SUITS) {
    for (let rank of RANKS) {
      deck.push(new Card(suit, rank, id++));
    }
  }
  return deck;
}

export function shuffleDeck(deck, seed) {
  const shuffled = [...deck];
  let currentIndex = shuffled.length;
  let randomValue = seed;
  
  const seededRandom = () => {
    randomValue = (randomValue * 9301 + 49297) % 233280;
    return randomValue / 233280;
  };
  
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(seededRandom() * currentIndex);
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomIndex]] = 
      [shuffled[randomIndex], shuffled[currentIndex]];
  }
  
  return shuffled;
}