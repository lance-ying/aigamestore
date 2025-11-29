// selector.js - Player selector/cursor logic

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Selector {
  constructor() {
    this.gridPositions = [];
    this.currentIndex = 0;
  }

  updateGridPositions() {
    this.gridPositions = [];
    
    // Add all unsorted items
    for (const item of gameState.items) {
      if (!item.isSorted) {
        this.gridPositions.push({
          x: item.currentX,
          y: item.currentY,
          type: 'item',
          ref: item
        });
      }
    }
    
    // Add all containers
    for (const container of gameState.containers) {
      this.gridPositions.push({
        x: container.x + container.width / 2,
        y: container.y + container.height / 2,
        type: 'container',
        ref: container
      });
    }
    
    // Ensure current index is valid
    if (this.currentIndex >= this.gridPositions.length) {
      this.currentIndex = Math.max(0, this.gridPositions.length - 1);
    }
  }

  moveLeft() {
    if (this.gridPositions.length === 0) return;
    
    const currentPos = this.gridPositions[this.currentIndex];
    let bestIndex = this.currentIndex;
    let bestDist = Infinity;
    
    for (let i = 0; i < this.gridPositions.length; i++) {
      if (i === this.currentIndex) continue;
      const pos = this.gridPositions[i];
      
      // Must be to the left
      if (pos.x < currentPos.x) {
        const dx = currentPos.x - pos.x;
        const dy = Math.abs(currentPos.y - pos.y);
        const dist = dx + dy * 0.5; // Prioritize horizontal movement
        
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      }
    }
    
    if (bestIndex !== this.currentIndex) {
      this.currentIndex = bestIndex;
    }
  }

  moveRight() {
    if (this.gridPositions.length === 0) return;
    
    const currentPos = this.gridPositions[this.currentIndex];
    let bestIndex = this.currentIndex;
    let bestDist = Infinity;
    
    for (let i = 0; i < this.gridPositions.length; i++) {
      if (i === this.currentIndex) continue;
      const pos = this.gridPositions[i];
      
      // Must be to the right
      if (pos.x > currentPos.x) {
        const dx = pos.x - currentPos.x;
        const dy = Math.abs(currentPos.y - pos.y);
        const dist = dx + dy * 0.5;
        
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      }
    }
    
    if (bestIndex !== this.currentIndex) {
      this.currentIndex = bestIndex;
    }
  }

  moveUp() {
    if (this.gridPositions.length === 0) return;
    
    const currentPos = this.gridPositions[this.currentIndex];
    let bestIndex = this.currentIndex;
    let bestDist = Infinity;
    
    for (let i = 0; i < this.gridPositions.length; i++) {
      if (i === this.currentIndex) continue;
      const pos = this.gridPositions[i];
      
      // Must be above
      if (pos.y < currentPos.y) {
        const dy = currentPos.y - pos.y;
        const dx = Math.abs(currentPos.x - pos.x);
        const dist = dy + dx * 0.5;
        
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      }
    }
    
    if (bestIndex !== this.currentIndex) {
      this.currentIndex = bestIndex;
    }
  }

  moveDown() {
    if (this.gridPositions.length === 0) return;
    
    const currentPos = this.gridPositions[this.currentIndex];
    let bestIndex = this.currentIndex;
    let bestDist = Infinity;
    
    for (let i = 0; i < this.gridPositions.length; i++) {
      if (i === this.currentIndex) continue;
      const pos = this.gridPositions[i];
      
      // Must be below
      if (pos.y > currentPos.y) {
        const dy = pos.y - currentPos.y;
        const dx = Math.abs(currentPos.x - pos.x);
        const dist = dy + dx * 0.5;
        
        if (dist < bestDist) {
          bestDist = dist;
          bestIndex = i;
        }
      }
    }
    
    if (bestIndex !== this.currentIndex) {
      this.currentIndex = bestIndex;
    }
  }

  getCurrentPosition() {
    if (this.gridPositions.length === 0) {
      return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    }
    return this.gridPositions[this.currentIndex];
  }

  getCurrentTarget() {
    if (this.gridPositions.length === 0) return null;
    return this.gridPositions[this.currentIndex];
  }
}