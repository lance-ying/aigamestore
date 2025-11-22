import { COLORS, CARD_TYPES, COLOR_VALUES } from './globals.js';

export class Card {
  constructor(color, type, value) {
    this.color = color;
    this.type = type;
    this.value = value;
  }

  canPlayOn(topCard, currentColor) {
    if (this.type === CARD_TYPES.WILD || this.type === CARD_TYPES.WILD_DRAW_FOUR) {
      return true;
    }
    if (this.color === currentColor) {
      return true;
    }
    if (topCard && this.type === topCard.type && this.value === topCard.value) {
      return true;
    }
    return false;
  }

  getPoints() {
    if (this.type === CARD_TYPES.NUMBER) {
      return this.value;
    }
    if (this.type === CARD_TYPES.SKIP || this.type === CARD_TYPES.REVERSE || this.type === CARD_TYPES.DRAW_TWO) {
      return 20;
    }
    return 50;
  }

  draw(p, x, y, w, h, faceUp = true) {
    p.push();
    p.strokeWeight(2);
    p.stroke(255);
    
    if (!faceUp) {
      p.fill(30, 50, 100);
      p.rect(x, y, w, h, 5);
      p.fill(255, 200);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('UNO', x + w/2, y + h/2);
    } else {
      if (this.type === CARD_TYPES.WILD || this.type === CARD_TYPES.WILD_DRAW_FOUR) {
        const qw = w / 2;
        const qh = h / 2;
        p.fill(...COLOR_VALUES.RED);
        p.rect(x, y, qw, qh);
        p.fill(...COLOR_VALUES.GREEN);
        p.rect(x + qw, y, qw, qh);
        p.fill(...COLOR_VALUES.YELLOW);
        p.rect(x, y + qh, qw, qh);
        p.fill(...COLOR_VALUES.BLUE);
        p.rect(x + qw, y + qh, qw, qh);
        
        p.fill(255);
        p.textSize(16);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('WILD', x + w/2, y + h/2 - 10);
        if (this.type === CARD_TYPES.WILD_DRAW_FOUR) {
          p.textSize(12);
          p.text('+4', x + w/2, y + h/2 + 10);
        }
      } else {
        p.fill(...COLOR_VALUES[this.color]);
        p.rect(x, y, w, h, 5);
        
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        
        if (this.type === CARD_TYPES.NUMBER) {
          p.textSize(28);
          p.text(this.value, x + w/2, y + h/2);
        } else if (this.type === CARD_TYPES.SKIP) {
          p.textSize(20);
          p.text('⊘', x + w/2, y + h/2 - 5);
          p.textSize(10);
          p.text('SKIP', x + w/2, y + h/2 + 12);
        } else if (this.type === CARD_TYPES.REVERSE) {
          p.textSize(20);
          p.text('⇄', x + w/2, y + h/2 - 5);
          p.textSize(10);
          p.text('REV', x + w/2, y + h/2 + 12);
        } else if (this.type === CARD_TYPES.DRAW_TWO) {
          p.textSize(20);
          p.text('+2', x + w/2, y + h/2 - 5);
          p.textSize(10);
          p.text('DRAW', x + w/2, y + h/2 + 12);
        }
      }
    }
    p.pop();
  }
}

export function createDeck() {
  const deck = [];
  const colors = [COLORS.RED, COLORS.GREEN, COLORS.BLUE, COLORS.YELLOW];
  
  for (const color of colors) {
    deck.push(new Card(color, CARD_TYPES.NUMBER, 0));
    
    for (let i = 1; i <= 9; i++) {
      deck.push(new Card(color, CARD_TYPES.NUMBER, i));
      deck.push(new Card(color, CARD_TYPES.NUMBER, i));
    }
    
    for (let i = 0; i < 2; i++) {
      deck.push(new Card(color, CARD_TYPES.SKIP, -1));
      deck.push(new Card(color, CARD_TYPES.REVERSE, -1));
      deck.push(new Card(color, CARD_TYPES.DRAW_TWO, -1));
    }
  }
  
  for (let i = 0; i < 4; i++) {
    deck.push(new Card(null, CARD_TYPES.WILD, -1));
    deck.push(new Card(null, CARD_TYPES.WILD_DRAW_FOUR, -1));
  }
  
  return deck;
}

export function shuffleDeck(deck, p) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = p.floor(p.random(i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}