// config.js - Game configuration and level data

import { ZOMBIE_WALKER, ZOMBIE_RUNNER, ZOMBIE_TANK, ZOMBIE_BOSS, OBSTACLE_BARRICADE, OBSTACLE_CAR } from './globals.js';

export const HERO_CONFIG = {
  INFANTRY: {
    name: "Infantry",
    cost: 50,
    cooldown: 300, // frames (5 seconds at 60fps)
    baseHP: 100,
    baseDamage: 15,
    attackSpeed: 60, // frames between attacks
    moveSpeed: 0.5,
    range: 80,
    skillCooldown: 600,
    color: [80, 120, 200],
    size: 20
  },
  ENGINEER: {
    name: "Engineer",
    cost: 75,
    cooldown: 420,
    baseHP: 80,
    baseDamage: 10,
    attackSpeed: 90,
    moveSpeed: 0.4,
    range: 100,
    skillCooldown: 480,
    color: [220, 180, 40],
    size: 18
  },
  MEDIC: {
    name: "Medic",
    cost: 60,
    cooldown: 360,
    baseHP: 60,
    baseDamage: 8,
    attackSpeed: 120,
    moveSpeed: 0.6,
    range: 70,
    skillCooldown: 540,
    color: [240, 240, 240],
    size: 16
  }
};

export const ZOMBIE_CONFIG = {
  WALKER: {
    name: "Walker",
    hp: 50,
    damage: 10,
    speed: 0.3,
    reward: 10,
    color: [120, 140, 120],
    size: 18
  },
  RUNNER: {
    name: "Runner",
    hp: 30,
    damage: 5,
    speed: 0.7,
    reward: 20,
    color: [180, 60, 60],
    size: 15
  },
  TANK: {
    name: "Tank",
    hp: 200,
    damage: 20,
    speed: 0.15,
    reward: 30,
    color: [100, 80, 60],
    size: 28
  },
  BOSS: {
    name: "Boss",
    hp: 500,
    damage: 30,
    speed: 0.2,
    reward: 100,
    color: [150, 40, 40],
    size: 35
  }
};

export const OBSTACLE_CONFIG = {
  BARRICADE: {
    hp: 40,
    reward: 50,
    color: [120, 80, 40],
    width: 30,
    height: 40
  },
  CAR: {
    hp: 80,
    reward: 50,
    color: [80, 80, 90],
    width: 50,
    height: 35
  }
};

