// Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const PLAY_STATES = {
  EXPLORATION: "EXPLORATION",
  DIALOGUE: "DIALOGUE",
  MINIGAME: "MINIGAME",
  LEVEL_TRANSITION: "LEVEL_TRANSITION"
};

export const MINIGAME_TYPES = {
  SPELL_TRACE: "SPELL_TRACE",
  QTE: "QTE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  playState: PLAY_STATES.EXPLORATION,
  controlMode: "HUMAN",
  
  // Player stats
  player: null,
  currentEnergy: 50,
  maxEnergy: 50,
  courageLevel: 1,
  empathyLevel: 1,
  knowledgeLevel: 1,
  score: 0,
  
  // Progression
  currentYear: 1,
  currentChapter: 1,
  completedChapters: [],
  
  // Task tracking
  activeTask: null,
  taskProgressEnergySpent: 0,
  interactableObjects: [],
  
  // Dialogue
  currentDialogue: null,
  dialogueIndex: 0,
  selectedDialogueOption: 0,
  dialogueHistory: [],
  
  // Mini-game
  miniGameState: MINIGAME_TYPES.SPELL_TRACE,
  miniGameActive: false,
  miniGameAttempts: 0,
  miniGameMaxAttempts: 3,
  currentMiniGame: null,
  
  // Entities
  entities: [],
  
  // Testing
  testingActions: [],
  testingIndex: 0,
  testingTimer: 0
};

export const HOUSE_COLORS = {
  GRYFFINDOR: [170, 30, 30],
  HUFFLEPUFF: [240, 200, 20],
  RAVENCLAW: [30, 60, 150],
  SLYTHERIN: [30, 120, 30]
};