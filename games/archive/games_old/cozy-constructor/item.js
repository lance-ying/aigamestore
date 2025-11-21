// item.js - Item class and management

import { gameState } from './globals.js';

export class Item {
  constructor(config, inventoryIndex) {
    this.id = config.id;
    this.name = config.name;
    this.color = config.color;
    this.shapes = config.shapes; // Array of rotation states
    this.rotationIndex = 0;
    this.gridX = 0;
    this.gridY = 0;
    this.isPlaced = false;
    this.inventoryIndex = inventoryIndex;
  }

  getCurrentShape() {
    return this.shapes[this.rotationIndex % this.shapes.length];
  }

  rotate() {
    this.rotationIndex = (this.rotationIndex + 1) % this.shapes.length;
  }

  getOccupiedCells() {
    const shape = this.getCurrentShape();
    return shape.map(([dx, dy]) => ({
      x: this.gridX + dx,
      y: this.gridY + dy
    }));
  }

  getBounds() {
    const cells = this.getOccupiedCells();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    cells.forEach(cell => {
      minX = Math.min(minX, cell.x);
      minY = Math.min(minY, cell.y);
      maxX = Math.max(maxX, cell.x);
      maxY = Math.max(maxY, cell.y);
    });
    return { minX, minY, maxX, maxY };
  }
}

export function createItemsFromLevel(levelConfig) {
  return levelConfig.items.map((itemConfig, index) => new Item(itemConfig, index));
}

export function checkOverlap(item1, item2) {
  const cells1 = item1.getOccupiedCells();
  const cells2 = item2.getOccupiedCells();
  
  for (let c1 of cells1) {
    for (let c2 of cells2) {
      if (c1.x === c2.x && c1.y === c2.y) {
        return true;
      }
    }
  }
  return false;
}

export function checkOutOfBounds(item, gridSize) {
  const cells = item.getOccupiedCells();
  for (let cell of cells) {
    if (cell.x < 0 || cell.x >= gridSize || cell.y < 0 || cell.y >= gridSize) {
      return true;
    }
  }
  return false;
}

export function checkValidPlacement(item) {
  // Check out of bounds
  if (checkOutOfBounds(item, gameState.gridSize)) {
    return false;
  }
  
  // Check overlap with placed items
  for (let placedItem of gameState.placedItems) {
    if (checkOverlap(item, placedItem)) {
      return false;
    }
  }
  
  return true;
}