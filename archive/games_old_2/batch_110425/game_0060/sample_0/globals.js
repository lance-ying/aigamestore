// Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const APP_TYPES = {
  BROWSER: "browser",
  DATABASE: "database",
  CHAT: "chat",
  EMAIL: "email"
};

// Game state object
export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Desktop state
  selectedAppIndex: 0,
  openApp: null,
  
  // Case progression
  currentCase: 1,
  totalCases: 5,
  casesCompleted: 0,
  
  // Player progress
  searchHistory: [],
  databaseEntries: [],
  crackedAccounts: [],
  chatMessages: [],
  
  // Current case data
  caseObjectives: [],
  objectivesCompleted: 0,
  passwordAttempts: 0,
  maxPasswordAttempts: 3,
  
  // Clues discovered
  discoveredClues: new Set(),
  
  // Chat dialogue state
  currentDialogueStep: 0,
  dialogueChoices: [],
  
  // Timer
  frameCount: 0,
  
  // UI state
  browserSearchInput: "",
  databaseQueryInput: "",
  passwordInput: "",
  selectedChoiceIndex: 0
};

// Case data structure
export const CASE_DATA = {
  1: {
    title: "The Vanishing Journalist",
    description: "A journalist investigating corruption has disappeared. Find out what happened.",
    objectives: [
      "Search for journalist's background",
      "Query database for connections",
      "Crack email password",
      "Extract evidence from email",
      "Social engineer the suspect"
    ],
    keywords: ["Sarah Chen", "journalist", "corruption", "investigation"],
    databaseKey: "Chen",
    targetEmail: "suspect@corp.net",
    passwordClue: "birthday",
    correctPassword: "1985",
    chatDialogue: [
      {
        question: "I know what you did to Sarah Chen.",
        choices: [
          "Tell me where she is or I'll leak the evidence.",
          "I have proof of your involvement. Confess now.",
          "You can't hide from the truth forever."
        ],
        correctIndex: 1
      }
    ]
  }
};