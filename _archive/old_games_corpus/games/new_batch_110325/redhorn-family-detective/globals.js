// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  
  // Game-specific state
  currentChapter: 1,
  currentLocation: "TOWN_SQUARE",
  inventory: [], // Array of clue objects
  deductions: [], // Array of completed deductions
  dialogueHistory: {}, // Track which dialogues have been seen
  interactedObjects: [], // Track which objects have been examined
  
  // UI state
  showingDialogue: false,
  currentDialogue: null,
  dialogueIndex: 0,
  showInventory: false,
  menuSelection: 0,
  
  // Location unlocks
  unlockedLocations: ["TOWN_SQUARE"],
  
  // Suspect states
  suspects: {
    "MAYOR": { interviewed: false, suspicious: 0 },
    "DOCTOR": { interviewed: false, suspicious: 0 },
    "MERCHANT": { interviewed: false, suspicious: 0 },
    "BUTLER": { interviewed: false, suspicious: 0 }
  },
  
  // Chapter objectives
  chapterObjectives: {
    1: { completed: false, required: ["CLUE_BODY", "CLUE_TIME", "CLUE_WEAPON"] },
    2: { completed: false, required: ["CLUE_MOTIVE", "CLUE_ALIBI", "CLUE_WITNESS"] },
    3: { completed: false, required: ["CLUE_EVIDENCE", "CLUE_CONNECTION"] }
  },
  
  // Win condition
  killerIdentified: false,
  finalDeductionMade: false
};

// Constants for game elements
export const LOCATIONS = {
  TOWN_SQUARE: { name: "Town Square", x: 300, y: 200 },
  MANOR: { name: "Redhorn Manor", x: 300, y: 200 },
  MARKET: { name: "Market District", x: 300, y: 200 },
  CHURCH: { name: "Old Church", x: 300, y: 200 },
  DOCKS: { name: "Harbor Docks", x: 300, y: 200 }
};

export const CLUE_TYPES = {
  CLUE_BODY: { name: "Crime Scene Report", chapter: 1 },
  CLUE_TIME: { name: "Time of Death", chapter: 1 },
  CLUE_WEAPON: { name: "Murder Weapon", chapter: 1 },
  CLUE_MOTIVE: { name: "Financial Records", chapter: 2 },
  CLUE_ALIBI: { name: "Alibi Statement", chapter: 2 },
  CLUE_WITNESS: { name: "Witness Account", chapter: 2 },
  CLUE_EVIDENCE: { name: "Physical Evidence", chapter: 3 },
  CLUE_CONNECTION: { name: "Family Connection", chapter: 3 }
};

export const DEDUCTION_PUZZLES = [
  {
    id: "DEDUCTION_1",
    name: "Time of Murder",
    requiredClues: ["CLUE_BODY", "CLUE_TIME"],
    chapter: 1,
    unlocks: "MANOR"
  },
  {
    id: "DEDUCTION_2",
    name: "Weapon Origin",
    requiredClues: ["CLUE_WEAPON", "CLUE_TIME"],
    chapter: 1,
    unlocks: "MARKET"
  },
  {
    id: "DEDUCTION_3",
    name: "Financial Motive",
    requiredClues: ["CLUE_MOTIVE", "CLUE_ALIBI", "CLUE_WEAPON"],
    chapter: 2,
    unlocks: "CHURCH"
  },
  {
    id: "DEDUCTION_4",
    name: "True Culprit",
    requiredClues: ["CLUE_EVIDENCE", "CLUE_CONNECTION", "CLUE_MOTIVE"],
    chapter: 3,
    unlocks: "WIN"
  }
];

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}