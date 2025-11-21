// globals.js - Global state and constants

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
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Level and score
  currentLevel: 1,
  totalScore: 0,
  levelMovesMade: 0,
  levelMaxMoves: 0,
  levelUndoCount: 0,
  
  // Tubes
  tubes: [],
  selectedTubeIndex: -1,
  highlightedTubeIndex: 0,
  
  // Undo system
  previousStates: [],
  
  // Animation
  isAnimating: false,
  animationProgress: 0,
  animationDuration: 30, // frames
  animationSourceIndex: -1,
  animationDestIndex: -1,
  animationWaterColor: null,
  animationWaterAmount: 0,
  
  // Player (for logging purposes)
  player: {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2
  }
};

// Level configurations
export const LEVELS = [
  {
    level: 1,
    maxMoves: 10,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'green', 'red'] },
      { capacity: 4, colors: ['blue', 'green', 'red', 'blue'] },
      { capacity: 4, colors: ['green', 'red', 'blue', 'green'] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 2,
    maxMoves: 15,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'yellow', 'red'] },
      { capacity: 4, colors: ['blue', 'green', 'red', 'blue'] },
      { capacity: 4, colors: ['green', 'yellow', 'blue', 'green'] },
      { capacity: 4, colors: ['yellow', 'red', 'green', 'yellow'] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 3,
    maxMoves: 25,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'yellow', 'purple'] },
      { capacity: 4, colors: ['blue', 'green', 'red', 'blue'] },
      { capacity: 3, colors: ['green', 'yellow', 'purple'] },
      { capacity: 4, colors: ['yellow', 'red', 'green', 'purple'] },
      { capacity: 4, colors: ['purple', 'red', 'green', 'yellow'] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 4,
    maxMoves: 35,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'yellow', 'purple'] },
      { capacity: 3, colors: ['blue', 'green', 'red'] },
      { capacity: 3, colors: ['green', 'yellow', 'purple'] },
      { capacity: 4, colors: ['yellow', 'red', 'green', 'orange'] },
      { capacity: 4, colors: ['purple', 'orange', 'green', 'yellow'] },
      { capacity: 4, colors: ['orange', 'blue', 'red', 'blue'] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 5,
    maxMoves: 50,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'yellow', 'purple'] },
      { capacity: 3, colors: ['blue', 'green', 'red'] },
      { capacity: 2, colors: ['green', 'yellow'] },
      { capacity: 4, colors: ['yellow', 'red', 'green', 'orange'] },
      { capacity: 4, colors: ['purple', 'orange', 'green', 'pink'] },
      { capacity: 3, colors: ['orange', 'blue', 'pink'] },
      { capacity: 4, colors: ['pink', 'red', 'yellow', 'blue'] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 6,
    maxMoves: 45,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'yellow', 'purple'] },
      { capacity: 4, colors: ['blue', 'green', 'red', 'orange'] },
      { capacity: 4, colors: ['green', 'yellow', 'purple', 'pink'] },
      { capacity: 4, colors: ['yellow', 'red', 'green', 'orange'] },
      { capacity: 4, colors: ['purple', 'orange', 'pink', 'blue'] },
      { capacity: 4, colors: ['pink', 'red', 'blue', 'green'] },
      { capacity: 4, colors: ['orange', 'yellow', 'purple', 'pink'] },
      { capacity: 4, colors: [] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 7,
    maxMoves: 55,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'yellow', 'purple'] },
      { capacity: 4, colors: ['blue', 'green', 'red', 'orange'] },
      { capacity: 3, colors: ['green', 'yellow', 'purple'] },
      { capacity: 4, colors: ['yellow', 'cyan', 'green', 'orange'] },
      { capacity: 4, colors: ['purple', 'orange', 'pink', 'cyan'] },
      { capacity: 3, colors: ['pink', 'red', 'blue'] },
      { capacity: 4, colors: ['orange', 'cyan', 'purple', 'pink'] },
      { capacity: 4, colors: ['cyan', 'yellow', 'blue', 'green'] },
      { capacity: 4, colors: ['pink', 'red', 'green', 'blue'] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 8,
    maxMoves: 60,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'yellow', 'purple'] },
      { capacity: 3, colors: ['blue', 'green', 'red'] },
      { capacity: 4, colors: ['green', 'yellow', 'cyan', 'purple'] },
      { capacity: 4, colors: ['yellow', 'cyan', 'green', 'orange'] },
      { capacity: 3, colors: ['purple', 'orange', 'pink'] },
      { capacity: 4, colors: ['pink', 'red', 'cyan', 'blue'] },
      { capacity: 4, colors: ['orange', 'cyan', 'purple', 'pink'] },
      { capacity: 4, colors: ['cyan', 'yellow', 'blue', 'orange'] },
      { capacity: 4, colors: ['pink', 'red', 'green', 'blue'] },
      { capacity: 3, colors: ['orange', 'green', 'red'] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 9,
    maxMoves: 65,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'yellow', 'purple'] },
      { capacity: 4, colors: ['blue', 'green', 'red', 'orange'] },
      { capacity: 4, colors: ['green', 'yellow', 'cyan', 'purple'] },
      { capacity: 3, colors: ['yellow', 'cyan', 'green'] },
      { capacity: 4, colors: ['purple', 'orange', 'pink', 'cyan'] },
      { capacity: 3, colors: ['pink', 'red', 'blue'] },
      { capacity: 4, colors: ['orange', 'cyan', 'purple', 'pink'] },
      { capacity: 4, colors: ['cyan', 'yellow', 'blue', 'orange'] },
      { capacity: 3, colors: ['pink', 'red', 'green'] },
      { capacity: 4, colors: ['orange', 'green', 'blue', 'red'] },
      { capacity: 4, colors: [] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 10,
    maxMoves: 70,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'yellow', 'purple'] },
      { capacity: 4, colors: ['blue', 'green', 'red', 'orange'] },
      { capacity: 4, colors: ['green', 'yellow', 'cyan', 'purple'] },
      { capacity: 4, colors: ['yellow', 'cyan', 'green', 'orange'] },
      { capacity: 3, colors: ['purple', 'orange', 'pink'] },
      { capacity: 4, colors: ['pink', 'red', 'cyan', 'blue'] },
      { capacity: 3, colors: ['orange', 'cyan', 'purple'] },
      { capacity: 4, colors: ['cyan', 'yellow', 'blue', 'pink'] },
      { capacity: 3, colors: ['pink', 'red', 'green'] },
      { capacity: 4, colors: ['orange', 'green', 'blue', 'red'] },
      { capacity: 4, colors: ['purple', 'yellow', 'green', 'blue'] },
      { capacity: 4, colors: [] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 11,
    maxMoves: 75,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'yellow', 'purple'] },
      { capacity: 3, colors: ['blue', 'green', 'red'] },
      { capacity: 4, colors: ['green', 'yellow', 'cyan', 'purple'] },
      { capacity: 4, colors: ['yellow', 'cyan', 'green', 'orange'] },
      { capacity: 4, colors: ['purple', 'orange', 'pink', 'cyan'] },
      { capacity: 3, colors: ['pink', 'red', 'blue'] },
      { capacity: 4, colors: ['orange', 'cyan', 'purple', 'pink'] },
      { capacity: 3, colors: ['cyan', 'yellow', 'blue'] },
      { capacity: 4, colors: ['pink', 'red', 'green', 'orange'] },
      { capacity: 4, colors: ['orange', 'green', 'blue', 'red'] },
      { capacity: 3, colors: ['purple', 'yellow', 'green'] },
      { capacity: 4, colors: ['blue', 'pink', 'cyan', 'red'] },
      { capacity: 4, colors: [] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 12,
    maxMoves: 80,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'yellow', 'purple'] },
      { capacity: 4, colors: ['blue', 'green', 'red', 'orange'] },
      { capacity: 3, colors: ['green', 'yellow', 'cyan'] },
      { capacity: 4, colors: ['yellow', 'cyan', 'green', 'orange'] },
      { capacity: 4, colors: ['purple', 'orange', 'pink', 'cyan'] },
      { capacity: 3, colors: ['pink', 'red', 'blue'] },
      { capacity: 4, colors: ['orange', 'cyan', 'purple', 'pink'] },
      { capacity: 4, colors: ['cyan', 'yellow', 'blue', 'pink'] },
      { capacity: 3, colors: ['pink', 'red', 'green'] },
      { capacity: 4, colors: ['orange', 'green', 'blue', 'red'] },
      { capacity: 4, colors: ['purple', 'yellow', 'green', 'blue'] },
      { capacity: 3, colors: ['purple', 'orange', 'cyan'] },
      { capacity: 4, colors: [] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 13,
    maxMoves: 85,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'yellow', 'purple'] },
      { capacity: 4, colors: ['blue', 'green', 'red', 'orange'] },
      { capacity: 4, colors: ['green', 'yellow', 'cyan', 'purple'] },
      { capacity: 3, colors: ['yellow', 'cyan', 'green'] },
      { capacity: 4, colors: ['purple', 'orange', 'pink', 'cyan'] },
      { capacity: 4, colors: ['pink', 'red', 'blue', 'orange'] },
      { capacity: 3, colors: ['orange', 'cyan', 'purple'] },
      { capacity: 4, colors: ['cyan', 'yellow', 'blue', 'pink'] },
      { capacity: 4, colors: ['pink', 'red', 'green', 'orange'] },
      { capacity: 3, colors: ['orange', 'green', 'blue'] },
      { capacity: 4, colors: ['purple', 'yellow', 'green', 'blue'] },
      { capacity: 4, colors: ['blue', 'pink', 'cyan', 'red'] },
      { capacity: 3, colors: ['green', 'red', 'yellow'] },
      { capacity: 4, colors: [] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 14,
    maxMoves: 90,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'yellow', 'purple'] },
      { capacity: 4, colors: ['blue', 'green', 'red', 'orange'] },
      { capacity: 4, colors: ['green', 'yellow', 'cyan', 'purple'] },
      { capacity: 4, colors: ['yellow', 'cyan', 'green', 'orange'] },
      { capacity: 3, colors: ['purple', 'orange', 'pink'] },
      { capacity: 4, colors: ['pink', 'red', 'cyan', 'blue'] },
      { capacity: 4, colors: ['orange', 'cyan', 'purple', 'pink'] },
      { capacity: 3, colors: ['cyan', 'yellow', 'blue'] },
      { capacity: 4, colors: ['pink', 'red', 'green', 'orange'] },
      { capacity: 4, colors: ['orange', 'green', 'blue', 'red'] },
      { capacity: 4, colors: ['purple', 'yellow', 'green', 'blue'] },
      { capacity: 3, colors: ['blue', 'pink', 'cyan'] },
      { capacity: 4, colors: ['red', 'green', 'yellow', 'purple'] },
      { capacity: 3, colors: ['pink', 'cyan', 'orange'] },
      { capacity: 4, colors: [] },
      { capacity: 4, colors: [] }
    ]
  }
];

export const COLOR_MAP = {
  'red': [220, 50, 50],
  'blue': [50, 120, 220],
  'green': [50, 200, 80],
  'yellow': [240, 200, 30],
  'purple': [180, 60, 200],
  'orange': [255, 140, 30],
  'pink': [255, 120, 180],
  'cyan': [50, 200, 220]
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}