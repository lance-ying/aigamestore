// node.js - Node class for puzzle elements

import { SHAPE_TYPES, COLORS } from './globals.js';

export class Node {
  constructor(x, y, shapeType, requiredConnections) {
    this.x = x;
    this.y = y;
    this.shapeType = shapeType;
    this.requiredConnections = requiredConnections;
    this.currentConnections = 0;
    this.connectedPaths = [];
    this.isComplete = false;
  }

  draw(p, isSelected, isCursor) {
    p.push();
    p.translate(this.x, this.y);
    
    // Draw glow if cursor is on this node
    if (isCursor) {
      p.noFill();
      p.stroke(...COLORS.cursor, 100);
      p.strokeWeight(3);
      p.circle(0, 0, 45);
    }
    
    // Draw selection indicator
    if (isSelected) {
      p.noFill();
      p.stroke(...COLORS.cursor);
      p.strokeWeight(2);
      p.circle(0, 0, 35);
    }
    
    // Determine fill color based on completion
    const baseColor = COLORS.shapes[this.shapeType];
    const alpha = this.isComplete ? 255 : 150;
    p.fill(baseColor[0], baseColor[1], baseColor[2], alpha);
    p.stroke(255, 255, 255, alpha);
    p.strokeWeight(2);
    
    // Draw shape
    const size = 20;
    switch (this.shapeType) {
      case SHAPE_TYPES.CIRCLE:
        p.circle(0, 0, size * 2);
        break;
      case SHAPE_TYPES.SQUARE:
        p.rectMode(p.CENTER);
        p.rect(0, 0, size * 1.8, size * 1.8);
        break;
      case SHAPE_TYPES.TRIANGLE:
        p.triangle(0, -size, -size * 0.866, size * 0.5, size * 0.866, size * 0.5);
        break;
      case SHAPE_TYPES.DIAMOND:
        p.quad(0, -size, size, 0, 0, size, -size, 0);
        break;
    }
    
    // Draw connection count
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`${this.currentConnections}/${this.requiredConnections}`, 0, 0);
    
    p.pop();
  }

  addConnection(path) {
    if (!this.connectedPaths.includes(path)) {
      this.connectedPaths.push(path);
      this.currentConnections++;
      this.updateComplete();
    }
  }

  removeConnection(path) {
    const index = this.connectedPaths.indexOf(path);
    if (index !== -1) {
      this.connectedPaths.splice(index, 1);
      this.currentConnections--;
      this.updateComplete();
    }
  }

  updateComplete() {
    this.isComplete = this.currentConnections === this.requiredConnections;
  }

  canAcceptConnection() {
    return this.currentConnections < this.requiredConnections;
  }
}