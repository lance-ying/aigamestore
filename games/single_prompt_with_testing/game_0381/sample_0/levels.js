import { MATERIAL_TYPES } from './globals.js';

export const LEVELS = [
  {
    number: 1,
    name: "Basic Assembly",
    description: "Connect spawner to goal",
    requiredProducts: 3,
    spawners: [{x: 1, y: 4}],
    goals: [{x: 13, y: 4, type: MATERIAL_TYPES.RAW}],
    prebuiltComponents: []
  },
  {
    number: 2,
    name: "First Processing",
    description: "Process raw materials",
    requiredProducts: 4,
    spawners: [{x: 1, y: 4}],
    goals: [{x: 13, y: 4, type: MATERIAL_TYPES.PROCESSED}],
    prebuiltComponents: []
  },
  {
    number: 3,
    name: "Dual Stage",
    description: "Refine materials twice",
    requiredProducts: 3,
    spawners: [{x: 1, y: 2}, {x: 1, y: 7}],
    goals: [{x: 13, y: 4, type: MATERIAL_TYPES.REFINED}],
    prebuiltComponents: []
  },
  {
    number: 4,
    name: "Complex Factory",
    description: "Handle multiple streams",
    requiredProducts: 5,
    spawners: [{x: 1, y: 1}, {x: 1, y: 5}, {x: 1, y: 8}],
    goals: [
      {x: 13, y: 2, type: MATERIAL_TYPES.PROCESSED},
      {x: 13, y: 7, type: MATERIAL_TYPES.REFINED}
    ],
    prebuiltComponents: []
  }
];

export function getCurrentLevel(levelNumber) {
  return LEVELS[Math.min(levelNumber - 1, LEVELS.length - 1)];
}