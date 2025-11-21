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

export const MINI_GAME_TYPES = {
  IMAGE_TO_WORD: "IMAGE_TO_WORD",
  WORD_TO_DEFINITION: "WORD_TO_DEFINITION",
  TYPING: "TYPING",
  WORD_TO_IMAGE: "WORD_TO_IMAGE",
  SENTENCE_COMPLETION: "SENTENCE_COMPLETION"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  
  // Player progress
  currentLevel: 1,
  unlockedLevels: 1,
  totalScore: 0,
  
  // Current level state
  levelScore: 0,
  currentQuestionIndex: 0,
  correctAnswersCount: 0,
  incorrectAnswersCount: 0,
  correctStreak: 0,
  
  // Current question state
  currentQuestion: null,
  selectedAnswerIndex: -1,
  typedAnswer: "",
  timeLeftForQuestion: 0,
  showingFeedback: false,
  feedbackTimer: 0,
  lastAnswerCorrect: false,
  
  // Level configuration
  currentLevelData: null,
  questions: [],
  
  // UI state
  hoveredButtonIndex: -1,
  hintUsed: false,
  removedOptionIndex: -1,
  revealedLetters: [],
  
  // Menu state
  menuSelectedIndex: 0,
  
  // Player entity (for compatibility)
  player: null,
  entities: []
};