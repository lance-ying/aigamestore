// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const CATEGORIES = [
  { name: 'Science', color: [52, 152, 219], icon: '⚗️' },
  { name: 'Sports', color: [46, 204, 113], icon: '⚽' },
  { name: 'Art', color: [155, 89, 182], icon: '🎨' },
  { name: 'Geography', color: [241, 196, 15], icon: '🌍' },
  { name: 'Entertainment', color: [231, 76, 60], icon: '🎬' },
  { name: 'History', color: [230, 126, 34], icon: '🏰' }
];

export const CROWN_SEGMENT = {
  name: 'Crown',
  color: [255, 215, 0],
  icon: '👑'
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: "HUMAN",
  
  // Game-specific state
  currentLevel: 1,
  maxLevel: 4,
  currentTurn: 'PLAYER', // 'PLAYER' or 'AI'
  playerTokens: [],
  aiTokens: [],
  playerStreakCount: 0,
  aiStreakCount: 0,
  
  // Wheel state
  wheelRotation: 0,
  wheelSpinning: false,
  wheelTargetRotation: 0,
  wheelSpinSpeed: 0,
  selectedSegment: null,
  
  // Question state
  currentQuestion: null,
  selectedAnswer: -1,
  answeredCorrectly: false,
  showingFeedback: false,
  feedbackTimer: 0,
  
  // Challenge state
  inChallenge: false,
  challengeCategory: null,
  challengeQuestions: [],
  challengeCurrentIndex: 0,
  challengeCorrectCount: 0,
  
  // Phase management
  subPhase: 'SPIN_WHEEL', // SPIN_WHEEL, ANSWER_QUESTION, CHALLENGE, AI_TURN, FEEDBACK, LEVEL_TRANSITION
  phaseTimer: 0,
  
  // UI state
  highlightedAnswer: 0,
  showInstructions: true,
  
  // Question database
  questionDatabase: null
};

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = function() {
    return gameState;
  };
}

export const LEVEL_CONFIG = [
  {
    name: "Novice Noodle",
    aiAccuracy: 0.70,
    aiChallengeChance: 0.2,
    questionDifficulty: 'easy',
    challengeTimePerQuestion: 15
  },
  {
    name: "Quiz Cadet",
    aiAccuracy: 0.80,
    aiChallengeChance: 0.5,
    questionDifficulty: 'medium',
    challengeTimePerQuestion: 12
  },
  {
    name: "Trivia Tactician",
    aiAccuracy: 0.90,
    aiChallengeChance: 0.8,
    questionDifficulty: 'hard',
    challengeTimePerQuestion: 10
  },
  {
    name: "Knowledge Knight",
    aiAccuracy: 0.95,
    aiChallengeChance: 0.95,
    questionDifficulty: 'expert',
    challengeTimePerQuestion: 8
  }
];