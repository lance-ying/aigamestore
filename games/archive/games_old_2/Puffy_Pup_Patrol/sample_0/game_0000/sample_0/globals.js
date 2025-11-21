// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER_WIN: 'GAME_OVER_WIN',
  GAME_OVER_LOSE: 'GAME_OVER_LOSE'
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: 'HUMAN',
  player: null,
  entities: [],
  score: 0,
  highScore: 0,
  currentLevel: 1,
  swellingMeter: 0,
  successfulHeals: 0,
  levelStartTime: 0,
  currentTargetShape: null,
  isDrawing: false,
  drawnPath: [],
  cursorX: CANVAS_WIDTH / 2,
  cursorY: CANVAS_HEIGHT / 2,
  distractions: [],
  feedbackMessage: null,
  feedbackTimer: 0,
  particles: [],
  dogHeadScale: 1.0,
  dogMood: 'neutral',
  levelTransitionTimer: 0,
  showLevelTransition: false
};

// Level configurations
export const LEVEL_CONFIG = [
  {
    level: 1,
    name: 'Gentle Pat',
    requiredHeals: 5,
    swellingRate: 0.08,
    timeLimit: null,
    shapeComplexity: 'simple',
    distractionCount: 0,
    distractionSpeed: 0
  },
  {
    level: 2,
    name: 'Comforting Rub',
    requiredHeals: 7,
    swellingRate: 0.12,
    timeLimit: null,
    shapeComplexity: 'medium',
    distractionCount: 1,
    distractionSpeed: 1
  },
  {
    level: 3,
    name: 'Therapeutic Trace',
    requiredHeals: 10,
    swellingRate: 0.16,
    timeLimit: null,
    shapeComplexity: 'complex',
    distractionCount: 2,
    distractionSpeed: 1.5
  },
  {
    level: 4,
    name: 'Calming Compression',
    requiredHeals: 12,
    swellingRate: 0.20,
    timeLimit: 180,
    shapeComplexity: 'veryComplex',
    distractionCount: 3,
    distractionSpeed: 2
  },
  {
    level: 5,
    name: 'Master Healer',
    requiredHeals: 15,
    swellingRate: 0.25,
    timeLimit: 150,
    shapeComplexity: 'master',
    distractionCount: 4,
    distractionSpeed: 2.5
  }
];

// Expose getGameState globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}