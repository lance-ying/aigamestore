// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER_WIN: 'GAME_OVER_WIN',
  GAME_OVER_LOSE: 'GAME_OVER_LOSE'
};

export const GAME_STATES = {
  MENU: 'MENU',
  INSTRUCTIONS: 'INSTRUCTIONS',
  HIGH_SCORES: 'HIGH_SCORES',
  ANIMAL_SELECT: 'ANIMAL_SELECT',
  MINIGAME_INTRO: 'MINIGAME_INTRO',
  MINIGAME_PLAYING: 'MINIGAME_PLAYING',
  MINIGAME_COMPLETE: 'MINIGAME_COMPLETE',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  GAME_WIN: 'GAME_WIN',
  GAME_OVER: 'GAME_OVER'
};

export const MINIGAME_TYPES = {
  SHAVING: 'SHAVING',
  SHOWERING: 'SHOWERING',
  MAZE: 'MAZE',
  FEEDING: 'FEEDING'
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  currentState: GAME_STATES.MENU,
  controlMode: 'HUMAN',
  score: 0,
  currentLevel: 1,
  animals: [],
  selectedAnimal: null,
  selectedMinigame: null,
  miniGameData: null,
  miniGamesCompletedThisLevel: 0,
  failedMiniGamesCount: 0,
  highScores: [],
  menuSelection: 0,
  animalSelection: 0,
  minigameSelection: 0,
  player: null,
  entities: []
};

// Level configuration
export const LEVEL_CONFIG = [
  {
    level: 1,
    requiredCompletions: 3,
    happinessThreshold: 0,
    animals: ['ALPACA'],
    minigames: {
      ALPACA: [MINIGAME_TYPES.SHAVING]
    }
  },
  {
    level: 2,
    requiredCompletions: 4,
    happinessThreshold: 50,
    animals: ['ALPACA', 'ELEPHANT'],
    minigames: {
      ALPACA: [MINIGAME_TYPES.SHAVING],
      ELEPHANT: [MINIGAME_TYPES.SHOWERING, MINIGAME_TYPES.MAZE]
    }
  },
  {
    level: 3,
    requiredCompletions: 6,
    happinessThreshold: 60,
    animals: ['ALPACA', 'ELEPHANT', 'GIRAFFE'],
    minigames: {
      ALPACA: [MINIGAME_TYPES.SHAVING],
      ELEPHANT: [MINIGAME_TYPES.SHOWERING, MINIGAME_TYPES.MAZE],
      GIRAFFE: [MINIGAME_TYPES.FEEDING]
    }
  },
  {
    level: 4,
    requiredCompletions: 8,
    happinessThreshold: 70,
    animals: ['ALPACA', 'ELEPHANT', 'GIRAFFE'],
    minigames: {
      ALPACA: [MINIGAME_TYPES.SHAVING],
      ELEPHANT: [MINIGAME_TYPES.SHOWERING, MINIGAME_TYPES.MAZE],
      GIRAFFE: [MINIGAME_TYPES.FEEDING]
    }
  },
  {
    level: 5,
    requiredCompletions: 10,
    happinessThreshold: 80,
    animals: ['ALPACA', 'ELEPHANT', 'GIRAFFE'],
    minigames: {
      ALPACA: [MINIGAME_TYPES.SHAVING],
      ELEPHANT: [MINIGAME_TYPES.SHOWERING, MINIGAME_TYPES.MAZE],
      GIRAFFE: [MINIGAME_TYPES.FEEDING]
    }
  }
];