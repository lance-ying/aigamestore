// collectibles.js - Collectible items on the track

import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, LANE_WIDTH, NUM_LANES,
  ITEM_CUP, ITEM_COFFEE, ITEM_MILK, ITEM_SLEEVE, ITEM_LID
} from './globals.js';

export class Collectible {
  constructor(lane, y, type) {
    this.lane = lane;
    this.x = (lane + 0.5) * LANE_WIDTH;
    this.y = y;
    this.type = type;
    this.collected = false;
    this.animOffset = 0;
  }

  update(p, scrollSpeed) {
    this.y += scrollSpeed;
    this.animOffset += 0.1;
  }

  render(p, scrollOffset) {
    if (this.collected) return;

    p.push();
    
    const bobOffset = Math.sin(this.animOffset) * 3;
    const screenY = this.y - scrollOffset + bobOffset;
    
    // Highlight glow
    p.noStroke();
    p.fill(255, 255, 150, 50);
    p.ellipse(this.x, screenY, 40, 40);
    
    // Render based on type
    switch (this.type) {
      case ITEM_CUP:
        this.renderCup(p, this.x, screenY);
        break;
      case ITEM_COFFEE:
        this.renderCoffee(p, this.x, screenY);
        break;
      case ITEM_MILK:
        this.renderMilk(p, this.x, screenY);
        break;
      case ITEM_SLEEVE:
        this.renderSleeve(p, this.x, screenY);
        break;
      case ITEM_LID:
        this.renderLid(p, this.x, screenY);
        break;
    }
    
    p.pop();
  }

  renderCup(p, x, y) {
    p.fill(255, 250, 240);
    p.stroke(200, 190, 180);
    p.strokeWeight(2);
    p.beginShape();
    p.vertex(x - 10, y - 8);
    p.vertex(x + 10, y - 8);
    p.vertex(x + 12, y + 8);
    p.vertex(x - 12, y + 8);
    p.endShape(p.CLOSE);
    
    // Plus sign
    p.stroke(100, 200, 100);
    p.strokeWeight(2);
    p.line(x, y - 4, x, y + 4);
    p.line(x - 4, y, x + 4, y);
  }

  renderCoffee(p, x, y) {
    p.fill(101, 67, 33);
    p.stroke(80, 50, 20);
    p.strokeWeight(2);
    p.ellipse(x, y, 24, 24);
    
    // Steam
    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * 6;
      p.noFill();
      p.stroke(150, 150, 150, 150);
      p.strokeWeight(1);
      p.bezier(
        x + offset, y - 12,
        x + offset - 3, y - 18,
        x + offset + 3, y - 24,
        x + offset, y - 30
      );
    }
  }

  renderMilk(p, x, y) {
    p.fill(245, 235, 220);
    p.stroke(220, 210, 200);
    p.strokeWeight(2);
    p.ellipse(x, y, 24, 24);
    
    // Droplet
    p.fill(255);
    p.noStroke();
    p.beginShape();
    p.vertex(x, y - 8);
    p.bezierVertex(x - 4, y - 4, x - 4, y + 2, x, y + 6);
    p.bezierVertex(x + 4, y + 2, x + 4, y - 4, x, y - 8);
    p.endShape(p.CLOSE);
  }

  renderSleeve(p, x, y) {
    p.fill(160, 82, 45);
    p.stroke(120, 60, 30);
    p.strokeWeight(2);
    p.rect(x - 12, y - 8, 24, 16, 2);
    
    // Pattern
    p.stroke(100, 50, 20);
    p.strokeWeight(1);
    for (let i = -8; i <= 8; i += 4) {
      p.line(x + i, y - 6, x + i, y + 6);
    }
  }

  renderLid(p, x, y) {
    p.fill(220, 220, 220);
    p.stroke(180, 180, 180);
    p.strokeWeight(2);
    p.ellipse(x, y, 26, 10);
    
    // Drinking hole
    p.fill(100);
    p.noStroke();
    p.ellipse(x, y, 6, 4);
    
    // Shine
    p.fill(255, 255, 255, 150);
    p.ellipse(x - 6, y - 2, 8, 4);
  }

  isOffScreen(scrollOffset) {
    return this.y - scrollOffset > CANVAS_HEIGHT + 50;
  }

  getBounds(scrollOffset) {
    const screenY = this.y - scrollOffset;
    return {
      x: this.x - 15,
      y: screenY - 15,
      width: 30,
      height: 30
    };
  }
}