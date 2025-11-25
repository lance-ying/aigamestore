// path.js - Path class for connections between nodes

import { COLORS } from './globals.js';

export class Path {
  constructor(startNode, shapeType) {
    this.nodes = [startNode];
    this.shapeType = shapeType;
    this.isComplete = false;
  }

  addNode(node) {
    this.nodes.push(node);
  }

  removeLastNode() {
    if (this.nodes.length > 1) {
      return this.nodes.pop();
    }
    return null;
  }

  getLastNode() {
    return this.nodes[this.nodes.length - 1];
  }

  canConnectTo(node) {
    // Can't connect to a node already in this path
    if (this.nodes.includes(node)) {
      return false;
    }
    
    // Must be same shape type
    if (node.shapeType !== this.shapeType) {
      return false;
    }
    
    // Node must be able to accept more connections
    return node.canAcceptConnection();
  }

  draw(p, isActive = false) {
    if (this.nodes.length < 2) return;
    
    p.push();
    const color = isActive ? COLORS.pathActive : COLORS.path;
    p.stroke(...color);
    p.strokeWeight(4);
    p.noFill();
    
    // Draw smooth path through all nodes
    p.beginShape();
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (i === 0) {
        p.vertex(node.x, node.y);
      } else {
        p.vertex(node.x, node.y);
      }
    }
    p.endShape();
    
    // Draw dots at intermediate nodes
    p.fill(...color);
    p.noStroke();
    for (let i = 1; i < this.nodes.length - 1; i++) {
      const node = this.nodes[i];
      p.circle(node.x, node.y, 8);
    }
    
    p.pop();
  }

  containsNode(node) {
    return this.nodes.includes(node);
  }
}