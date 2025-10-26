// cellClass.js - Cell class for grid
import { GRID_SIZE } from './globals.js';

export class Cell {
  constructor(row, col) {
    this.row = row;
    this.col = col;
    this.value = 0; // 0 means empty
    this.isFixed = false;
    this.pencilMarks = new Set(); // Set of numbers 1-9
    this.isConflict = false;
  }

  setValue(value) {
    if (!this.isFixed) {
      this.value = value;
      if (value !== 0) {
        this.pencilMarks.clear();
      }
    }
  }

  togglePencilMark(num) {
    if (!this.isFixed && this.value === 0) {
      if (this.pencilMarks.has(num)) {
        this.pencilMarks.delete(num);
      } else {
        this.pencilMarks.add(num);
      }
    }
  }

  clear() {
    if (!this.isFixed) {
      this.value = 0;
      this.pencilMarks.clear();
    }
  }

  clone() {
    const cell = new Cell(this.row, this.col);
    cell.value = this.value;
    cell.isFixed = this.isFixed;
    cell.pencilMarks = new Set(this.pencilMarks);
    cell.isConflict = this.isConflict;
    return cell;
  }
}