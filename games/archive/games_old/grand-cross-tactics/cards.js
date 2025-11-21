// cards.js - Card rendering and management
import { gameState, CARD_TYPES } from './globals.js';

export class CardRenderer {
  constructor(p) {
    this.p = p;
    this.cardWidth = 110;
    this.cardHeight = 160;
    this.cardSpacing = 15;
    this.startX = 300 - (this.cardWidth * 1.5 + this.cardSpacing);
  }

  render() {
    const p = this.p;
    
    if (gameState.hand.length === 0) return;

    for (let i = 0; i < gameState.hand.length; i++) {
      const card = gameState.hand[i];
      const x = this.startX + i * (this.cardWidth + this.cardSpacing);
      const y = 350;
      const isSelected = i === gameState.selectedCardIndex;
      const canAfford = gameState.player && gameState.player.currentAP >= card.cost;

      this.renderCard(card, x, y, isSelected, canAfford);
    }
  }

  renderCard(card, x, y, isSelected, canAfford) {
    const p = this.p;
    
    p.push();
    
    // Card background
    if (isSelected) {
      p.fill(80, 80, 120);
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
    } else if (!canAfford) {
      p.fill(60, 60, 60);
      p.stroke(100, 100, 100);
      p.strokeWeight(2);
    } else {
      p.fill(70, 70, 90);
      p.stroke(150, 150, 150);
      p.strokeWeight(2);
    }
    
    p.rect(x, y, this.cardWidth, this.cardHeight, 5);
    
    // Card name
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(14);
    p.text(card.name, x + this.cardWidth / 2, y + 10);
    
    // AP cost
    p.fill(255, 140, 0);
    p.textSize(18);
    p.text(`${card.cost} AP`, x + this.cardWidth / 2, y + 35);
    
    // Description
    p.fill(200, 200, 200);
    p.textSize(11);
    const lines = this.wrapText(card.description, this.cardWidth - 10);
    let descY = y + 65;
    for (const line of lines) {
      p.text(line, x + this.cardWidth / 2, descY);
      descY += 14;
    }
    
    // Visual effect icon
    this.renderCardIcon(card, x + this.cardWidth / 2, y + 110);
    
    p.pop();
  }

  renderCardIcon(card, x, y) {
    const p = this.p;
    
    p.push();
    p.noFill();
    p.strokeWeight(2);
    
    if (card.effect === 'DAMAGE' || card.effect === 'AOE_DAMAGE') {
      p.stroke(255, 69, 0);
      p.line(x - 15, y - 15, x + 15, y + 15);
      p.line(x + 15, y - 15, x - 15, y + 15);
    } else if (card.effect === 'BLOCK') {
      p.stroke(100, 149, 237);
      p.rect(x - 12, y - 12, 24, 24);
    } else if (card.effect === 'HEAL') {
      p.stroke(50, 205, 50);
      p.line(x, y - 15, x, y + 15);
      p.line(x - 15, y, x + 15, y);
    } else if (card.effect === 'BUFF_DAMAGE') {
      p.stroke(255, 215, 0);
      p.line(x - 10, y + 10, x, y - 15);
      p.line(x, y - 15, x + 10, y + 10);
    }
    
    p.pop();
  }

  wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      if (this.p.textWidth(testLine) < maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines;
  }
}

export function drawHand(p, deck) {
  const hand = [];
  const deckCopy = [...deck];
  
  for (let i = 0; i < 3 && deckCopy.length > 0; i++) {
    const randomIndex = Math.floor(p.random(deckCopy.length));
    const cardId = deckCopy[randomIndex];
    hand.push({ ...CARD_TYPES[cardId] });
    deckCopy.splice(randomIndex, 1);
  }
  
  return hand;
}