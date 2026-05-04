// piece.js - Piece class

import { PLAYERS } from './globals.js';

export class Piece {
  constructor(id, owner, homeBasePos) {
    this.id = id;
    this.owner = owner;
    this.homeBasePos = { x: homeBasePos.x, y: homeBasePos.y };
    
    this.currentPathIndex = -1;
    this.inHomeBase = true;
    this.inHomeColumn = false;
    this.isFinished = false;
    this.isStuck = false;
    
    this.x = homeBasePos.x;
    this.y = homeBasePos.y;
    
    this.homeColumnSteps = 0;
  }
  
  reset() {
    this.currentPathIndex = -1;
    this.inHomeBase = true;
    this.inHomeColumn = false;
    this.isFinished = false;
    this.isStuck = false;
    this.x = this.homeBasePos.x;
    this.y = this.homeBasePos.y;
    this.homeColumnSteps = 0;
  }
  
  canMove(diceValue, homeEntryIndex) {
    if (this.isFinished) return false;
    if (this.isStuck) return false;
    
    if (this.inHomeBase) {
      return diceValue === 6;
    }
    
    if (this.inHomeColumn) {
      const newSteps = this.homeColumnSteps + diceValue;
      return newSteps <= 5;
    }
    
    return true;
  }
  
  movePiece(diceValue, boardPath, homeEntryIndex) {
    if (this.inHomeBase) {
      this.inHomeBase = false;
      this.currentPathIndex = homeEntryIndex;
      const pos = boardPath[this.currentPathIndex];
      this.x = pos.x;
      this.y = pos.y;
      return;
    }
    
    if (this.inHomeColumn) {
      this.homeColumnSteps += diceValue;
      if (this.homeColumnSteps === 5) {
        this.isFinished = true;
      }
      return;
    }
    
    this.currentPathIndex = (this.currentPathIndex + diceValue) % boardPath.length;
    
    if (this.currentPathIndex === homeEntryIndex) {
      this.inHomeColumn = true;
      this.homeColumnSteps = 1;
    }
    
    const pos = boardPath[this.currentPathIndex];
    this.x = pos.x;
    this.y = pos.y;
  }
  
  sendHome() {
    this.currentPathIndex = -1;
    this.inHomeBase = true;
    this.inHomeColumn = false;
    this.homeColumnSteps = 0;
    this.x = this.homeBasePos.x;
    this.y = this.homeBasePos.y;
  }
}