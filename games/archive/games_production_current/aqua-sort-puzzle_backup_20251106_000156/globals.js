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
  levelScore: 0,
  levelMovesMade: 0,
  levelMaxMoves: 0,
  levelUndoCount: 0,
  tubesCompleted: new Set(), // Track completed tubes for partial scoring
  
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

// Level configurations - Made first few levels easier
export const LEVELS = [
  {
    level: 1,
    maxMoves: 6,
    tubes: [
      { capacity: 4, colors: ['red', 'red', 'red', 'red'] }, // Already sorted red
      { capacity: 4, colors: ['blue', 'blue', 'red', 'red'] }, // Easy separation
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 2,
    maxMoves: 8,
    tubes: [
      { capacity: 4, colors: ['red', 'red', 'red', 'blue'] },
      { capacity: 4, colors: ['blue', 'blue', 'blue', 'red'] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 3,
    maxMoves: 12,
    tubes: [
      { capacity: 4, colors: ['red', 'blue', 'red', 'red'] },
      { capacity: 4, colors: ['blue', 'green', 'blue', 'blue'] },
      { capacity: 4, colors: ['green', 'red', 'green', 'green'] },
      { capacity: 4, colors: [] }
    ]
  },
  {
    level: 4,
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
  }
];

export const COLOR_MAP = {
  'red': [220, 50, 50],
  'blue': [50, 120, 220],
  'green': [50, 200, 80],
  'yellow': [240, 200, 30],
  'purple': [180, 60, 200],
  'orange': [255, 140, 30],
  'pink': [255, 120, 180]
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}