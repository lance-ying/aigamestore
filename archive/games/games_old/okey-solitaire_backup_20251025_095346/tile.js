import { TILE_WIDTH, TILE_HEIGHT, COLORS, COLOR_NAMES } from './globals.js';

export class Tile {
  constructor(color, number, isJoker = false) {
    this.color = color; // 'RED', 'BLUE', 'BLACK', 'YELLOW'
    this.number = number; // 1-13, or 0 for joker
    this.isJoker = isJoker;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.isAnimating = false;
  }

  update() {
    if (this.isAnimating) {
      const speed = 0.2;
      this.x += (this.targetX - this.x) * speed;
      this.y += (this.targetY - this.y) * speed;
      
      if (Math.abs(this.targetX - this.x) < 1 && Math.abs(this.targetY - this.y) < 1) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.isAnimating = false;
      }
    }
  }

  moveTo(x, y, animate = false) {
    this.targetX = x;
    this.targetY = y;
    if (animate) {
      this.isAnimating = true;
    } else {
      this.x = x;
      this.y = y;
    }
  }

  draw(p, isOkey = false, isFaceDown = false, isHighlighted = false, isPickedUp = false) {
    p.push();
    
    const yOffset = isPickedUp ? -10 : 0;
    
    // Shadow
    if (!isFaceDown) {
      p.noStroke();
      p.fill(0, 0, 0, 50);
      p.rect(this.x + 2, this.y + 2 + yOffset, TILE_WIDTH, TILE_HEIGHT, 5);
    }
    
    // Tile background
    if (isFaceDown) {
      p.fill(100, 100, 100);
      p.stroke(60);
      p.strokeWeight(2);
      p.rect(this.x, this.y + yOffset, TILE_WIDTH, TILE_HEIGHT, 5);
      
      // Pattern on back
      p.stroke(80);
      p.strokeWeight(1);
      for (let i = 0; i < 3; i++) {
        p.line(this.x + 5 + i * 10, this.y + 5 + yOffset, this.x + 5 + i * 10, this.y + TILE_HEIGHT - 5 + yOffset);
      }
    } else {
      p.fill(240, 235, 220);
      p.stroke(isHighlighted ? 255 : 100);
      p.strokeWeight(isHighlighted ? 3 : 2);
      p.rect(this.x, this.y + yOffset, TILE_WIDTH, TILE_HEIGHT, 5);
      
      // Okey border
      if (isOkey) {
        p.stroke(255, 215, 0);
        p.strokeWeight(3);
        p.noFill();
        p.rect(this.x + 2, this.y + 2 + yOffset, TILE_WIDTH - 4, TILE_HEIGHT - 4, 5);
      }
      
      // Tile content
      if (this.isJoker) {
        p.fill(150, 50, 150);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.text('J', this.x + TILE_WIDTH / 2, this.y + TILE_HEIGHT / 2 + yOffset);
      } else {
        const colorRGB = COLORS[this.color];
        p.fill(...colorRGB);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(20);
        p.text(this.number, this.x + TILE_WIDTH / 2, this.y + TILE_HEIGHT / 2 + yOffset);
      }
    }
    
    p.pop();
  }

  matches(otherTile) {
    if (this.isJoker || otherTile.isJoker) return false;
    return this.color === otherTile.color && this.number === otherTile.number;
  }
}

export function createDeck() {
  const deck = [];
  
  // Create two sets of tiles (1-13 in each color)
  for (let set = 0; set < 2; set++) {
    for (const color of COLOR_NAMES) {
      for (let num = 1; num <= 13; num++) {
        deck.push(new Tile(color, num, false));
      }
    }
  }
  
  // Add 2 jokers
  deck.push(new Tile('BLACK', 0, true));
  deck.push(new Tile('BLACK', 0, true));
  
  return deck;
}

export function shuffleDeck(deck, p) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}