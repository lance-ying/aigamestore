// levels.js - Level definitions and initialization

import { PIPE_TYPES } from './globals.js';
import { createPipe } from './pipe.js';

export const LEVELS = [
  {
    level: 1,
    gridWidth: 5,
    gridHeight: 5,
    timeLimit: 60,
    layout: [
      ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'],
      ['START', 'BEND', 'EMPTY', 'EMPTY', 'EMPTY'],
      ['EMPTY', 'STRAIGHT', 'EMPTY', 'EMPTY', 'EMPTY'],
      ['EMPTY', 'BEND', 'STRAIGHT', 'BEND', 'END'],
      ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY']
    ],
    rotations: [
      [0, 0, 0, 0, 0],
      [0, 180, 0, 0, 0],
      [0, 90, 0, 0, 0],
      [0, 90, 180, 270, 0],
      [0, 0, 0, 0, 0]
    ],
    startPos: { x: 0, y: 1 },
    endPos: { x: 4, y: 3 }
  },
  {
    level: 2,
    gridWidth: 7,
    gridHeight: 7,
    timeLimit: 90,
    layout: [
      ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'],
      ['EMPTY', 'START', 'STRAIGHT', 'BEND', 'EMPTY', 'EMPTY', 'EMPTY'],
      ['EMPTY', 'EMPTY', 'EMPTY', 'STRAIGHT', 'BLOCKED', 'EMPTY', 'EMPTY'],
      ['EMPTY', 'EMPTY', 'BLOCKED', 'T_JUNCTION', 'STRAIGHT', 'BEND', 'EMPTY'],
      ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'STRAIGHT', 'EMPTY'],
      ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'BEND', 'END'],
      ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY']
    ],
    rotations: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 180, 270, 0, 0, 0],
      [0, 0, 0, 90, 0, 0, 0],
      [0, 0, 0, 180, 180, 270, 0],
      [0, 0, 0, 0, 0, 90, 0],
      [0, 0, 0, 0, 0, 180, 0],
      [0, 0, 0, 0, 0, 0, 0]
    ],
    startPos: { x: 1, y: 1 },
    endPos: { x: 6, y: 5 }
  },
  {
    level: 3,
    gridWidth: 9,
    gridHeight: 7,
    timeLimit: 120,
    layout: [
      ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'],
      ['START', 'BEND', 'STRAIGHT', 'BEND', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY'],
      ['EMPTY', 'EMPTY', 'BLOCKED', 'T_JUNCTION', 'STRAIGHT', 'BEND', 'EMPTY', 'EMPTY', 'EMPTY'],
      ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'BLOCKED', 'CROSS', 'STRAIGHT', 'BEND', 'EMPTY'],
      ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'STRAIGHT', 'BLOCKED', 'STRAIGHT', 'EMPTY'],
      ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'BEND', 'STRAIGHT', 'BEND', 'END'],
      ['EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY', 'EMPTY']
    ],
    rotations: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 90, 180, 270, 0, 0, 0, 0, 0],
      [0, 0, 0, 90, 180, 270, 0, 0, 0],
      [0, 0, 0, 0, 0, 180, 180, 270, 0],
      [0, 0, 0, 0, 0, 90, 0, 90, 0],
      [0, 0, 0, 0, 0, 90, 180, 270, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    startPos: { x: 0, y: 1 },
    endPos: { x: 8, y: 5 }
  }
];

export function initializeLevel(levelNum) {
  const levelData = LEVELS[levelNum - 1];
  if (!levelData) return null;

  const grid = [];
  for (let y = 0; y < levelData.gridHeight; y++) {
    grid[y] = [];
    for (let x = 0; x < levelData.gridWidth; x++) {
      const type = PIPE_TYPES[levelData.layout[y][x]];
      const rotation = levelData.rotations[y][x];
      grid[y][x] = createPipe(type, rotation);
    }
  }

  return {
    grid,
    gridWidth: levelData.gridWidth,
    gridHeight: levelData.gridHeight,
    timeLimit: levelData.timeLimit,
    startPos: levelData.startPos,
    endPos: levelData.endPos
  };
}