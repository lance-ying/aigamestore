// fallingCard.js - Falling card controller
import { Card, createRandomCard } from './card.js';
import { gameState, GRID_X, GRID_Y, CARD_WIDTH, CARD_HEIGHT, GRID_COLS, GRID_ROWS } from './globals.js';

export class FallingCard {
  constructor(p) {
    this.p = p;
    this.card = null;
    this.col = Math.floor(GRID_COLS / 2);
    this.y = -CARD_HEIGHT;
    this.fallSpeed = 1;
    this.fastFall = false;
    this.spawnNew();
  }

  spawnNew() {
    this.col = Math.floor(GRID_COLS / 2);
    this.y = -CARD_HEIGHT;
    this.card = createRandomCard(
      GRID_X + this.col * (CARD_WIDTH + 5),
      this.y
    );
    this.fastFall = false;
  }

  moveLeft() {
    if (this.col > 0) {
      this.col--;
      this.card.x = GRID_X + this.col * (CARD_WIDTH + 5);
    }
  }

  moveRight() {
    if (this.col < GRID_COLS - 1) {
      this.col++;
      this.card.x = GRID_X + this.col * (CARD_WIDTH + 5);
    }
  }

  speedUp() {
    this.fastFall = true;
  }

  drop() {
    // Instantly drop to lowest available position
    const targetRow = this.getLowestAvailableRow();
    if (targetRow !== -1) {
      this.y = GRID_Y + targetRow * (CARD_HEIGHT + 5);
      return this.settle();
    }
    return false;
  }

  getLowestAvailableRow() {
    for (let row = GRID_ROWS - 1; row >= 0; row--) {
      if (gameState.grid[row][this.col] === null) {
        return row;
      }
    }
    return -1;
  }

  update() {
    const speed = this.fastFall ? this.fallSpeed * 4 : this.fallSpeed;
    this.y += speed;
    this.card.y = this.y;

    // Check if card should settle
    const targetRow = this.getLowestAvailableRow();
    if (targetRow !== -1) {
      const targetY = GRID_Y + targetRow * (CARD_HEIGHT + 5);
      if (this.y >= targetY) {
        this.y = targetY;
        return this.settle();
      }
    }

    return false;
  }

  settle() {
    const targetRow = this.getLowestAvailableRow();
    if (targetRow === -1) {
      return false; // Column is full
    }

    this.card.gridRow = targetRow;
    this.card.gridCol = this.col;
    this.card.isSettled = true;
    this.card.y = GRID_Y + targetRow * (CARD_HEIGHT + 5);
    this.card.x = GRID_X + this.col * (CARD_WIDTH + 5);

    gameState.grid[targetRow][this.col] = this.card;
    gameState.entities.push(this.card);

    return true;
  }

  draw(p) {
    if (this.card) {
      this.card.draw(p, true);
    }
  }
}