// level_generator.js
import { Wall } from './entities.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE } from './globals.js';

export function generateLevel(floorNum, p) {
  const layout = {
    walls: [],
    enemySpawns: [],
    playerSpawn: { x: 0, y: 0 }
  };

  const worldWidth = CANVAS_WIDTH * 3;
  const worldHeight = CANVAS_HEIGHT * 3;

  // Outer walls
  layout.walls.push(new Wall(0, 0, worldWidth, TILE_SIZE)); // Top
  layout.walls.push(new Wall(0, worldHeight - TILE_SIZE, worldWidth, TILE_SIZE)); // Bottom
  layout.walls.push(new Wall(0, 0, TILE_SIZE, worldHeight)); // Left
  layout.walls.push(new Wall(worldWidth - TILE_SIZE, 0, TILE_SIZE, worldHeight)); // Right

  // Generate rooms based on floor
  if (floorNum === 0) {
    generateFloor1(layout, p);
  } else if (floorNum === 1) {
    generateFloor2(layout, p);
  } else {
    generateFloor3(layout, p);
  }

  return layout;
}

function generateFloor1(layout, p) {
  const worldWidth = CANVAS_WIDTH * 3;
  const worldHeight = CANVAS_HEIGHT * 3;

  // Simple corridor layout
  // Vertical corridor
  layout.walls.push(new Wall(worldWidth / 2 - TILE_SIZE * 2, TILE_SIZE, TILE_SIZE, worldHeight / 3));
  layout.walls.push(new Wall(worldWidth / 2 + TILE_SIZE, TILE_SIZE, TILE_SIZE, worldHeight / 3));

  // Horizontal corridor
  layout.walls.push(new Wall(TILE_SIZE, worldHeight / 2 - TILE_SIZE, worldWidth / 2 - TILE_SIZE * 3, TILE_SIZE));
  layout.walls.push(new Wall(TILE_SIZE, worldHeight / 2 + TILE_SIZE, worldWidth / 2 - TILE_SIZE * 3, TILE_SIZE));

  // Room dividers
  layout.walls.push(new Wall(worldWidth - TILE_SIZE * 6, TILE_SIZE, TILE_SIZE, worldHeight / 2 - TILE_SIZE * 2));
  layout.walls.push(new Wall(worldWidth - TILE_SIZE * 6, worldHeight / 2 + TILE_SIZE, TILE_SIZE, worldHeight / 2 - TILE_SIZE * 2));

  // Player spawn
  layout.playerSpawn = { x: 100, y: 100 };

  // Enemy spawns
  layout.enemySpawns = [
    { x: worldWidth / 2, y: worldHeight / 4, patrol: [{x: worldWidth / 2, y: worldHeight / 4}, {x: worldWidth / 2 + 100, y: worldHeight / 4}] },
    { x: worldWidth / 4, y: worldHeight / 2, patrol: [{x: worldWidth / 4, y: worldHeight / 2}, {x: worldWidth / 4, y: worldHeight / 2 + 100}] },
    { x: worldWidth - 200, y: 200, patrol: [{x: worldWidth - 200, y: 200}, {x: worldWidth - 300, y: 200}] },
    { x: worldWidth - 200, y: worldHeight - 200, patrol: [{x: worldWidth - 200, y: worldHeight - 200}, {x: worldWidth - 200, y: worldHeight - 300}] }
  ];
}

