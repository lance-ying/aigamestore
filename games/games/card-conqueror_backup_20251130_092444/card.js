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
    
    // Card shadow
    if (isSelected) {
      p.drawingContext.shadowBlur = 20;
      p.drawingContext.shadowColor = 'rgba(255, 255, 255, 0.5)';
    }
    
    // Card background with gradient effect
    p.fill(40, 40, 45);
    p.stroke(isSelected ? [255, 255, 100] : [120, 120, 130]);
    p.strokeWeight(isSelected ? 4 : 2);
    p.rect(x, y, CARD_WIDTH, CARD_HEIGHT, 12);
    
    // Card type color bar (top)
    p.noStroke();
    const typeColor = this.type.color;
    p.fill(typeColor[0], typeColor[1], typeColor[2]);
    p.rect(x + 3, y + 3, CARD_WIDTH - 6, 28, 8, 8, 0, 0);
    
    // Card name
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(13);
    p.textStyle(p.BOLD);
    p.text(this.name, x + CARD_WIDTH / 2, y + 17);
    p.textStyle(p.NORMAL);
    
    // Card art placeholder (colored rectangle based on type)
    p.fill(typeColor[0] * 0.5, typeColor[1] * 0.5, typeColor[2] * 0.5);
    p.noStroke();
    p.rect(x + 10, y + 40, CARD_WIDTH - 20, 40, 5);
    
    // Energy cost orb with glow - centered in the middle of the card
    p.push();
    if (isSelected) {
      p.drawingContext.shadowBlur = 10;
      p.drawingContext.shadowColor = 'rgba(60, 100, 220, 0.8)';
    }
    p.fill(60, 100, 220);
    p.stroke(30, 60, 140);
    p.strokeWeight(2);
    p.ellipse(x + CARD_WIDTH / 2, y + 55, 28, 28);
    p.pop();
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.textStyle(p.BOLD);
    p.text(this.energy, x + CARD_WIDTH / 2, y + 55);
    p.textStyle(p.NORMAL);
    
    // Card description with better formatting
    p.fill(220, 220, 220);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(11);
    const words = this.description.split(' ');
    let line = '';
    let yPos = y + 88;
    const lineHeight = 14;
    
    for (let word of words) {
      const testLine = line + word + ' ';
      const testWidth = p.textWidth(testLine);
      
      if (testWidth > CARD_WIDTH - 14 && line.length > 0) {
        p.text(line, x + CARD_WIDTH / 2, yPos);
        line = word + ' ';
        yPos += lineHeight;
      } else {
        line = testLine;
      }
    }
    p.text(line, x + CARD_WIDTH / 2, yPos);
    
    // Card border highlight for type
    p.noFill();
    p.stroke(typeColor[0], typeColor[1], typeColor[2], 100);
    p.strokeWeight(2);
    p.rect(x + 1, y + 1, CARD_WIDTH - 2, CARD_HEIGHT - 2, 12);
    
    p.pop();
  }
}