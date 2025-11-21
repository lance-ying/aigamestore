// level.js
import { gameState, CANVAS_HEIGHT } from './globals.js';
import { Zombie, Human, Wall, Hazard } from './entities.js';

export function initializeLevel(p) {
  gameState.entities = [];
  gameState.zombies = [];
  gameState.humans = [];
  gameState.walls = [];
  gameState.hazards = [];
  gameState.explosions = [];
  gameState.cameraX = 0;
  gameState.selectedZombie = null;
  gameState.dnaPoints = 50;
  gameState.score = 0;
  gameState.humansConverted = 0;
  gameState.mutationCooldowns = {
    OVERLORD: 0,
    EXPLODER: 0,
    RUNNER: 0
  };

  // Create initial zombie
  const zombie = new Zombie(p, 50, 100);
  gameState.zombies.push(zombie);
  gameState.entities.push(zombie);
  gameState.player = zombie;

  // Create humans
  const humanPositions = [
    [300, CANVAS_HEIGHT - 50],
    [450, CANVAS_HEIGHT - 50],
    [650, 200],
    [800, CANVAS_HEIGHT - 50],
    [950, 150],
    [1100, CANVAS_HEIGHT - 50],
    [750, 250],
    [550, 150],
    [900, 100],
    [400, 180]
  ];

  for (const [x, y] of humanPositions) {
    const human = new Human(p, x, y);
    gameState.humans.push(human);
    gameState.entities.push(human);
  }

  gameState.totalHumans = gameState.humans.length;

  // Create walls - platforms and obstacles
  const wallData = [
    // Platforms
    [0, CANVAS_HEIGHT - 30, gameState.levelWidth, 30, false],
    [250, 220, 120, 20, false],
    [500, 180, 100, 20, false],
    [700, 280, 150, 20, false],
    [900, 130, 120, 20, false],
    
    // Destructible walls
    [420, 220, 30, 60, true],
    [850, 280, 30, 70, true],
    [600, 130, 40, 50, true],
  ];

  for (const [x, y, w, h, destructible] of wallData) {
    const wall = new Wall(p, x, y, w, h, destructible);
    gameState.walls.push(wall);
    gameState.entities.push(wall);
  }

  // Create hazards
  const hazardData = [
    [380, CANVAS_HEIGHT - 40, 60, 10],
    [1000, CANVAS_HEIGHT - 40, 80, 10],
  ];

  for (const [x, y, w, h] of hazardData) {
    const hazard = new Hazard(p, x, y, w, h);
    gameState.hazards.push(hazard);
    gameState.entities.push(hazard);
  }
}