// card.js - Card entity and rendering

import { gameState } from './globals.js';

export class Card {
  constructor(data, index) {
    this.target = data.target;
    this.taboo = data.taboo;
    this.index = index;
    this.x = 0;
    this.y = 0;
    this.width = 300;
    this.height = 280;
    this.revealed = false;
  }
  
  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Card background with gradient effect
    for (let i = 0; i < this.height; i++) {
      const inter = p.map(i, 0, this.height, 0, 1);
      const c = p.lerpColor(p.color(240, 240, 255), p.color(200, 200, 230), inter);
      p.stroke(c);
      p.line(0, i, this.width, i);
    }
    
    // Card border
    p.noFill();
    p.stroke(60, 60, 120);
    p.strokeWeight(3);
    p.rect(0, 0, this.width, this.height);
    
    // Header section
    p.fill(60, 80, 150);
    p.noStroke();
    p.rect(10, 10, this.width - 20, 60, 5);
    
    // Target word
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(28);
    p.textStyle(p.BOLD);
    p.text(this.target, this.width / 2, 40);
    
    // Taboo words section
    p.fill(220, 60, 60);
    p.textSize(14);
    p.textStyle(p.NORMAL);
    p.text("TABOO WORDS:", this.width / 2, 90);
    
    p.fill(40, 40, 60);
    p.textSize(18);
    let yPos = 120;
    for (let i = 0; i < this.taboo.length; i++) {
      // Taboo word background
      p.fill(255, 200, 200);
      p.noStroke();
      p.rect(30, yPos - 15, this.width - 60, 28, 3);
      
      // Taboo word text
      p.fill(180, 40, 40);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(this.taboo[i], this.width / 2, yPos);
      yPos += 35;
    }
    
    p.pop();
  }
}

export function createCardDeck(p) {
  const cards = [];
  const shuffledCards = [...gameState.allCards];
  
  // Shuffle using p5's random with seed
  for (let i = shuffledCards.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [shuffledCards[i], shuffledCards[j]] = [shuffledCards[j], shuffledCards[i]];
  }
  
  for (let i = 0; i < shuffledCards.length; i++) {
    cards.push(new Card(shuffledCards[i], i));
  }
  
  return cards;
}