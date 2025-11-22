// grid.js - Grid management for bubbles

import { Bubble } from './bubble.js';
import { BUBBLE_RADIUS, BUBBLE_COLORS, CANVAS_WIDTH } from './globals.js';

export class BubbleGrid {
  constructor(rows, cols, offsetY) {
    this.rows = rows;
    this.cols = cols;
    this.offsetY = offsetY;
    this.grid = [];
    this.horizontalSpacing = BUBBLE_RADIUS * 2;
    this.verticalSpacing = BUBBLE_RADIUS * 1.8;
    this.leftMargin = 50;
  }

  initialize(p, level = 1) {
    this.grid = [];
    const bubbleRows = Math.min(4 + level, 8);
    
    for (let row = 0; row < bubbleRows; row++) {
      this.grid[row] = [];
      const isEvenRow = row % 2 === 0;
      const colsInRow = isEvenRow ? this.cols : this.cols - 1;
      
      for (let col = 0; col < colsInRow; col++) {
        const colorIndex = Math.floor(p.random(BUBBLE_COLORS.length));
        const pos = this.getGridPosition(row, col);
        const bubble = new Bubble(pos.x, pos.y, colorIndex, row, col);
        this.grid[row][col] = bubble;
      }
    }
  }

  getGridPosition(row, col) {
    const isEvenRow = row % 2 === 0;
    const offsetX = isEvenRow ? 0 : this.horizontalSpacing / 2;
    
    return {
      x: this.leftMargin + offsetX + col * this.horizontalSpacing,
      y: this.offsetY + row * this.verticalSpacing
    };
  }

  getNearestGridSlot(x, y) {
    let nearestRow = Math.round((y - this.offsetY) / this.verticalSpacing);
    nearestRow = Math.max(0, Math.min(this.rows - 1, nearestRow));
    
    const isEvenRow = nearestRow % 2 === 0;
    const offsetX = isEvenRow ? 0 : this.horizontalSpacing / 2;
    
    let nearestCol = Math.round((x - this.leftMargin - offsetX) / this.horizontalSpacing);
    const maxCols = isEvenRow ? this.cols : this.cols - 1;
    nearestCol = Math.max(0, Math.min(maxCols - 1, nearestCol));
    
    return { row: nearestRow, col: nearestCol };
  }

  addBubble(bubble, row, col) {
    if (!this.grid[row]) {
      this.grid[row] = [];
    }
    
    const pos = this.getGridPosition(row, col);
    bubble.x = pos.x;
    bubble.y = pos.y;
    bubble.gridRow = row;
    bubble.gridCol = col;
    bubble.isMoving = false;
    
    this.grid[row][col] = bubble;
  }

  getBubble(row, col) {
    if (!this.grid[row]) return null;
    return this.grid[row][col] || null;
  }

  removeBubble(row, col) {
    if (this.grid[row]) {
      this.grid[row][col] = null;
    }
  }

  findMatches(row, col, colorIndex) {
    const matches = [];
    const visited = new Set();
    const queue = [[row, col]];
    
    while (queue.length > 0) {
      const [r, c] = queue.shift();
      const key = `${r},${c}`;
      
      if (visited.has(key)) continue;
      visited.add(key);
      
      const bubble = this.getBubble(r, c);
      if (!bubble || bubble.colorIndex !== colorIndex) continue;
      
      matches.push({ row: r, col: c, bubble });
      
      // Check neighbors
      const neighbors = this.getNeighbors(r, c);
      for (const [nr, nc] of neighbors) {
        const nKey = `${nr},${nc}`;
        if (!visited.has(nKey)) {
          queue.push([nr, nc]);
        }
      }
    }
    
    return matches;
  }

  getNeighbors(row, col) {
    const neighbors = [];
    const isEvenRow = row % 2 === 0;
    
    // Different neighbor patterns for even and odd rows
    const offsets = isEvenRow
      ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
      : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
    
    for (const [dr, dc] of offsets) {
      const nr = row + dr;
      const nc = col + dc;
      
      if (nr >= 0 && nr < this.rows && nc >= 0) {
        const maxCols = nr % 2 === 0 ? this.cols : this.cols - 1;
        if (nc < maxCols) {
          neighbors.push([nr, nc]);
        }
      }
    }
    
    return neighbors;
  }

  findFloatingBubbles() {
    const connected = new Set();
    const queue = [];
    
    // Start from top row
    if (this.grid[0]) {
      for (let col = 0; col < this.grid[0].length; col++) {
        if (this.grid[0][col]) {
          queue.push([0, col]);
        }
      }
    }
    
    // BFS to find all connected bubbles
    while (queue.length > 0) {
      const [r, c] = queue.shift();
      const key = `${r},${c}`;
      
      if (connected.has(key)) continue;
      connected.add(key);
      
      const neighbors = this.getNeighbors(r, c);
      for (const [nr, nc] of neighbors) {
        const nKey = `${nr},${nc}`;
        if (!connected.has(nKey) && this.getBubble(nr, nc)) {
          queue.push([nr, nc]);
        }
      }
    }
    
    // Find floating bubbles
    const floating = [];
    for (let row = 0; row < this.grid.length; row++) {
      if (!this.grid[row]) continue;
      for (let col = 0; col < this.grid[row].length; col++) {
        const bubble = this.grid[row][col];
        if (bubble && !connected.has(`${row},${col}`)) {
          floating.push({ row, col, bubble });
        }
      }
    }
    
    return floating;
  }

  getAllBubbles() {
    const bubbles = [];
    for (let row = 0; row < this.grid.length; row++) {
      if (!this.grid[row]) continue;
      for (let col = 0; col < this.grid[row].length; col++) {
        if (this.grid[row][col]) {
          bubbles.push(this.grid[row][col]);
        }
      }
    }
    return bubbles;
  }

  getTotalBubbles() {
    return this.getAllBubbles().length;
  }

  isEmpty() {
    return this.getTotalBubbles() === 0;
  }

  draw(p) {
    for (let row = 0; row < this.grid.length; row++) {
      if (!this.grid[row]) continue;
      for (let col = 0; col < this.grid[row].length; col++) {
        const bubble = this.grid[row][col];
        if (bubble) {
          bubble.draw(p);
        }
      }
    }
  }
}