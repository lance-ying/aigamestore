// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Sub-states for playing
export const SUBSTATE_WORDLE = "WORDLE";
export const SUBSTATE_CROSSWORD = "CROSSWORD";
export const SUBSTATE_LEVEL_TRANSITION = "LEVEL_TRANSITION";

// Color constants
export const COLOR_CORRECT = [106, 170, 100]; // Green
export const COLOR_WRONG_POSITION = [201, 180, 88]; // Yellow
export const COLOR_INCORRECT = [120, 124, 126]; // Gray
export const COLOR_EMPTY = [255, 255, 255]; // White
export const COLOR_BORDER = [211, 214, 218]; // Light gray

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  playingSubstate: null,
  controlMode: "HUMAN",
  score: 0,
  currentLevel: 1,
  
  // Wordle state
  wordle: {
    targetWord: "",
    currentRow: 0,
    currentCol: 0,
    grid: [], // 6x5 array of {letter, state}
    guesses: [],
    isSubmitting: false,
    animationFrame: 0,
    timeRemaining: 0,
    startTime: 0,
  },
  
  // Crossword state
  crossword: {
    gridSize: 3,
    grid: [], // 2D array of cells
    solution: [], // 2D array of correct letters
    blocked: [], // 2D array of blocked cells
    clues: { across: [], down: [] },
    activeRow: 0,
    activeCol: 0,
    activeDirection: "across",
    timeRemaining: 0,
    startTime: 0,
  },
  
  // Level transition
  levelTransition: {
    message: "",
    startTime: 0,
  },
  
  player: null, // For compatibility
  entities: [], // For compatibility
};

// Level definitions
export const LEVELS = [
  {
    level: 1,
    wordle: {
      words: ["APPLE", "HOUSE", "BEACH"],
      timeLimit: 300, // 5 minutes
    },
    crossword: {
      size: 3,
      timeLimit: 240, // 4 minutes
    },
  },
  {
    level: 2,
    wordle: {
      words: ["QUILL", "CATCH", "SPOON"],
      timeLimit: 240, // 4 minutes
    },
    crossword: {
      size: 4,
      timeLimit: 180, // 3 minutes
    },
  },
  {
    level: 3,
    wordle: {
      words: ["FUZZY", "JUMPY", "BLURT"],
      timeLimit: 180, // 3 minutes
    },
    crossword: {
      size: 5,
      timeLimit: 120, // 2 minutes
    },
  },
];

// Crossword puzzles (pre-defined)
export const CROSSWORD_PUZZLES = [
  // Level 1 - 3x3
  {
    size: 3,
    blocked: [[1, 1]],
    solution: [
      ["C", "A", "T"],
      ["A", null, "O"],
      ["R", "U", "N"]
    ],
    clues: {
      across: [
        { number: 1, clue: "Feline pet", answer: "CAT", row: 0, col: 0 },
        { number: 3, clue: "Sprint", answer: "RUN", row: 2, col: 0 }
      ],
      down: [
        { number: 1, clue: "Automobile", answer: "CAR", row: 0, col: 0 },
        { number: 2, clue: "Opposite of bottom", answer: "TOP", row: 0, col: 2 }
      ]
    }
  },
  // Level 2 - 4x4
  {
    size: 4,
    blocked: [[1, 1], [2, 2]],
    solution: [
      ["B", "E", "A", "R"],
      ["O", null, "R", "E"],
      ["A", "R", null, "A"],
      ["T", "E", "S", "T"]
    ],
    clues: {
      across: [
        { number: 1, clue: "Large mammal", answer: "BEAR", row: 0, col: 0 },
        { number: 5, clue: "Metal mineral", answer: "ORE", row: 1, col: 2 },
        { number: 6, clue: "Vessel", answer: "ARK", row: 2, col: 0 },
        { number: 7, clue: "Exam", answer: "TEST", row: 3, col: 0 }
      ],
      down: [
        { number: 1, clue: "Watercraft", answer: "BOAT", row: 0, col: 0 },
        { number: 2, clue: "Consume", answer: "EAT", row: 0, col: 1 },
        { number: 3, clue: "Skill", answer: "ART", row: 0, col: 2 },
        { number: 4, clue: "Genuine", answer: "REAL", row: 0, col: 3 }
      ]
    }
  },
  // Level 3 - 5x5
  {
    size: 5,
    blocked: [[0, 2], [1, 4], [2, 1], [3, 3], [4, 0]],
    solution: [
      ["S", "T", null, "A", "R"],
      ["T", "R", "U", "E", null],
      ["O", null, "N", "E", "W"],
      ["P", "L", "A", null, "N"],
      [null, "A", "N", "T", "S"]
    ],
    clues: {
      across: [
        { number: 1, clue: "Celestial body", answer: "STAR", row: 0, col: 0 },
        { number: 5, clue: "Factual", answer: "TRUE", row: 1, col: 0 },
        { number: 7, clue: "Fresh", answer: "NEW", row: 2, col: 2 },
        { number: 8, clue: "Stop motion", answer: "PAUSE", row: 3, col: 0 },
        { number: 10, clue: "Insects", answer: "ANTS", row: 4, col: 1 }
      ],
      down: [
        { number: 1, clue: "Halt", answer: "STOP", row: 0, col: 0 },
        { number: 2, clue: "Story", answer: "TALE", row: 0, col: 1 },
        { number: 3, clue: "Skilled", answer: "ABLE", row: 0, col: 3 },
        { number: 4, clue: "Rent", answer: "RENT", row: 0, col: 4 },
        { number: 6, clue: "Soil", answer: "EARTH", row: 1, col: 3 },
        { number: 9, clue: "Wager", answer: "ANT", row: 2, col: 2 }
      ]
    }
  }
];