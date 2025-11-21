import { Robot, Enemy, Exit } from './entities.js';
import { DIRECTION } from './globals.js';

export function createLevels() {
  return [
    // Level 1: Basic movement
    {
      name: "BASIC MOVEMENT",
      description: "Move your robot to the exit",
      robots: [
        { x: 1, y: 8, dir: DIRECTION.RIGHT }
      ],
      enemies: [],
      exit: { x: 13, y: 8 }
    },
    // Level 2: Turn and move
    {
      name: "NAVIGATION",
      description: "Navigate around obstacles",
      robots: [
        { x: 1, y: 1, dir: DIRECTION.RIGHT }
      ],
      enemies: [],
      exit: { x: 13, y: 8 }
    },
    // Level 3: First enemy
    {
      name: "FIRST CONTACT",
      description: "Destroy the enemy",
      robots: [
        { x: 2, y: 5, dir: DIRECTION.RIGHT }
      ],
      enemies: [
        { x: 5, y: 5 }
      ],
      exit: { x: 12, y: 5 }
    },
    // Level 4: Multiple enemies
    {
      name: "MULTIPLE TARGETS",
      description: "Eliminate all threats",
      robots: [
        { x: 1, y: 1, dir: DIRECTION.DOWN }
      ],
      enemies: [
        { x: 1, y: 3 },
        { x: 1, y: 5 },
        { x: 1, y: 7 }
      ],
      exit: { x: 13, y: 7 }
    },
    // Level 5: Two robots
    {
      name: "COOPERATION",
      description: "Program both robots to succeed",
      robots: [
        { x: 1, y: 2, dir: DIRECTION.RIGHT },
        { x: 1, y: 7, dir: DIRECTION.RIGHT }
      ],
      enemies: [
        { x: 7, y: 2 },
        { x: 7, y: 7 }
      ],
      exit: { x: 13, y: 5 }
    }
  ];
}

export function loadLevel(levelIndex, gameState) {
  const levels = createLevels();
  if (levelIndex >= levels.length) {
    return false;
  }

  const level = levels[levelIndex];
  gameState.robots = [];
  gameState.enemies = [];
  gameState.entities = [];

  // Create robots
  level.robots.forEach(robotData => {
    const robot = new Robot(robotData.x, robotData.y, robotData.dir);
    gameState.robots.push(robot);
    gameState.entities.push(robot);
  });

  // Create enemies
  level.enemies.forEach(enemyData => {
    const enemy = new Enemy(enemyData.x, enemyData.y);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  });

  // Create exit
  gameState.exit = new Exit(level.exit.x, level.exit.y);
  gameState.entities.push(gameState.exit);

  gameState.programming.selectedRobot = 0;
  gameState.programming.selectedCommand = 0;
  gameState.programming.isInMenu = true;
  gameState.simulation.running = false;
  gameState.simulation.timeElapsed = 0;

  return true;
}

export function getTotalLevels() {
  return createLevels().length;
}

export function getLevelData(levelIndex) {
  const levels = createLevels();
  if (levelIndex >= 0 && levelIndex < levels.length) {
    return levels[levelIndex];
  }
  return null;
}