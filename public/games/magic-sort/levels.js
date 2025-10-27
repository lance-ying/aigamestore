// levels.js - Level configurations

import { COLORS } from './globals.js';

export const LEVELS = [
  {
    level: 1,
    name: "The First Pour",
    bottleCount: 3,
    capacity: 4,
    colors: ["RED", "GREEN"],
    maxMoves: 10,
    maxTime: 120,
    bottles: [
      ["RED", "RED", "GREEN", "GREEN"],
      ["GREEN", "GREEN", "RED", "RED"],
      []
    ]
  },
  {
    level: 2,
    name: "Color Blend",
    bottleCount: 4,
    capacity: 4,
    colors: ["RED", "GREEN", "BLUE"],
    maxMoves: 15,
    maxTime: 180,
    bottles: [
      ["RED", "GREEN", "BLUE", "RED"],
      ["BLUE", "RED", "GREEN", "BLUE"],
      ["GREEN", "BLUE", "RED", "GREEN"],
      []
    ]
  },
  {
    level: 3,
    name: "Strategic Shifts",
    bottleCount: 5,
    capacity: 4,
    colors: ["RED", "GREEN", "BLUE"],
    maxMoves: 20,
    maxTime: 240,
    bottles: [
      ["RED", "GREEN", "BLUE", "RED"],
      ["BLUE", "RED", "GREEN", "BLUE"],
      ["GREEN", "BLUE", "RED", "GREEN"],
      ["RED", "GREEN", "BLUE", "RED"],
      []
    ]
  },
  {
    level: 4,
    name: "Expanding Palette",
    bottleCount: 6,
    capacity: 4,
    colors: ["RED", "GREEN", "BLUE", "YELLOW"],
    maxMoves: 25,
    maxTime: 300,
    bottles: [
      ["RED", "YELLOW", "BLUE", "GREEN"],
      ["BLUE", "RED", "GREEN", "YELLOW"],
      ["GREEN", "BLUE", "YELLOW", "RED"],
      ["YELLOW", "GREEN", "RED", "BLUE"],
      [],
      []
    ]
  },
  {
    level: 5,
    name: "Bottleneck Blues",
    bottleCount: 7,
    capacity: 4,
    colors: ["RED", "GREEN", "BLUE", "YELLOW"],
    maxMoves: 30,
    maxTime: 360,
    bottles: [
      ["RED", "YELLOW", "BLUE", "GREEN"],
      ["BLUE", "RED", "GREEN", "YELLOW"],
      ["GREEN", "BLUE", "YELLOW", "RED"],
      ["YELLOW", "GREEN", "RED", "BLUE"],
      ["RED", "BLUE", "YELLOW", "GREEN"],
      [],
      []
    ]
  }
];

export function getLevelConfig(levelNumber) {
  if (levelNumber < 1 || levelNumber > LEVELS.length) {
    return null;
  }
  return LEVELS[levelNumber - 1];
}