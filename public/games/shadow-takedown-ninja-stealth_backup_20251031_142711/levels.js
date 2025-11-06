// levels.js - Level definitions and management

import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Wall, Vent, Barrel } from './environment.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function loadLevel(p, levelNum) {
  // Clear existing entities
  gameState.entities = [];
  gameState.enemies = [];
  gameState.walls = [];
  gameState.vents = [];
  gameState.barrels = [];
  gameState.primaryTargets = [];
  gameState.detectionProgress = 0;
  gameState.detectingEnemy = null;
  gameState.stealthBonusEligible = true;
  gameState.levelStartTime = Date.now();

  if (levelNum === 1) {
    loadLevel1(p);
  } else if (levelNum === 2) {
    loadLevel2(p);
  } else if (levelNum === 3) {
    loadLevel3(p);
  }
}

function loadLevel1(p) {
  // Player
  gameState.player = new Player(p, 50, 200);
  gameState.entities.push(gameState.player);

  // Walls - simple room
  const walls = [
    new Wall(p, 0, 0, CANVAS_WIDTH, 10), // top
    new Wall(p, 0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10), // bottom
    new Wall(p, 0, 0, 10, CANVAS_HEIGHT), // left
    new Wall(p, CANVAS_WIDTH - 10, 0, 10, CANVAS_HEIGHT), // right
    new Wall(p, 150, 100, 100, 20), // obstacle 1
    new Wall(p, 350, 250, 100, 20), // obstacle 2
  ];
  gameState.walls = walls;

  // Vents
  const vent1 = new Vent(p, 100, 100);
  const vent2 = new Vent(p, 500, 300);
  vent1.linkTo(vent2);
  gameState.vents = [vent1, vent2];

  // Enemies
  const enemy1 = new Enemy(p, 300, 150, null, true); // stationary primary target
  const enemy2 = new Enemy(p, 450, 200, [
    { x: 450, y: 200 },
    { x: 450, y: 300 }
  ], false);
  const enemy3 = new Enemy(p, 250, 300, null, false);

  gameState.enemies = [enemy1, enemy2, enemy3];
  enemy1.direction = p.PI;
  enemy3.direction = 0;
  
  if (enemy1.isPrimaryTarget) gameState.primaryTargets.push(enemy1);
  
  gameState.entities.push(...gameState.enemies);
}

function loadLevel2(p) {
  // Player
  gameState.player = new Player(p, 50, 50);
  gameState.entities.push(gameState.player);

  // Walls - warehouse with aisles
  const walls = [
    new Wall(p, 0, 0, CANVAS_WIDTH, 10),
    new Wall(p, 0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10),
    new Wall(p, 0, 0, 10, CANVAS_HEIGHT),
    new Wall(p, CANVAS_WIDTH - 10, 0, 10, CANVAS_HEIGHT),
    // Aisles
    new Wall(p, 150, 50, 20, 150),
    new Wall(p, 300, 200, 20, 150),
    new Wall(p, 450, 50, 20, 150),
    new Wall(p, 200, 100, 100, 20),
  ];
  gameState.walls = walls;

  // Vents
  const vent1 = new Vent(p, 80, 350);
  const vent2 = new Vent(p, 520, 80);
  vent1.linkTo(vent2);
  gameState.vents = [vent1, vent2];

  // Barrel
  const barrel1 = new Barrel(p, 250, 300);
  gameState.barrels = [barrel1];

  // Enemies
  const enemy1 = new Enemy(p, 200, 250, [
    { x: 200, y: 250 },
    { x: 200, y: 150 },
    { x: 350, y: 150 },
    { x: 350, y: 250 }
  ], true);
  
  const enemy2 = new Enemy(p, 400, 300, [
    { x: 400, y: 300 },
    { x: 500, y: 300 }
  ], false);
  
  const enemy3 = new Enemy(p, 250, 80, null, false);
  const enemy4 = new Enemy(p, 500, 250, null, true);
  
  enemy3.direction = p.PI / 2;
  enemy4.direction = p.PI;

  gameState.enemies = [enemy1, enemy2, enemy3, enemy4];
  
  if (enemy1.isPrimaryTarget) gameState.primaryTargets.push(enemy1);
  if (enemy4.isPrimaryTarget) gameState.primaryTargets.push(enemy4);
  
  gameState.entities.push(...gameState.enemies);
}

function loadLevel3(p) {
  // Player
  gameState.player = new Player(p, 50, 200);
  gameState.entities.push(gameState.player);

  // Walls - office complex
  const walls = [
    new Wall(p, 0, 0, CANVAS_WIDTH, 10),
    new Wall(p, 0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10),
    new Wall(p, 0, 0, 10, CANVAS_HEIGHT),
    new Wall(p, CANVAS_WIDTH - 10, 0, 10, CANVAS_HEIGHT),
    // Cubicles
    new Wall(p, 120, 80, 60, 15),
    new Wall(p, 120, 180, 60, 15),
    new Wall(p, 120, 280, 60, 15),
    new Wall(p, 250, 80, 60, 15),
    new Wall(p, 250, 180, 60, 15),
    new Wall(p, 250, 280, 60, 15),
    new Wall(p, 380, 80, 60, 15),
    new Wall(p, 380, 180, 60, 15),
    new Wall(p, 380, 280, 60, 15),
    // Corridors
    new Wall(p, 500, 100, 15, 100),
  ];
  gameState.walls = walls;

  // Vents
  const vent1 = new Vent(p, 80, 100);
  const vent2 = new Vent(p, 520, 300);
  const vent3 = new Vent(p, 300, 50);
  const vent4 = new Vent(p, 300, 350);
  vent1.linkTo(vent2);
  vent3.linkTo(vent4);
  gameState.vents = [vent1, vent2, vent3, vent4];

  // Barrels
  const barrel1 = new Barrel(p, 350, 120);
  const barrel2 = new Barrel(p, 220, 250);
  gameState.barrels = [barrel1, barrel2];

  // Enemies
  const enemy1 = new Enemy(p, 200, 150, [
    { x: 200, y: 150 },
    { x: 280, y: 150 },
    { x: 280, y: 250 },
    { x: 200, y: 250 }
  ], true);
  enemy1.speed = 1.2;

  const enemy2 = new Enemy(p, 400, 200, [
    { x: 400, y: 200 },
    { x: 480, y: 200 },
    { x: 480, y: 100 },
    { x: 400, y: 100 }
  ], false);
  enemy2.speed = 1.2;

  const enemy3 = new Enemy(p, 150, 320, [
    { x: 150, y: 320 },
    { x: 350, y: 320 }
  ], true);
  enemy3.speed = 1.0;

  const enemy4 = new Enemy(p, 500, 50, null, false);
  enemy4.direction = p.PI;

  const enemy5 = new Enemy(p, 420, 320, null, true);
  enemy5.direction = p.PI / 2;

  const enemy6 = new Enemy(p, 80, 50, null, false);
  enemy6.direction = 0;

  gameState.enemies = [enemy1, enemy2, enemy3, enemy4, enemy5, enemy6];
  
  if (enemy1.isPrimaryTarget) gameState.primaryTargets.push(enemy1);
  if (enemy3.isPrimaryTarget) gameState.primaryTargets.push(enemy3);
  if (enemy5.isPrimaryTarget) gameState.primaryTargets.push(enemy5);
  
  gameState.entities.push(...gameState.enemies);
}