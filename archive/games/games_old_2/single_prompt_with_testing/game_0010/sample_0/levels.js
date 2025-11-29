// levels.js - Level definitions and loading

import { TILE_TYPES, TRUCK_COLORS, GRID_COLS, GRID_ROWS } from './globals.js';

export const levels = [
  // Level 1: Basic tutorial - single truck
  {
    level: 1,
    name: "First Delivery",
    grid: createEmptyGrid(),
    trucks: [
      { color: 'RED', startX: 1, startY: 1, path: [] }
    ],
    packages: [
      { color: 'RED', x: 5, y: 1, pickedUp: false }
    ],
    houses: [
      { color: 'RED', x: 10, y: 1 }
    ],
    bridges: [],
    buttons: [],
    barriers: [],
    swapZones: []
  },
  
  // Level 2: Two trucks, simple paths
  {
    level: 2,
    name: "Double Delivery",
    grid: createEmptyGrid(),
    trucks: [
      { color: 'RED', startX: 1, startY: 1, path: [] },
      { color: 'BLUE', startX: 1, startY: 6, path: [] }
    ],
    packages: [
      { color: 'RED', x: 5, y: 1, pickedUp: false },
      { color: 'BLUE', x: 5, y: 6, pickedUp: false }
    ],
    houses: [
      { color: 'RED', x: 10, y: 1 },
      { color: 'BLUE', x: 10, y: 6 }
    ],
    bridges: [],
    buttons: [],
    barriers: [],
    swapZones: []
  },
  
  // Level 3: Crossing paths - collision challenge
  {
    level: 3,
    name: "Path Crossing",
    grid: createGridWithWalls([
      { x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 },
      { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }
    ]),
    trucks: [
      { color: 'RED', startX: 1, startY: 1, path: [] },
      { color: 'BLUE', startX: 1, startY: 6, path: [] }
    ],
    packages: [
      { color: 'RED', x: 10, y: 6, pickedUp: false },
      { color: 'BLUE', x: 10, y: 1, pickedUp: false }
    ],
    houses: [
      { color: 'RED', x: 10, y: 1 },
      { color: 'BLUE', x: 10, y: 6 }
    ],
    bridges: [],
    buttons: [],
    barriers: [],
    swapZones: []
  },
  
  // Level 4: Bridge introduction
  {
    level: 4,
    name: "Bridge Over",
    grid: createEmptyGrid(),
    trucks: [
      { color: 'RED', startX: 1, startY: 1, path: [] },
      { color: 'BLUE', startX: 1, startY: 6, path: [] }
    ],
    packages: [
      { color: 'RED', x: 10, y: 1, pickedUp: false },
      { color: 'BLUE', x: 10, y: 6, pickedUp: false }
    ],
    houses: [
      { color: 'RED', x: 10, y: 6 },
      { color: 'BLUE', x: 10, y: 1 }
    ],
    bridges: [
      { x: 6, y: 3, horizontal: true },
      { x: 6, y: 4, horizontal: true }
    ],
    buttons: [],
    barriers: [],
    swapZones: []
  },
  
  // Level 5: Button and barrier
  {
    level: 5,
    name: "Button Press",
    grid: createEmptyGrid(),
    trucks: [
      { color: 'RED', startX: 1, startY: 1, path: [] },
      { color: 'BLUE', startX: 1, startY: 6, path: [] }
    ],
    packages: [
      { color: 'RED', x: 8, y: 1, pickedUp: false },
      { color: 'BLUE', x: 8, y: 6, pickedUp: false }
    ],
    houses: [
      { color: 'RED', x: 10, y: 1 },
      { color: 'BLUE', x: 10, y: 6 }
    ],
    bridges: [],
    buttons: [
      { x: 5, y: 1, linkedBarrierId: 0, pressed: false }
    ],
    barriers: [
      { id: 0, x: 7, y: 6, active: true }
    ],
    swapZones: []
  }
];

function createEmptyGrid() {
  const grid = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    const row = [];
    for (let x = 0; x < GRID_COLS; x++) {
      row.push({ type: TILE_TYPES.EMPTY });
    }
    grid.push(row);
  }
  return grid;
}

function createGridWithWalls(walls) {
  const grid = createEmptyGrid();
  walls.forEach(wall => {
    if (wall.x >= 0 && wall.x < GRID_COLS && wall.y >= 0 && wall.y < GRID_ROWS) {
      grid[wall.y][wall.x] = { type: TILE_TYPES.WALL };
    }
  });
  return grid;
}