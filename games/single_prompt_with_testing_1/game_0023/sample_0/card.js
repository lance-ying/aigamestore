import { CHARACTERS, ACTIONS } from './globals.js';

export class Card {
  constructor(p, character, action) {
    this.p = p;
    this.character = character;
    this.action = action;
  }

  static generateRandom(p, usedCombinations) {
    const maxAttempts = 100;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const charIndex = Math.floor(p.random(CHARACTERS.length));
      const actionIndex = Math.floor(p.random(ACTIONS.length));
      const key = `${charIndex}-${actionIndex}`;
      
      if (!usedCombinations.has(key)) {
        usedCombinations.add(key);
        return new Card(p, CHARACTERS[charIndex], ACTIONS[actionIndex]);
      }
      attempts++;
    }
    
    // If all combinations used, reset and create new
    usedCombinations.clear();
    const charIndex = Math.floor(p.random(CHARACTERS.length));
    const actionIndex = Math.floor(p.random(ACTIONS.length));
    return new Card(p, CHARACTERS[charIndex], ACTIONS[actionIndex]);
  }

  render(x, y, scale = 1, animProgress = 0) {
    const p = this.p;
    
    p.push();
    p.translate(x, y);
    
    // Animation effect
    const wobble = p.sin(animProgress * p.PI) * 5;
    p.rotate(wobble * 0.01);
    
    // Card background with gradient effect
    const cardWidth = 400 * scale;
    const cardHeight = 250 * scale;
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.noStroke();
    p.rect(-cardWidth/2 + 5, -cardHeight/2 + 5, cardWidth, cardHeight, 20);
    
    // Main card
    p.fill(255, 250, 240);
    p.stroke(60, 40, 20);
    p.strokeWeight(3);
    p.rect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 20);
    
    // Decorative border
    p.noFill();
    p.stroke(200, 180, 150);
    p.strokeWeight(2);
    p.rect(-cardWidth/2 + 10, -cardHeight/2 + 10, cardWidth - 20, cardHeight - 20, 15);
    
    // Character section (top)
    p.fill(100, 180, 230);
    p.noStroke();
    p.rect(-cardWidth/2 + 20, -cardHeight/2 + 30, cardWidth - 40, 70, 10);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20 * scale);
    p.text("CHARACTER:", 0, -cardHeight/2 + 50);
    
    p.fill(20);
    p.textSize(28 * scale);
    p.textStyle(p.BOLD);
    p.text(this.character.toUpperCase(), 0, -cardHeight/2 + 80);
    p.textStyle(p.NORMAL);
    
    // Action section (bottom)
    p.fill(230, 120, 100);
    p.noStroke();
    p.rect(-cardWidth/2 + 20, -cardHeight/2 + 130, cardWidth - 40, 70, 10);
    
    p.fill(255);
    p.textSize(20 * scale);
    p.text("ACTION:", 0, -cardHeight/2 + 150);
    
    p.fill(20);
    p.textSize(28 * scale);
    p.textStyle(p.BOLD);
    p.text(this.action.toUpperCase(), 0, -cardHeight/2 + 180);
    p.textStyle(p.NORMAL);
    
    p.pop();
  }
}