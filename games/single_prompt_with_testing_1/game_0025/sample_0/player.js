import { gameState, GAME_CONFIG } from './globals.js';

export class Player {
  constructor(startX, startY) {
    this.x = startX;
    this.y = startY;
    this.cursorRow = 0;
    this.cursorCol = 0;
  }
  
  moveCursor(dx, dy) {
    const { rows, cols } = GAME_CONFIG;
    this.cursorRow = Math.max(0, Math.min(rows - 1, this.cursorRow + dy));
    this.cursorCol = Math.max(0, Math.min(cols - 1, this.cursorCol + dx));
    gameState.cursorX = this.cursorCol;
    gameState.cursorY = this.cursorRow;
  }
  
  update(p) {
    // Player doesn't need continuous updates in this game
  }
  
  render(p) {
    // Player is represented by the cursor, rendered in render.js
  }
}