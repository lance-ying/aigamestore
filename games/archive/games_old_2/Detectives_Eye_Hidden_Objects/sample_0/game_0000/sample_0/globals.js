export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null, // Not used in this game but required by spec
  entities: [], // Not used in this game but required by spec
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED", "LEVEL_COMPLETE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2"
  
  // Game-specific state
  currentLevelIndex: 0,
  levelTimer: 0,
  objectsToFind: [],
  foundObjects: [],
  remainingHints: 0,
  currentZoomLevel: 1.0,
  panOffsetX: 0,
  panOffsetY: 0,
  highScore: 0,
  totalScore: 0,
  levelScore: 0,
  incorrectClickFeedback: null, // {x, y, frameCount}
  hintFeedback: null, // {x, y, frameCount, objectName}
  
  // Test automation
  testTimer: 0,
  testObjectIndex: 0,
  testPhase: "IDLE" // "IDLE", "FINDING_OBJECTS", "WAITING_LEVEL_COMPLETE", "GOING_NEXT"
};

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE",
  PAUSED: "PAUSED",
  LEVEL_COMPLETE: "LEVEL_COMPLETE"
};

// Level data structure
export const LEVELS = [
  {
    name: "The Grand Study",
    timeLimit: 120,
    hints: 3,
    incorrectPenalty: 5,
    maxZoom: 1.5,
    objects: [
      { name: "Book", x: 150, y: 180, radius: 15 },
      { name: "Quill", x: 320, y: 140, radius: 12 },
      { name: "Candle", x: 480, y: 120, radius: 14 },
      { name: "Globe", x: 100, y: 250, radius: 18 },
      { name: "Scroll", x: 400, y: 280, radius: 13 },
      { name: "Inkwell", x: 250, y: 160, radius: 11 },
      { name: "Compass", x: 520, y: 300, radius: 10 },
      { name: "Key", x: 180, y: 320, radius: 9 }
    ]
  },
  {
    name: "The Conservatory",
    timeLimit: 100,
    hints: 2,
    incorrectPenalty: 10,
    maxZoom: 2.0,
    objects: [
      { name: "Watering Can", x: 130, y: 160, radius: 14 },
      { name: "Butterfly", x: 420, y: 100, radius: 8 },
      { name: "Trowel", x: 280, y: 290, radius: 11 },
      { name: "Pot", x: 500, y: 240, radius: 16 },
      { name: "Seed Packet", x: 90, y: 310, radius: 9 },
      { name: "Flower", x: 350, y: 180, radius: 10 },
      { name: "Pruning Shears", x: 470, y: 140, radius: 12 },
      { name: "Basket", x: 200, y: 250, radius: 15 },
      { name: "Gloves", x: 380, y: 330, radius: 11 },
      { name: "Mushroom", x: 150, y: 220, radius: 8 },
      { name: "Snail", x: 320, y: 340, radius: 7 },
      { name: "Bird Nest", x: 540, y: 90, radius: 13 }
    ]
  },
  {
    name: "The Forgotten Attic",
    timeLimit: 90,
    hints: 1,
    incorrectPenalty: 10,
    maxZoom: 2.5,
    objects: [
      { name: "Lamp", x: 140, y: 130, radius: 13 },
      { name: "Hat", x: 290, y: 110, radius: 14 },
      { name: "Trunk", x: 480, y: 200, radius: 18 },
      { name: "Doll", x: 120, y: 260, radius: 11 },
      { name: "Clock", x: 380, y: 160, radius: 15 },
      { name: "Portrait", x: 520, y: 120, radius: 16 },
      { name: "Violin", x: 200, y: 320, radius: 12 },
      { name: "Camera", x: 340, y: 280, radius: 10 },
      { name: "Typewriter", x: 100, y: 180, radius: 17 },
      { name: "Teacup", x: 450, y: 310, radius: 9 },
      { name: "Spectacles", x: 260, y: 240, radius: 8 },
      { name: "Pocket Watch", x: 410, y: 340, radius: 7 },
      { name: "Brooch", x: 170, y: 200, radius: 6 },
      { name: "Locket", x: 310, y: 190, radius: 6 },
      { name: "Magnifying Glass", x: 550, y: 280, radius: 11 }
    ]
  }
];

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}