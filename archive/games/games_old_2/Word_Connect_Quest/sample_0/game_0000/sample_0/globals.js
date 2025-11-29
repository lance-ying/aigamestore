// globals.js - Global state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  currentLevelIndex: 0,
  levelStartTime: 0,
  highScore: 0,
  currentWord: [],
  selectedLetters: [],
  feedbackMessage: "",
  feedbackTimer: 0,
  hoveredLetterIndex: -1,
  keyboardSelectedIndex: -1
};

// Level data structure
export const levelData = [
  {
    name: "Word Wanderer's Start",
    letters: ["A", "E", "R", "T", "S"],
    targetTime: 120,
    words: [
      { word: "RAT", startX: 1, startY: 0, horizontal: true, found: false },
      { word: "ART", startX: 1, startY: 1, horizontal: true, found: false },
      { word: "STAR", startX: 0, startY: 2, horizontal: true, found: false },
      { word: "TEA", startX: 2, startY: 0, horizontal: false, found: false }
    ]
  },
  {
    name: "Desert Discovery",
    letters: ["C", "D", "E", "O", "R", "S"],
    targetTime: 150,
    words: [
      { word: "CODE", startX: 0, startY: 0, horizontal: true, found: false },
      { word: "CORE", startX: 0, startY: 1, horizontal: true, found: false },
      { word: "ROSE", startX: 0, startY: 2, horizontal: true, found: false },
      { word: "RODE", startX: 1, startY: 3, horizontal: true, found: false },
      { word: "ORES", startX: 3, startY: 0, horizontal: false, found: false }
    ]
  },
  {
    name: "Ancient Ascent",
    letters: ["F", "I", "N", "S", "T", "U", "Y"],
    targetTime: 180,
    words: [
      { word: "FUNNY", startX: 0, startY: 0, horizontal: true, found: false },
      { word: "STUN", startX: 0, startY: 1, horizontal: true, found: false },
      { word: "FITS", startX: 0, startY: 2, horizontal: true, found: false },
      { word: "SUIT", startX: 1, startY: 3, horizontal: true, found: false },
      { word: "TINY", startX: 3, startY: 1, horizontal: false, found: false },
      { word: "FUNS", startX: 0, startY: 0, horizontal: false, found: false }
    ]
  }
];

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}