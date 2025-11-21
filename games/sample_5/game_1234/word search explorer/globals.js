export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  currentLevel: 1,
  gridLetters: [],
  targetWords: [],
  foundWords: [],
  selectedCells: [],
  availableHints: 0,
  levelStartTime: 0,
  currentSelection: "",
  hoveredCell: null,
  levelComplete: false,
  totalLevels: 3,
  tempHighlightCells: [],
  lastHintTime: 0
};

export const LEVELS = [
  {
    level: 1,
    name: "The Oasis",
    gridSize: 8,
    words: ["SAND", "CACTUS", "HEAT", "DUNE", "CAMEL"],
    hints: 3,
    theme: { bg: [255, 235, 205], accent: [210, 180, 140] }
  },
  {
    level: 2,
    name: "Mountain Vista",
    gridSize: 10,
    words: ["PEAK", "CLIMB", "SNOW", "RIDGE", "SUMMIT", "ROCK", "TRAIL", "VIEW"],
    hints: 2,
    theme: { bg: [200, 220, 240], accent: [150, 170, 190] }
  },
  {
    level: 3,
    name: "Ocean Breeze",
    gridSize: 12,
    words: ["WAVE", "CORAL", "SHARK", "BEACH", "SALT", "TIDE", "SEAGULL", "SHELL", "DRIFT", "WATER", "DEPTH", "REEF"],
    hints: 1,
    theme: { bg: [180, 220, 235], accent: [100, 160, 200] }
  }
];

export function getGameState() {
  return gameState;
}

// Expose to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}