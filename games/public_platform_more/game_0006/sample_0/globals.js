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
  
  // Game-specific state
  currentSpace: 0,
  totalSpaces: 40,
  money: 5000,
  lifePoints: 0,
  assets: 0,
  
  // Spinner state
  spinnerValue: 0,
  isSpinning: false,
  spinnerAngle: 0,
  
  // Movement state
  isMoving: false,
  targetSpace: 0,
  moveProgress: 0,
  
  // Decision state
  awaitingDecision: false,
  decisionOptions: [],
  selectedOption: 0,
  
  // Minigame state
  inMinigame: false,
  minigameType: null,
  minigameProgress: 0,
  minigameTargets: [],
  minigameScore: 0,
  minigameComplete: false,
  
  // Career and life stage
  careerLevel: 0,
  hasCollege: false,
  
  // Space types encountered
  spacesVisited: []
};

export const SPACE_TYPES = {
  NORMAL: "NORMAL",
  CAREER: "CAREER",
  EDUCATION: "EDUCATION",
  INVESTMENT: "INVESTMENT",
  EVENT: "EVENT",
  PAYDAY: "PAYDAY",
  RETIREMENT: "RETIREMENT"
};

export const MINIGAME_TYPES = {
  TAP_TIMING: "TAP_TIMING",
  RAPID_TAP: "RAPID_TAP",
  SEQUENCE: "SEQUENCE"
};