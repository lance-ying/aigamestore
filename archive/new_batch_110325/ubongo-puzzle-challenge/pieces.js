// Polyomino piece definitions and management
import { GRID_SIZE } from './globals.js';

export class Piece {
  constructor(shape, color, id) {
    this.id = id;
    this.originalShape = JSON.parse(JSON.stringify(shape));
    this.shape = JSON.parse(JSON.stringify(shape));
    this.color = color;
    this.x = 0;
    this.y = 0;
    this.placed = false;
    this.rotation = 0; // 0, 90, 180, 270
    this.flipped = false;
  }
  
  rotate() {
    const newShape = [];
    const rows = this.shape.length;
    const cols = this.shape[0].length;
    
    for (let i = 0; i < cols; i++) {
      newShape[i] = [];
      for (let j = 0; j < rows; j++) {
        newShape[i][j] = this.shape[rows - 1 - j][i];
      }
    }
    
    this.shape = newShape;
    this.rotation = (this.rotation + 90) % 360;
  }
  
  flip() {
    this.shape = this.shape.map(row => [...row].reverse());
    this.flipped = !this.flipped;
  }
  
  getAbsoluteCells() {
    const cells = [];
    for (let row = 0; row < this.shape.length; row++) {
      for (let col = 0; col < this.shape[row].length; col++) {
        if (this.shape[row][col] === 1) {
          cells.push({
            x: this.x + col,
            y: this.y + row
          });
        }
      }
    }
    return cells;
  }
  
  getBounds() {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (let row = 0; row < this.shape.length; row++) {
      for (let col = 0; col < this.shape[row].length; col++) {
        if (this.shape[row][col] === 1) {
          minX = Math.min(minX, col);
          minY = Math.min(minY, row);
          maxX = Math.max(maxX, col);
          maxY = Math.max(maxY, row);
        }
      }
    }
    
    return { minX, minY, maxX, maxY };
  }
  
  draw(p, offsetX = 0, offsetY = 0, alpha = 255) {
    p.push();
    for (let row = 0; row < this.shape.length; row++) {
      for (let col = 0; col < this.shape[row].length; col++) {
        if (this.shape[row][col] === 1) {
          const x = offsetX + (this.x + col) * GRID_SIZE;
          const y = offsetY + (this.y + row) * GRID_SIZE;
          
          // Draw cell with color
          p.fill(...this.color, alpha);
          p.stroke(0, alpha);
          p.strokeWeight(2);
          p.rect(x, y, GRID_SIZE, GRID_SIZE);
          
          // Add highlight
          p.fill(255, 255, 255, alpha * 0.3);
          p.noStroke();
          p.rect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE / 3);
        }
      }
    }
    p.pop();
  }
  
  reset() {
    this.shape = JSON.parse(JSON.stringify(this.originalShape));
    this.rotation = 0;
    this.flipped = false;
    this.placed = false;
    this.x = 0;
    this.y = 0;
  }
}

// Predefined piece shapes (1 = filled, 0 = empty)
export const PIECE_SHAPES = [
  // L-piece
  [
    [1, 0],
    [1, 0],
    [1, 1]
  ],
  // T-piece
  [
    [1, 1, 1],
    [0, 1, 0]
  ],
  // Z-piece
  [
    [1, 1, 0],
    [0, 1, 1]
  ],
  // Square
  [
    [1, 1],
    [1, 1]
  ],
  // I-piece
  [
    [1],
    [1],
    [1],
    [1]
  ],
  // P-piece
  [
    [1, 1],
    [1, 1],
    [1, 0]
  ],
  // Y-piece
  [
    [0, 1],
    [1, 1],
    [0, 1]
  ],
  // V-piece
  [
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 1]
  ],
  // W-piece
  [
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 1]
  ],
  // U-piece
  [
    [1, 0, 1],
    [1, 1, 1]
  ]
];

export const PIECE_COLORS = [
  [255, 100, 100], // Red
  [100, 150, 255], // Blue
  [100, 255, 100], // Green
  [255, 220, 100], // Yellow
  [255, 150, 255], // Pink
  [150, 255, 255], // Cyan
  [255, 180, 100], // Orange
  [200, 150, 255], // Purple
  [150, 255, 150], // Light green
  [255, 200, 200]  // Light red
];

export function createRandomPieces(count, seed) {
  const pieces = [];
  const usedIndices = new Set();
  
  for (let i = 0; i < count; i++) {
    let shapeIndex;
    do {
      shapeIndex = Math.floor(Math.random() * PIECE_SHAPES.length);
    } while (usedIndices.has(shapeIndex) && usedIndices.size < PIECE_SHAPES.length);
    
    usedIndices.add(shapeIndex);
    
    const shape = JSON.parse(JSON.stringify(PIECE_SHAPES[shapeIndex]));
    const color = PIECE_COLORS[shapeIndex % PIECE_COLORS.length];
    pieces.push(new Piece(shape, color, i));
  }
  
  return pieces;
}