function generateFloor2(layout, p) {
  const worldWidth = CANVAS_WIDTH * 3;
  const worldHeight = CANVAS_HEIGHT * 3;

  // Multiple rooms
  // Central room
  layout.walls.push(new Wall(worldWidth / 2 - TILE_SIZE * 3, worldHeight / 2 - TILE_SIZE * 3, TILE_SIZE, TILE_SIZE * 6));
  layout.walls.push(new Wall(worldWidth / 2 + TILE_SIZE * 2, worldHeight / 2 - TILE_SIZE * 3, TILE_SIZE, TILE_SIZE * 6));
  layout.walls.push(new Wall(worldWidth / 2 - TILE_SIZE * 3, worldHeight / 2 - TILE_SIZE * 3, TILE_SIZE * 6, TILE_SIZE));
  layout.walls.push(new Wall(worldWidth / 2 - TILE_SIZE * 3, worldHeight / 2 + TILE_SIZE * 2, TILE_SIZE * 6, TILE_SIZE));

  // Side rooms
  layout.walls.push(new Wall(TILE_SIZE * 4, TILE_SIZE * 4, TILE_SIZE, TILE_SIZE * 6));
  layout.walls.push(new Wall(worldWidth - TILE_SIZE * 5, TILE_SIZE * 4, TILE_SIZE, TILE_SIZE * 6));

  layout.playerSpawn = { x: 100, y: worldHeight - 100 };

  layout.enemySpawns = [
    { x: worldWidth / 2, y: worldHeight / 2, patrol: [{x: worldWidth / 2, y: worldHeight / 2}, {x: worldWidth / 2 + 80, y: worldHeight / 2}] },
    { x: 200, y: 200, patrol: [{x: 200, y: 200}, {x: 200, y: 300}] },
    { x: worldWidth - 200, y: 200, patrol: [{x: worldWidth - 200, y: 200}, {x: worldWidth - 300, y: 250}] },
    { x: worldWidth / 4, y: worldHeight - 200, patrol: [{x: worldWidth / 4, y: worldHeight - 200}, {x: worldWidth / 4 + 100, y: worldHeight - 200}] },
    { x: worldWidth - worldWidth / 4, y: worldHeight - 200, patrol: [{x: worldWidth - worldWidth / 4, y: worldHeight - 200}, {x: worldWidth - worldWidth / 4 - 100, y: worldHeight - 200}] },
    { x: worldWidth / 2 - 150, y: worldHeight / 2, patrol: [{x: worldWidth / 2 - 150, y: worldHeight / 2}, {x: worldWidth / 2 - 150, y: worldHeight / 2 + 100}] }
  ];
}

function generateFloor3(layout, p) {
  const worldWidth = CANVAS_WIDTH * 3;
  const worldHeight = CANVAS_HEIGHT * 3;

  // Complex maze-like structure
  layout.walls.push(new Wall(TILE_SIZE * 6, TILE_SIZE * 3, TILE_SIZE, TILE_SIZE * 8));
  layout.walls.push(new Wall(TILE_SIZE * 12, TILE_SIZE * 3, TILE_SIZE, TILE_SIZE * 8));
  layout.walls.push(new Wall(TILE_SIZE * 18, TILE_SIZE * 3, TILE_SIZE, TILE_SIZE * 8));
  layout.walls.push(new Wall(TILE_SIZE * 24, TILE_SIZE * 3, TILE_SIZE, TILE_SIZE * 8));

  layout.walls.push(new Wall(TILE_SIZE * 3, TILE_SIZE * 6, TILE_SIZE * 8, TILE_SIZE));
  layout.walls.push(new Wall(TILE_SIZE * 15, TILE_SIZE * 6, TILE_SIZE * 8, TILE_SIZE));

  layout.walls.push(new Wall(TILE_SIZE * 9, TILE_SIZE * 12, TILE_SIZE * 6, TILE_SIZE));
  layout.walls.push(new Wall(TILE_SIZE * 20, TILE_SIZE * 12, TILE_SIZE * 6, TILE_SIZE));

  layout.playerSpawn = { x: 80, y: 80 };

  layout.enemySpawns = [
    { x: 300, y: 200, patrol: [{x: 300, y: 200}, {x: 400, y: 200}] },
    { x: 600, y: 300, patrol: [{x: 600, y: 300}, {x: 600, y: 400}] },
    { x: 900, y: 200, patrol: [{x: 900, y: 200}, {x: 1000, y: 250}] },
    { x: 1200, y: 300, patrol: [{x: 1200, y: 300}, {x: 1200, y: 400}] },
    { x: 1500, y: 200, patrol: [{x: 1500, y: 200}, {x: 1400, y: 200}] },
    { x: 500, y: 600, patrol: [{x: 500, y: 600}, {x: 600, y: 600}] },
    { x: 1000, y: 700, patrol: [{x: 1000, y: 700}, {x: 1000, y: 800}] },
    { x: 1400, y: 900, patrol: [{x: 1400, y: 900}, {x: 1500, y: 900}] }
  ];
}