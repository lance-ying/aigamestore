// grid.js - Grid and level management

import { GRID_COLS, GRID_ROWS, ENTITY_TYPE } from './globals.js';
import { Player, Guard, Turret, Drone, Terminal, Exit } from './entities.js';

export function createEmptyGrid() {
  const grid = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      grid[y][x] = 0; // 0 = empty, 1 = wall
    }
  }
  return grid;
}

export function createLevel1(p) {
  const grid = createEmptyGrid();
  const entities = [];

  // Create walls around perimeter
  for (let x = 0; x < GRID_COLS; x++) {
    grid[0][x] = 1;
    grid[GRID_ROWS - 1][x] = 1;
  }
  for (let y = 0; y < GRID_ROWS; y++) {
    grid[y][0] = 1;
    grid[y][GRID_COLS - 1] = 1;
  }

  // Add some interior walls
  for (let y = 2; y < 6; y++) {
    grid[y][5] = 1;
  }
  
  grid[3][7] = 1;
  grid[3][8] = 1;
  grid[4][7] = 1;
  grid[4][8] = 1;

  // Create player
  const player = new Player(2, 2);
  entities.push(player);

  // Create guards
  const guard1 = new Guard(8, 3, { x: 1, y: 0 }, [
    { x: 8, y: 3 },
    { x: 9, y: 3 },
    { x: 9, y: 4 },
    { x: 8, y: 4 }
  ]);
  entities.push(guard1);

  // Create turret
  const turret = new Turret(6, 2);
  entities.push(turret);

  // Create terminal
  const terminal = new Terminal(6, 5);
  entities.push(terminal);

  // Create exit
  const exit = new Exit(10, 6);
  entities.push(exit);

  return { grid, entities, player };
}

export function createLevel2(p) {
  const grid = createEmptyGrid();
  const entities = [];

  // Create walls
  for (let x = 0; x < GRID_COLS; x++) {
    grid[0][x] = 1;
    grid[GRID_ROWS - 1][x] = 1;
  }
  for (let y = 0; y < GRID_ROWS; y++) {
    grid[y][0] = 1;
    grid[y][GRID_COLS - 1] = 1;
  }

  // Central corridor
  for (let x = 3; x < 9; x++) {
    grid[3][x] = 1;
    grid[5][x] = 1;
  }

  // Player
  const player = new Player(1, 1);
  entities.push(player);

  // Multiple guards
  const guard1 = new Guard(6, 4, { x: 0, y: 1 }, [
    { x: 6, y: 4 },
    { x: 7, y: 4 },
    { x: 7, y: 4 },
    { x: 6, y: 4 }
  ]);
  entities.push(guard1);

  const guard2 = new Guard(2, 6, { x: 1, y: 0 }, [
    { x: 2, y: 6 },
    { x: 4, y: 6 },
    { x: 4, y: 6 },
    { x: 2, y: 6 }
  ]);
  entities.push(guard2);

  // Drone
  const drone = new Drone(8, 1, [
    { x: 8, y: 1 },
    { x: 9, y: 1 },
    { x: 9, y: 2 },
    { x: 8, y: 2 }
  ]);
  entities.push(drone);

  // Turrets
  const turret1 = new Turret(4, 4);
  const turret2 = new Turret(7, 6);
  entities.push(turret1, turret2);

  // Terminals
  const terminal1 = new Terminal(2, 4);
  entities.push(terminal1);

  // Exit
  const exit = new Exit(10, 6);
  entities.push(exit);

  return { grid, entities, player };
}

export function createLevel3(p) {
  const grid = createEmptyGrid();
  const entities = [];

  // Create maze-like walls
  for (let x = 0; x < GRID_COLS; x++) {
    grid[0][x] = 1;
    grid[GRID_ROWS - 1][x] = 1;
  }
  for (let y = 0; y < GRID_ROWS; y++) {
    grid[y][0] = 1;
    grid[y][GRID_COLS - 1] = 1;
  }

  // Complex interior
  grid[2][3] = 1;
  grid[2][4] = 1;
  grid[2][5] = 1;
  grid[4][7] = 1;
  grid[5][7] = 1;
  grid[6][7] = 1;
  grid[4][3] = 1;
  grid[4][4] = 1;

  // Player
  const player = new Player(1, 6);
  entities.push(player);

  // Multiple guards with complex patrols
  const guard1 = new Guard(3, 1, { x: 1, y: 0 }, [
    { x: 3, y: 1 },
    { x: 6, y: 1 },
    { x: 6, y: 3 },
    { x: 3, y: 3 }
  ]);
  entities.push(guard1);

  const guard2 = new Guard(8, 5, { x: 0, y: 1 }, [
    { x: 8, y: 5 },
    { x: 8, y: 3 },
    { x: 9, y: 3 },
    { x: 9, y: 5 }
  ]);
  entities.push(guard2);

  // Drones
  const drone1 = new Drone(2, 5, [
    { x: 2, y: 5 },
    { x: 3, y: 5 },
    { x: 3, y: 6 },
    { x: 2, y: 6 }
  ]);
  entities.push(drone1);

  // Turrets
  const turret1 = new Turret(6, 4);
  const turret2 = new Turret(5, 2);
  entities.push(turret1, turret2);

  // Terminals
  const terminal1 = new Terminal(5, 5);
  const terminal2 = new Terminal(8, 1);
  entities.push(terminal1, terminal2);

  // Exit
  const exit = new Exit(10, 1);
  entities.push(exit);

  return { grid, entities, player };
}

export function loadLevel(level, p) {
  switch (level) {
    case 1:
      return createLevel1(p);
    case 2:
      return createLevel2(p);
    case 3:
      return createLevel3(p);
    default:
      return createLevel1(p);
  }
}

export function isWalkable(grid, x, y) {
  if (y < 0 || y >= GRID_ROWS || x < 0 || x >= GRID_COLS) {
    return false;
  }
  return grid[y][x] === 0;
}

export function getEntityAt(entities, x, y, excludePlayer = false) {
  return entities.find(e => 
    !e.removed && 
    e.isAt(x, y) && 
    (!excludePlayer || e.type !== ENTITY_TYPE.PLAYER)
  );
}