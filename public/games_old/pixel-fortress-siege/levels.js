// levels.js - Level definitions and configuration

import {
  UNIT_GOBLIN,
  UNIT_BARBARIAN,
  UNIT_GIANT,
  STRUCTURE_TOWN_HALL,
  STRUCTURE_WALL,
  STRUCTURE_BARRACKS,
  STRUCTURE_FORTRESS,
  STRUCTURE_CANNON,
  STRUCTURE_ARCHER_TOWER,
  GRID_SIZE
} from './globals.js';

export const LEVELS = [
  {
    // Level 1: Basic Training
    number: 1,
    name: "Basic Training",
    startingGold: 500,
    goldPerSecond: 10,
    deploymentZone: { x: 0, y: 0, width: 6, height: 20 },
    playerStructures: [
      { type: STRUCTURE_TOWN_HALL, gridX: 2, gridY: 10, hp: 1000 }
    ],
    enemyStructures: [
      { type: STRUCTURE_BARRACKS, gridX: 25, gridY: 10, hp: 500 }
    ],
    waves: [
      { delay: 2, units: [{ type: UNIT_GOBLIN, count: 5 }] },
      { delay: 8, units: [{ type: UNIT_GOBLIN, count: 5 }] }
    ],
    unitCosts: { WARRIOR: 50, ARCHER: 999, SORCERER: 999 }
  },
  {
    // Level 2: First Skirmish
    number: 2,
    name: "First Skirmish",
    startingGold: 400,
    goldPerSecond: 8,
    deploymentZone: { x: 0, y: 0, width: 6, height: 20 },
    playerStructures: [
      { type: STRUCTURE_TOWN_HALL, gridX: 2, gridY: 10, hp: 1200 }
    ],
    enemyStructures: [
      { type: STRUCTURE_WALL, gridX: 20, gridY: 8, hp: 200 },
      { type: STRUCTURE_WALL, gridX: 20, gridY: 9, hp: 200 },
      { type: STRUCTURE_WALL, gridX: 20, gridY: 10, hp: 200 },
      { type: STRUCTURE_WALL, gridX: 20, gridY: 11, hp: 200 },
      { type: STRUCTURE_WALL, gridX: 20, gridY: 12, hp: 200 },
      { type: STRUCTURE_CANNON, gridX: 23, gridY: 10, hp: 300 },
      { type: STRUCTURE_BARRACKS, gridX: 26, gridY: 10, hp: 600 }
    ],
    waves: [
      { delay: 2, units: [{ type: UNIT_GOBLIN, count: 5 }] },
      { delay: 6, units: [{ type: UNIT_GOBLIN, count: 5 }, { type: UNIT_BARBARIAN, count: 3 }] },
      { delay: 10, units: [{ type: UNIT_BARBARIAN, count: 3 }] }
    ],
    unitCosts: { WARRIOR: 60, ARCHER: 75, SORCERER: 999 }
  },
  {
    // Level 3: Fortress Assault
    number: 3,
    name: "Fortress Assault",
    startingGold: 300,
    goldPerSecond: 6,
    deploymentZone: { x: 0, y: 0, width: 6, height: 20 },
    playerStructures: [
      { type: STRUCTURE_TOWN_HALL, gridX: 2, gridY: 10, hp: 1500 }
    ],
    enemyStructures: [
      { type: STRUCTURE_WALL, gridX: 18, gridY: 6, hp: 250 },
      { type: STRUCTURE_WALL, gridX: 18, gridY: 7, hp: 250 },
      { type: STRUCTURE_WALL, gridX: 18, gridY: 8, hp: 250 },
      { type: STRUCTURE_WALL, gridX: 18, gridY: 12, hp: 250 },
      { type: STRUCTURE_WALL, gridX: 18, gridY: 13, hp: 250 },
      { type: STRUCTURE_WALL, gridX: 18, gridY: 14, hp: 250 },
      { type: STRUCTURE_CANNON, gridX: 21, gridY: 8, hp: 350 },
      { type: STRUCTURE_CANNON, gridX: 21, gridY: 12, hp: 350 },
      { type: STRUCTURE_ARCHER_TOWER, gridX: 23, gridY: 10, hp: 300 },
      { type: STRUCTURE_FORTRESS, gridX: 26, gridY: 10, hp: 800 }
    ],
    waves: [
      { delay: 2, units: [{ type: UNIT_GOBLIN, count: 6 }] },
      { delay: 5, units: [{ type: UNIT_GOBLIN, count: 6 }, { type: UNIT_BARBARIAN, count: 4 }] },
      { delay: 8, units: [{ type: UNIT_BARBARIAN, count: 4 }, { type: UNIT_GIANT, count: 1 }] },
      { delay: 12, units: [{ type: UNIT_GIANT, count: 2 }] }
    ],
    unitCosts: { WARRIOR: 70, ARCHER: 85, SORCERER: 120 }
  },
  {
    // Level 4: Grand Siege
    number: 4,
    name: "Grand Siege",
    startingGold: 200,
    goldPerSecond: 4,
    deploymentZone: { x: 0, y: 0, width: 6, height: 20 },
    playerStructures: [
      { type: STRUCTURE_TOWN_HALL, gridX: 2, gridY: 10, hp: 2000 }
    ],
    enemyStructures: [
      { type: STRUCTURE_WALL, gridX: 16, gridY: 5, hp: 300 },
      { type: STRUCTURE_WALL, gridX: 16, gridY: 6, hp: 300 },
      { type: STRUCTURE_WALL, gridX: 16, gridY: 7, hp: 300 },
      { type: STRUCTURE_WALL, gridX: 16, gridY: 8, hp: 300 },
      { type: STRUCTURE_WALL, gridX: 16, gridY: 12, hp: 300 },
      { type: STRUCTURE_WALL, gridX: 16, gridY: 13, hp: 300 },
      { type: STRUCTURE_WALL, gridX: 16, gridY: 14, hp: 300 },
      { type: STRUCTURE_WALL, gridX: 16, gridY: 15, hp: 300 },
      { type: STRUCTURE_WALL, gridX: 22, gridY: 7, hp: 300 },
      { type: STRUCTURE_WALL, gridX: 22, gridY: 8, hp: 300 },
      { type: STRUCTURE_WALL, gridX: 22, gridY: 12, hp: 300 },
      { type: STRUCTURE_WALL, gridX: 22, gridY: 13, hp: 300 },
      { type: STRUCTURE_CANNON, gridX: 19, gridY: 7, hp: 400 },
      { type: STRUCTURE_CANNON, gridX: 19, gridY: 10, hp: 400 },
      { type: STRUCTURE_CANNON, gridX: 19, gridY: 13, hp: 400 },
      { type: STRUCTURE_ARCHER_TOWER, gridX: 24, gridY: 8, hp: 350 },
      { type: STRUCTURE_ARCHER_TOWER, gridX: 24, gridY: 12, hp: 350 },
      { type: STRUCTURE_FORTRESS, gridX: 27, gridY: 10, hp: 1000 }
    ],
    waves: [
      { delay: 2, units: [{ type: UNIT_GOBLIN, count: 8 }] },
      { delay: 5, units: [{ type: UNIT_GOBLIN, count: 8 }, { type: UNIT_BARBARIAN, count: 5 }] },
      { delay: 8, units: [{ type: UNIT_BARBARIAN, count: 6 }, { type: UNIT_GIANT, count: 2 }] },
      { delay: 11, units: [{ type: UNIT_GIANT, count: 2 }, { type: UNIT_BARBARIAN, count: 4 }] },
      { delay: 15, units: [{ type: UNIT_GIANT, count: 3 }] }
    ],
    unitCosts: { WARRIOR: 80, ARCHER: 95, SORCERER: 135 }
  }
];

export function getLevelConfig(levelNumber) {
  if (levelNumber < 1 || levelNumber > LEVELS.length) {
    return null;
  }
  return LEVELS[levelNumber - 1];
}