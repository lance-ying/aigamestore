// piece.js - Puzzle piece class

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class PuzzlePiece {
  constructor(id, imageSegment, x, y, width, height, rotation, gridX, gridY) {
    this.id = id;
    this.imageSegment = imageSegment; // p5.Graphics object
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.rotation = rotation; // in degrees
    this.gridX = gridX; // Original grid position
    this.gridY = gridY;
    this.isSnapped = false;
    this.snappedTo = []; // IDs of connected pieces
    this.groupId = null;
    this.isSelected = false;
    this.snapAnimationTime = 0;
  }

  draw(p) {
    p.push();
    p.translate(this.x, this.y);
    p.rotate(p.radians(this.rotation));
    
    // Draw selection highlight
    if (this.isSelected) {
      p.strokeWeight(4);
      p.stroke(255, 255, 0, 200);
      p.noFill();
      p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    }
    
    // Draw piece border
    p.strokeWeight(2);
    p.stroke(40, 40, 40);
    p.noFill();
    p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    
    // Draw image segment
    if (this.imageSegment) {
      p.imageMode(p.CENTER);
      
      // Snap animation effect
      if (this.snapAnimationTime > 0) {
        const scale = 1 + 0.1 * Math.sin(this.snapAnimationTime * 10);
        p.scale(scale);
        this.snapAnimationTime -= 0.05;
        if (this.snapAnimationTime < 0) this.snapAnimationTime = 0;
      }
      
      p.image(this.imageSegment, 0, 0);
    }
    
    p.pop();
  }

  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }

  distanceToPoint(x, y) {
    return Math.sqrt((this.x - x) ** 2 + (this.y - y) ** 2);
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
    
    // Keep within bounds
    this.x = Math.max(this.width / 2, Math.min(CANVAS_WIDTH - this.width / 2, this.x));
    this.y = Math.max(this.height / 2, Math.min(CANVAS_HEIGHT - this.height / 2, this.y));
  }

  rotate90(clockwise = false) {
    this.rotation += clockwise ? 90 : -90;
    this.rotation = this.rotation % 360;
    if (this.rotation < 0) this.rotation += 360;
  }

  triggerSnapAnimation() {
    this.snapAnimationTime = 1.0;
  }
}