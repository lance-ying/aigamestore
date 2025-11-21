// levelConfig.js - Level configurations

export const LEVEL_CONFIGS = [
  {
    level: 1,
    name: "Novice Noodle",
    crownsRequired: 2,
    difficulty: "easy",
    timeLimit: 15,
    startingLives: 4,
    powerups: { skip: 1, removeTwoWrong: 1 }
  },
  {
    level: 2,
    name: "Brain Builder",
    crownsRequired: 3,
    difficulty: "easy",
    timeLimit: 12,
    startingLives: 3,
    powerups: { skip: 1, removeTwoWrong: 1 }
  },
  {
    level: 3,
    name: "Category Conqueror",
    crownsRequired: 4,
    difficulty: "medium",
    timeLimit: 10,
    startingLives: 3,
    powerups: { skip: 0, removeTwoWrong: 1 }
  },
  {
    level: 4,
    name: "Master Mind",
    crownsRequired: 5,
    difficulty: "medium",
    timeLimit: 8,
    startingLives: 2,
    powerups: { skip: 0, removeTwoWrong: 0 }
  },
  {
    level: 5,
    name: "Trivia Titan",
    crownsRequired: 6,
    difficulty: "hard",
    timeLimit: 7,
    startingLives: 2,
    powerups: { skip: 0, removeTwoWrong: 0 }
  }
];

export function getLevelConfig(level) {
  return LEVEL_CONFIGS[level - 1] || LEVEL_CONFIGS[0];
}