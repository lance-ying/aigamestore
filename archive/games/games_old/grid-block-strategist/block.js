// block.js - Block class and utilities
import { BLOCK_SHAPES, BLOCK_COLORS } from './globals.js';

export class Block {
  constructor(shapeKey, colorIndex) {
    this.shapeKey = shapeKey;
    this.shape = BLOCK_SHAPES[shapeKey];
    this.colorIndex = colorIndex;
    this.color = BLOCK_COLORS[colorIndex];
  }

  getWidth() {
    return Math.max(...this.shape.map(cell => cell[0])) + 1;
  }

  getHeight() {
    return Math.max(...this.shape.map(cell => cell[1])) + 1;
  }

  clone() {
    return new Block(this.shapeKey, this.colorIndex);
  }
}

export function generateBlockForLevel(level, p) {
  const shapeKeys = Object.keys(BLOCK_SHAPES);
  let availableShapes = [];

  if (level === 1) {
    availableShapes = ['SINGLE', 'HORIZONTAL_2', 'VERTICAL_2', 'HORIZONTAL_3', 'VERTICAL_3', 'SQUARE_2X2'];
  } else if (level === 2) {
    availableShapes = ['SINGLE', 'HORIZONTAL_2', 'VERTICAL_2', 'HORIZONTAL_3', 'VERTICAL_3', 
                       'SQUARE_2X2', 'L_SHAPE_1', 'L_SHAPE_2', 'L_SHAPE_3', 'L_SHAPE_4', 
                       'T_SHAPE', 'Z_SHAPE', 'S_SHAPE'];
  } else if (level === 3) {
    availableShapes = ['HORIZONTAL_2', 'VERTICAL_2', 'HORIZONTAL_3', 'VERTICAL_3', 
                       'SQUARE_2X2', 'L_SHAPE_1', 'L_SHAPE_2', 'L_SHAPE_3', 'L_SHAPE_4', 
                       'T_SHAPE', 'Z_SHAPE', 'S_SHAPE', 'BIG_L', 'HOLLOW_SQUARE', 'PLUS_SHAPE'];
  } else if (level === 4) {
    availableShapes = ['HORIZONTAL_3', 'VERTICAL_3', 'SQUARE_2X2', 
                       'L_SHAPE_1', 'L_SHAPE_2', 'L_SHAPE_3', 'L_SHAPE_4', 
                       'T_SHAPE', 'Z_SHAPE', 'S_SHAPE', 'BIG_L', 'SQUARE_3X3',
                       'HOLLOW_SQUARE', 'PLUS_SHAPE', 'HORIZONTAL_4', 'VERTICAL_4', 'BIG_T'];
  } else { // level 5
    availableShapes = ['L_SHAPE_1', 'L_SHAPE_2', 'L_SHAPE_3', 'L_SHAPE_4', 
                       'T_SHAPE', 'Z_SHAPE', 'S_SHAPE', 'BIG_L', 'SQUARE_3X3',
                       'HOLLOW_SQUARE', 'PLUS_SHAPE', 'HORIZONTAL_4', 'VERTICAL_4', 
                       'HORIZONTAL_5', 'BIG_T'];
  }

  const shapeKey = availableShapes[Math.floor(p.random() * availableShapes.length)];
  const colorIndex = Math.floor(p.random() * Object.keys(BLOCK_COLORS).length);
  
  return new Block(shapeKey, colorIndex);
}

export function generateInitialBlocks(level, p) {
  return [
    generateBlockForLevel(level, p),
    generateBlockForLevel(level, p),
    generateBlockForLevel(level, p)
  ];
}