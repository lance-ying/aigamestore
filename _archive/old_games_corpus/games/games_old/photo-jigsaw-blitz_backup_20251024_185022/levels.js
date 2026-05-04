// levels.js - Level definitions and management

export const LEVELS = [
  {
    level: 1,
    name: "First Connection",
    gridCols: 3,
    gridRows: 2,
    timeLimit: 180,
    rotationEnabled: false,
    description: "Simple 6-piece puzzle"
  },
  {
    level: 2,
    name: "Fragmented Fables",
    gridCols: 4,
    gridRows: 3,
    timeLimit: 240,
    rotationEnabled: true,
    description: "12 pieces with rotation"
  },
  {
    level: 3,
    name: "Intricate Mosaics",
    gridCols: 5,
    gridRows: 4,
    timeLimit: 300,
    rotationEnabled: true,
    description: "20 pieces challenge"
  },
  {
    level: 4,
    name: "Masterpiece Blitz",
    gridCols: 6,
    gridRows: 5,
    timeLimit: 360,
    rotationEnabled: true,
    description: "Ultimate 30-piece test"
  }
];

export function getLevelData(levelNumber) {
  return LEVELS[levelNumber - 1] || LEVELS[0];
}

export function getTotalLevels() {
  return LEVELS.length;
}