import { CARD_WIDTH, CARD_HEIGHT } from './globals.js';

export class Card {
  constructor(template) {
    this.id = template.id;
    this.name = template.name;
    this.type = template.type;
    this.energy = template.energy;
    this.description = template.description;
    this.effect = template.effect;
  }

  draw(p, x, y, isSelected = false) {
    p.push();
    
    // Card background
    p.fill(30, 30, 30);
    p.stroke(isSelected ? 255 : 150);
    p.strokeWeight(isSelected ? 3 : 1);
    p.rect(x, y, CARD_WIDTH, CARD_HEIGHT, 10);
    
    // Card type color bar
    p.noStroke();
    p.fill(this.type.color);
    p.rect(x + 5, y + 5, CARD_WIDTH - 10, 20, 5);
    
    // Card name
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(this.name, x + CARD_WIDTH / 2, y + 15);
    
    // Energy cost
    p.fill(60, 100, 220);
    p.stroke(30, 60, 140);
    p.strokeWeight(1);
    p.ellipse(x + 15, y + 40, 25, 25);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(this.energy, x + 15, y + 40);
    
    // Card description
    p.fill(200, 200, 200);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(10);
    p.text(this.description, x + CARD_WIDTH / 2, y + 60, CARD_WIDTH - 10, CARD_HEIGHT - 70);
    
    p.pop();
  }
}