// card.js - Card entity class

import { CARD_WIDTH, CARD_HEIGHT, COLORS } from './globals.js';

export class Card {
  constructor(text, isCategory, category = null) {
    this.text = text;
    this.isCategory = isCategory;
    this.category = category; // For word cards, which category they belong to
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.animating = false;
    this.visible = true;
  }

  update() {
    if (this.animating) {
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const speed = 0.3;
      
      this.x += dx * speed;
      this.y += dy * speed;
      
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.animating = false;
      }
    }
  }

  setPosition(x, y, animate = false) {
    if (animate) {
      this.targetX = x;
      this.targetY = y;
      this.animating = true;
    } else {
      this.x = x;
      this.y = y;
      this.targetX = x;
      this.targetY = y;
      this.animating = false;
    }
  }

  draw(p, isSelected = false) {
    if (!this.visible) return;

    p.push();
    
    // Card border (highlight if selected)
    if (isSelected) {
      p.strokeWeight(3);
      p.stroke(...COLORS.cardBorderSelected);
    } else {
      p.strokeWeight(2);
      p.stroke(...COLORS.cardBorder);
    }
    
    // Card background color
    if (this.isCategory) {
      p.fill(...COLORS.categoryCard);
    } else {
      p.fill(...COLORS.wordCard);
    }
    
    p.rect(this.x, this.y, CARD_WIDTH, CARD_HEIGHT, 5);
    
    // Text
    p.fill(...COLORS.text);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(this.isCategory ? 10 : 11);
    p.text(this.text, this.x + CARD_WIDTH / 2, this.y + CARD_HEIGHT / 2);
    
    p.pop();
  }
}