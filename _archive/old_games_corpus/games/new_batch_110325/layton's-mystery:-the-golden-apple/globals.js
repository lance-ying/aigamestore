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

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Game-specific state
  currentLocation: "village_square",
  previousLocation: null,
  hintCoins: 0,
  solvedPuzzles: new Set(),
  collectedItems: [],
  
  // Puzzle state
  inPuzzle: false,
  currentPuzzle: null,
  puzzleInput: "",
  hintsUsed: 0,
  
  // NPC dialogue state
  inDialogue: false,
  currentDialogue: null,
  dialogueIndex: 0,
  
  // Cursor for interactions
  cursorX: 0,
  cursorY: 0,
  selectedHotspot: null,
  
  // Story progression
  storyFlags: new Set(),
  unlockedLocations: new Set(["village_square"]),
  
  // Mini-games
  trinkets: [],
  furniture: []
};

// Expose gameState globally
window.getGameState = () => gameState;

export const LOCATIONS = {
  village_square: {
    name: "Village Square",
    description: "The heart of the village",
    connections: { right: "mystery_shop", down: "park" },
    hotspots: [
      { x: 300, y: 200, type: "puzzle", id: "fountain_puzzle", label: "Fountain" },
      { x: 150, y: 250, type: "npc", id: "mayor", label: "Mayor" },
      { x: 450, y: 150, type: "hint_coin", id: "coin_1" }
    ]
  },
  mystery_shop: {
    name: "Mystery Shop",
    description: "A curious antique shop",
    connections: { left: "village_square", down: "library" },
    hotspots: [
      { x: 200, y: 180, type: "puzzle", id: "box_puzzle", label: "Box" },
      { x: 400, y: 200, type: "npc", id: "shopkeeper", label: "Shopkeeper" },
      { x: 100, y: 300, type: "hint_coin", id: "coin_2" },
      { x: 500, y: 250, type: "hint_coin", id: "coin_3" }
    ]
  },
  park: {
    name: "Village Park",
    description: "A peaceful garden",
    connections: { up: "village_square", right: "library" },
    hotspots: [
      { x: 250, y: 150, type: "puzzle", id: "statue_puzzle", label: "Statue" },
      { x: 350, y: 280, type: "npc", id: "gardener", label: "Gardener" },
      { x: 450, y: 100, type: "hint_coin", id: "coin_4" }
    ]
  },
  library: {
    name: "Village Library",
    description: "Ancient books line the shelves",
    connections: { up: "mystery_shop", left: "park" },
    hotspots: [
      { x: 300, y: 200, type: "puzzle", id: "book_puzzle", label: "Book" },
      { x: 150, y: 180, type: "npc", id: "librarian", label: "Librarian" },
      { x: 500, y: 300, type: "hint_coin", id: "coin_5" }
    ],
    requiresFlag: "solved_2_puzzles"
  }
};

export const PUZZLES = {
  fountain_puzzle: {
    name: "Fountain Riddle",
    type: "number",
    question: "I am taken from a mine and shut in a wooden case. I am never released but used by most. What am I? (Answer: atomic number)",
    answer: "82", // Lead
    hints: ["Think about common materials", "It's a metal element", "Pencil 'lead' isn't actually lead"],
    mandatory: true,
    reward: { type: "trinket", id: "gear_1" }
  },
  box_puzzle: {
    name: "Antique Box",
    type: "number",
    question: "Three switches control three lights in another room. You can flip switches but only check the room once. How many lights can you identify? (Answer: number)",
    answer: "3",
    hints: ["Heat is a clue", "Turn one on for a while", "One switch on, one switch briefly on then off, one switch never touched"],
    mandatory: true,
    reward: { type: "trinket", id: "gear_2" }
  },
  statue_puzzle: {
    name: "Garden Statue",
    type: "number",
    question: "If you have a 5L jug and a 3L jug, how can you measure exactly 4L? (Answer: steps needed)",
    answer: "6",
    hints: ["Fill the 5L jug first", "Pour 5L into 3L jug", "You need multiple transfers"],
    mandatory: true,
    reward: { type: "furniture", id: "chair_1" }
  },
  book_puzzle: {
    name: "Ancient Tome",
    type: "number",
    question: "The Golden Apple is hidden where the sum of digits equals 9 and the product equals 8. What is this 2-digit number?",
    answer: "18", // 1+8=9, 1*8=8
    hints: ["Two different digits", "Both digits are less than 9", "One digit is 1"],
    mandatory: true,
    reward: { type: "story", flag: "golden_apple_location" }
  }
};

export const NPCS = {
  mayor: {
    name: "Mayor Cole",
    dialogue: [
      "Welcome, Professor! The village needs your help.",
      "Strange puzzles have appeared everywhere...",
      "Please investigate and solve them!"
    ]
  },
  shopkeeper: {
    name: "Rosa",
    dialogue: [
      "This antique box appeared yesterday.",
      "It won't open without solving its riddle!",
      "Can you help, Professor?"
    ]
  },
  gardener: {
    name: "Old Tom",
    dialogue: [
      "The statue's been acting peculiar...",
      "It seems to be asking a question.",
      "Mind taking a look?"
    ]
  },
  librarian: {
    name: "Ms. Pages",
    dialogue: [
      "Ah, Professor Layton!",
      "This ancient book mentions the Golden Apple.",
      "Perhaps you can decipher its final clue?"
    ]
  }
};