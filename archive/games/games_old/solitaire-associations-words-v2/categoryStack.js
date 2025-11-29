// categoryStack.js - Category stack management

import { Card } from './card.js';
import { CARD_WIDTH, CARD_HEIGHT, CARD_SPACING } from './globals.js';

export class CategoryStack {
  constructor(categoryName, x, y) {
    this.categoryName = categoryName;
    this.x = x;
    this.y = y;
    this.cards = []; // Cards in this stack (category card at index 0)
    this.maxWords = 0; // Set when level initializes
    this.complete = false;
  }

  addCard(card, animate = false) {
    this.cards.push(card);
    this.updateCardPositions(animate);
    this.checkComplete();
  }

  removeTopCard() {
    if (this.cards.length > 1) { // Keep category card
      const card = this.cards.pop();
      this.complete = false;
      return card;
    }
    return null;
  }

  updateCardPositions(animate = false) {
    for (let i = 0; i < this.cards.length; i++) {
      const offsetY = i * 20; // Stack cards vertically with offset
      this.cards[i].setPosition(this.x, this.y + offsetY, animate);
    }
  }

  checkComplete() {
    if (this.cards.length === this.maxWords + 1) { // +1 for category card
      this.complete = true;
    }
  }

  canAcceptCard(card) {
    if (this.cards.length === 0) return false; // Need category card first
    if (!card || card.isCategory) return false;
    if (card.category !== this.categoryName) return false;
    if (this.complete) return false;
    
    // Check if word is already in stack
    for (let i = 1; i < this.cards.length; i++) {
      if (this.cards[i].text === card.text) return false;
    }
    
    return true;
  }

  draw(p, isSelected = false) {
    // Draw all cards in stack
    for (let i = 0; i < this.cards.length; i++) {
      const isTop = i === this.cards.length - 1;
      this.cards[i].draw(p, isSelected && isTop);
    }
    
    // Draw completion indicator
    if (this.complete) {
      p.push();
      p.noFill();
      p.stroke(100, 255, 100);
      p.strokeWeight(3);
      p.rect(this.x - 3, this.y - 3, CARD_WIDTH + 6, CARD_HEIGHT + 6, 8);
      p.pop();
    }
  }
}