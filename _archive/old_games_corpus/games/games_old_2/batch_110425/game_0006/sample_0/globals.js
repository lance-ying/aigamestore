// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Control modes
export const MODE_HUMAN = "HUMAN";
export const MODE_TEST_1 = "TEST_1";
export const MODE_TEST_2 = "TEST_2";
export const MODE_TEST_3 = "TEST_3";

// Timeline types
export const TIMELINE_PAST = "PAST";
export const TIMELINE_FUTURE = "FUTURE";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;
export const KEY_R = 82;

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  controlMode: MODE_HUMAN,
  currentTimeline: TIMELINE_PAST,
  currentChapter: 1,
  selectedObjectIndex: 0,
  inventory: [],
  puzzleStates: {
    past: {},
    future: {}
  },
  chaptersCompleted: 0,
  score: 0,
  framesSinceLastAction: 0,
  player: {
    screenX: CANVAS_WIDTH / 2,
    screenY: CANVAS_HEIGHT / 2,
    gameX: 0,
    gameY: 0
  },
  entities: []
};

// Puzzle definitions for Chapter 1
export const CHAPTER_1_PUZZLES = {
  past: [
    {
      id: "book",
      name: "Ancient Book",
      x: 150,
      y: 150,
      examined: false,
      collected: false,
      clue: "Symbol: Triangle pointing up"
    },
    {
      id: "box",
      name: "Locked Box",
      x: 400,
      y: 200,
      examined: false,
      unlocked: false,
      requiresItem: "key"
    },
    {
      id: "key",
      name: "Rusty Key",
      x: 250,
      y: 300,
      examined: false,
      collected: false
    }
  ],
  future: [
    {
      id: "console",
      name: "Control Console",
      x: 200,
      y: 180,
      examined: false,
      activated: false,
      requiresCode: "TRIANGLE"
    },
    {
      id: "door",
      name: "Security Door",
      x: 450,
      y: 200,
      examined: false,
      opened: false,
      requiresPower: true
    },
    {
      id: "terminal",
      name: "Data Terminal",
      x: 100,
      y: 250,
      examined: false,
      clue: "Power restored when console activated"
    }
  ]
};

// Puzzle definitions for Chapter 2
export const CHAPTER_2_PUZZLES = {
  past: [
    {
      id: "painting",
      name: "Mysterious Painting",
      x: 180,
      y: 120,
      examined: false,
      clue: "Shows four seasons in sequence"
    },
    {
      id: "dial",
      name: "Stone Dial",
      x: 350,
      y: 180,
      examined: false,
      solved: false,
      requiresSequence: ["spring", "summer", "autumn", "winter"]
    },
    {
      id: "chest",
      name: "Ancient Chest",
      x: 280,
      y: 280,
      examined: false,
      opened: false,
      requiresDialSolved: true
    }
  ],
  future: [
    {
      id: "hologram",
      name: "Holographic Display",
      x: 220,
      y: 150,
      examined: false,
      clue: "Temporal coordinates: Spring->Summer->Autumn->Winter"
    },
    {
      id: "portal",
      name: "Time Portal",
      x: 380,
      y: 220,
      examined: false,
      activated: false,
      requiresChestOpened: true
    },
    {
      id: "scanner",
      name: "Quantum Scanner",
      x: 150,
      y: 300,
      examined: false,
      clue: "Portal activation requires artifact from past"
    }
  ]
};

export function getGameState() {
  return gameState;
}

// Expose globally
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}