export const LEVEL_CONFIG = [
  {
    level: 1,
    name: "First Contact",
    waves: [
      { zombies: [{ type: ZOMBIE_WALKER, count: 3 }], obstacles: [] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 4 }], obstacles: [] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 5 }], obstacles: [] }
    ],
    rewards: { gold: 100, supplies: 30 }
  },
  {
    level: 2,
    name: "Scavenger's Run",
    waves: [
      { zombies: [{ type: ZOMBIE_WALKER, count: 4 }, { type: ZOMBIE_RUNNER, count: 2 }], obstacles: [{ type: OBSTACLE_BARRICADE, lane: 1 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 5 }, { type: ZOMBIE_RUNNER, count: 3 }], obstacles: [{ type: OBSTACLE_BARRICADE, lane: 0 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 6 }, { type: ZOMBIE_RUNNER, count: 4 }], obstacles: [{ type: OBSTACLE_BARRICADE, lane: 2 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 5 }, { type: ZOMBIE_RUNNER, count: 5 }], obstacles: [] }
    ],
    rewards: { gold: 150, supplies: 50 }
  },
  {
    level: 3,
    name: "Fortress Defense",
    waves: [
      { zombies: [{ type: ZOMBIE_WALKER, count: 6 }, { type: ZOMBIE_RUNNER, count: 4 }, { type: ZOMBIE_TANK, count: 1 }], obstacles: [{ type: OBSTACLE_BARRICADE, lane: 0 }, { type: OBSTACLE_BARRICADE, lane: 2 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 7 }, { type: ZOMBIE_RUNNER, count: 5 }, { type: ZOMBIE_TANK, count: 1 }], obstacles: [{ type: OBSTACLE_CAR, lane: 1 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 8 }, { type: ZOMBIE_RUNNER, count: 6 }, { type: ZOMBIE_TANK, count: 2 }], obstacles: [{ type: OBSTACLE_BARRICADE, lane: 1 }, { type: OBSTACLE_CAR, lane: 2 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 10 }, { type: ZOMBIE_RUNNER, count: 7 }, { type: ZOMBIE_TANK, count: 2 }], obstacles: [] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 8 }, { type: ZOMBIE_RUNNER, count: 8 }, { type: ZOMBIE_TANK, count: 3 }], obstacles: [{ type: OBSTACLE_CAR, lane: 0 }] }
    ],
    rewards: { gold: 200, supplies: 75 }
  },
  {
    level: 4,
    name: "Outbreak Swarm",
    waves: [
      { zombies: [{ type: ZOMBIE_WALKER, count: 10 }, { type: ZOMBIE_RUNNER, count: 8 }, { type: ZOMBIE_TANK, count: 2 }], obstacles: [{ type: OBSTACLE_BARRICADE, lane: 0 }, { type: OBSTACLE_CAR, lane: 1 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 12 }, { type: ZOMBIE_RUNNER, count: 10 }, { type: ZOMBIE_TANK, count: 3 }], obstacles: [{ type: OBSTACLE_CAR, lane: 2 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 15 }, { type: ZOMBIE_RUNNER, count: 12 }, { type: ZOMBIE_TANK, count: 3 }], obstacles: [{ type: OBSTACLE_BARRICADE, lane: 1 }, { type: OBSTACLE_CAR, lane: 0 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 12 }, { type: ZOMBIE_RUNNER, count: 15 }, { type: ZOMBIE_TANK, count: 4 }], obstacles: [{ type: OBSTACLE_BARRICADE, lane: 0 }, { type: OBSTACLE_BARRICADE, lane: 2 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 18 }, { type: ZOMBIE_RUNNER, count: 15 }, { type: ZOMBIE_TANK, count: 5 }], obstacles: [] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 15 }, { type: ZOMBIE_RUNNER, count: 18 }, { type: ZOMBIE_TANK, count: 5 }], obstacles: [{ type: OBSTACLE_CAR, lane: 1 }] }
    ],
    rewards: { gold: 300, supplies: 100 }
  },
  {
    level: 5,
    name: "Last Stand",
    waves: [
      { zombies: [{ type: ZOMBIE_WALKER, count: 15 }, { type: ZOMBIE_RUNNER, count: 12 }, { type: ZOMBIE_TANK, count: 4 }], obstacles: [{ type: OBSTACLE_BARRICADE, lane: 0 }, { type: OBSTACLE_CAR, lane: 1 }, { type: OBSTACLE_BARRICADE, lane: 2 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 18 }, { type: ZOMBIE_RUNNER, count: 15 }, { type: ZOMBIE_TANK, count: 5 }], obstacles: [{ type: OBSTACLE_CAR, lane: 0 }, { type: OBSTACLE_CAR, lane: 2 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 20 }, { type: ZOMBIE_RUNNER, count: 18 }, { type: ZOMBIE_TANK, count: 6 }], obstacles: [{ type: OBSTACLE_BARRICADE, lane: 1 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 22 }, { type: ZOMBIE_RUNNER, count: 20 }, { type: ZOMBIE_TANK, count: 7 }], obstacles: [{ type: OBSTACLE_CAR, lane: 0 }, { type: OBSTACLE_BARRICADE, lane: 1 }, { type: OBSTACLE_CAR, lane: 2 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 25 }, { type: ZOMBIE_RUNNER, count: 22 }, { type: ZOMBIE_TANK, count: 8 }], obstacles: [] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 20 }, { type: ZOMBIE_RUNNER, count: 20 }, { type: ZOMBIE_TANK, count: 6 }], obstacles: [{ type: OBSTACLE_BARRICADE, lane: 0 }, { type: OBSTACLE_BARRICADE, lane: 2 }] },
      { zombies: [{ type: ZOMBIE_WALKER, count: 15 }, { type: ZOMBIE_RUNNER, count: 15 }, { type: ZOMBIE_TANK, count: 10 }, { type: ZOMBIE_BOSS, count: 1 }], obstacles: [{ type: OBSTACLE_CAR, lane: 1 }] }
    ],
    rewards: { gold: 500, supplies: 150 }
  }
];

export const STRUCTURE_UPGRADE_COST = {
  resourceGenerator: [0, 100, 200, 400, 800],
  trainingFacility: [0, 150, 300, 600, 1200],
  commandCenter: [0, 200, 400, 800, 1600]
};

export const STRUCTURE_BENEFITS = {
  resourceGenerator: {
    goldPerSecond: [0, 5, 10, 20, 40, 80],
    suppliesPerSecond: [0, 2, 4, 8, 16, 32]
  },
  trainingFacility: {
    description: ["Locked", "Unlock Engineer", "Hero damage +10%", "Hero HP +20%", "Hero skill cooldown -20%", "All heroes maxed"]
  },
  commandCenter: {
    baseHP: [0, 100, 120, 150, 200, 300]
  }
};