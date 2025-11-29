// card.js - Card classes

import { CARD_WIDTH, CARD_HEIGHT, CATEGORY_CARD_WIDTH, CATEGORY_CARD_HEIGHT } from './globals.js';

export class Card {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  
  contains(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }
}

export class CategoryCard extends Card {
  constructor(name, x, y) {
    super(x, y, CATEGORY_CARD_WIDTH, CATEGORY_CARD_HEIGHT);
    this.name = name;
    this.words = [];
  }
  
  addWord(wordCard) {
    this.words.push(wordCard);
  }
  
  isFull(totalWordsForCategory) {
    return this.words.length >= totalWordsForCategory;
  }
  
  draw(p, highlighted = false) {
    p.push();
    
    // Highlight if selected
    if (highlighted) {
      p.strokeWeight(5);
      p.stroke(255, 200, 0);
    } else {
      p.strokeWeight(3);
      p.stroke(50, 100, 200);
    }
    
    p.fill(200, 230, 255);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Draw category name
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(this.name, this.x + this.width / 2, this.y + 30);
    
    // Draw stacked words
    const startY = this.y + 60;
    const wordSpacing = 15;
    for (let i = 0; i < this.words.length; i++) {
      const wordY = startY + i * wordSpacing;
      p.textSize(12);
      p.fill(0, 100, 0);
      p.text(this.words[i].word, this.x + this.width / 2, wordY);
    }
    
    p.pop();
  }
}

export class WordCard extends Card {
  constructor(word, category, x, y) {
    super(x, y, CARD_WIDTH, CARD_HEIGHT);
    this.word = word;
    this.category = category;
    this.isDragging = false;
    this.offsetX = 0;
    this.offsetY = 0;
  }
  
  draw(p, isActive = false) {
    p.push();
    
    p.strokeWeight(2);
    p.stroke(0);
    
    if (isActive) {
      p.fill(255, 255, 150);
    } else {
      p.fill(255, 250, 200);
    }
    
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Draw word
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(this.word, this.x + this.width / 2, this.y + this.height / 2);
    
    p.pop();
  }
  
  startDrag(mouseX, mouseY) {
    this.isDragging = true;
    this.offsetX = this.x - mouseX;
    this.offsetY = this.y - mouseY;
  }
  
  updateDrag(mouseX, mouseY) {
    if (this.isDragging) {
      this.x = mouseX + this.offsetX;
      this.y = mouseY + this.offsetY;
    }
  }
  
  stopDrag() {
    this.isDragging = false;
  }
}

export class DeckCard extends Card {
  constructor(x, y) {
    super(x, y, CARD_WIDTH, CARD_HEIGHT);
  }
  
  draw(p) {
    p.push();
    
    p.strokeWeight(2);
    p.stroke(0);
    p.fill(40, 60, 120);
    p.rect(this.x, this.y, this.width, this.height, 5);
    
    // Draw 'S' for Solitaire
    p.fill(200, 220, 255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text('S', this.x + this.width / 2, this.y + this.height / 2);
    
    p.pop();
  }
}