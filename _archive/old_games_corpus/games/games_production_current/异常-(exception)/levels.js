import { DIRECTIONS } from './globals.js';

export const levels = [
  {
    name: "Tutorial: Basic Movement",
    robots: [{ x: 1, y: 2, dir: DIRECTIONS.RIGHT }],
    enemies: [{ x: 4, y: 2, type: 'basic' }],
    exits: [],
    obstacles: [],
    objective: "Eliminate all enemies",
    hint: "Use MOVE_FORWARD and ATTACK"
  },
  {
    name: "Turning Challenge",
    robots: [{ x: 1, y: 1, dir: DIRECTIONS.RIGHT }],
    enemies: [{ x: 4, y: 1, type: 'basic' }, { x: 4, y: 4, type: 'basic' }],
    exits: [],
    obstacles: [{ x: 2, y: 2 }, { x: 3, y: 2 }],
    objective: "Eliminate all enemies",
    hint: "Use TURN commands to navigate"
  },
  {
    name: "Exit Strategy",
    robots: [{ x: 1, y: 1, dir: DIRECTIONS.RIGHT }],
    enemies: [],
    exits: [{ x: 8, y: 4 }],
    obstacles: [{ x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 }],
    objective: "Reach the exit",
    hint: "Navigate around obstacles"
  },
  {
    name: "Tough Enemy",
    robots: [{ x: 1, y: 2, dir: DIRECTIONS.RIGHT }],
    enemies: [{ x: 6, y: 2, type: 'tough' }],
    exits: [],
    obstacles: [],
    objective: "Eliminate all enemies",
    hint: "Tough enemies need 2 hits"
  },
  {
    name: "Multi-Robot Coordination",
    robots: [
      { x: 1, y: 1, dir: DIRECTIONS.RIGHT },
      { x: 1, y: 4, dir: DIRECTIONS.RIGHT }
    ],
    enemies: [
      { x: 5, y: 1, type: 'basic' },
      { x: 5, y: 4, type: 'basic' },
      { x: 7, y: 2, type: 'tough' }
    ],
    exits: [],
    obstacles: [{ x: 3, y: 2 }, { x: 3, y: 3 }],
    objective: "Eliminate all enemies",
    hint: "Program both robots carefully"
  }
];

export function getLevelCount() {
  return levels.length;
}

export function getLevel(index) {
  if (index >= 0 && index < levels.length) {
    return levels[index];
  }
  return null;
}