export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  LEVEL_COMPLETE: "LEVEL_COMPLETE"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  totalScore: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentLevel: 1,
  differencesFound: 0,
  timeRemaining: 0,
  hintsRemaining: 0,
  differences: [],
  foundMarkers: [],
  hintActive: false,
  hintTimer: 0,
  hintTargetIndex: -1,
  incorrectClickPenalty: 50,
  hintPenalty: 100,
  correctDifferenceReward: 100,
  levelCompleteBonus: 500
};

export const LEVELS = [
  {
    levelNumber: 1,
    name: "Park Day",
    totalDifferences: 5,
    timeLimit: 90,
    hints: 3
  },
  {
    levelNumber: 2,
    name: "Old Bookstore Charm",
    totalDifferences: 7,
    timeLimit: 75,
    hints: 2
  },
  {
    levelNumber: 3,
    name: "Mysterious Forest Path",
    totalDifferences: 10,
    timeLimit: 60,
    hints: 1
  }
];