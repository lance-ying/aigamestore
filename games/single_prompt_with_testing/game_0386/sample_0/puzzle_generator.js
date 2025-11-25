// puzzle_generator.js - Generate puzzle layouts

import { Node } from './node.js';
import { SHAPE_TYPES } from './globals.js';

export class PuzzleGenerator {
  constructor(p) {
    this.p = p;
  }

  generateLevel(levelNumber) {
    const nodes = [];
    const gridSize = 80;
    const offsetX = 150;
    const offsetY = 100;
    
    // Level 0: Simple tutorial level
    if (levelNumber === 0) {
      nodes.push(new Node(offsetX, offsetY, SHAPE_TYPES.CIRCLE, 1));
      nodes.push(new Node(offsetX + gridSize * 2, offsetY, SHAPE_TYPES.CIRCLE, 1));
      nodes.push(new Node(offsetX, offsetY + gridSize * 2, SHAPE_TYPES.SQUARE, 1));
      nodes.push(new Node(offsetX + gridSize * 2, offsetY + gridSize * 2, SHAPE_TYPES.SQUARE, 1));
    }
    // Level 1: Intermediate nodes
    else if (levelNumber === 1) {
      nodes.push(new Node(offsetX, offsetY, SHAPE_TYPES.CIRCLE, 1));
      nodes.push(new Node(offsetX + gridSize, offsetY, SHAPE_TYPES.TRIANGLE, 2));
      nodes.push(new Node(offsetX + gridSize * 2, offsetY, SHAPE_TYPES.CIRCLE, 1));
      nodes.push(new Node(offsetX, offsetY + gridSize, SHAPE_TYPES.SQUARE, 1));
      nodes.push(new Node(offsetX + gridSize * 2, offsetY + gridSize, SHAPE_TYPES.SQUARE, 1));
    }
    // Level 2: More complex
    else if (levelNumber === 2) {
      nodes.push(new Node(offsetX, offsetY, SHAPE_TYPES.CIRCLE, 2));
      nodes.push(new Node(offsetX + gridSize, offsetY, SHAPE_TYPES.DIAMOND, 2));
      nodes.push(new Node(offsetX + gridSize * 2, offsetY, SHAPE_TYPES.CIRCLE, 2));
      nodes.push(new Node(offsetX, offsetY + gridSize, SHAPE_TYPES.SQUARE, 1));
      nodes.push(new Node(offsetX + gridSize, offsetY + gridSize, SHAPE_TYPES.TRIANGLE, 2));
      nodes.push(new Node(offsetX + gridSize * 2, offsetY + gridSize, SHAPE_TYPES.SQUARE, 1));
      nodes.push(new Node(offsetX + gridSize, offsetY + gridSize * 2, SHAPE_TYPES.DIAMOND, 2));
    }
    // Level 3+: Complex puzzles
    else {
      const rows = 3 + Math.floor(levelNumber / 2);
      const cols = 3 + Math.floor(levelNumber / 2);
      const types = [SHAPE_TYPES.CIRCLE, SHAPE_TYPES.SQUARE, SHAPE_TYPES.TRIANGLE, SHAPE_TYPES.DIAMOND];
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if ((row + col) % 2 === 0 || levelNumber > 5) {
            const typeIndex = Math.floor(this.p.random() * types.length);
            const connections = Math.floor(this.p.random(1, 3));
            nodes.push(new Node(
              offsetX + col * gridSize,
              offsetY + row * gridSize,
              types[typeIndex],
              connections
            ));
          }
        }
      }
    }
    
    return nodes;
  }
}