// globals.js
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const CONTROL_MODES = {
  HUMAN: "HUMAN",
  TEST_1: "TEST_1",
  TEST_2: "TEST_2"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: CONTROL_MODES.HUMAN,
  player: null,
  entities: [],
  score: 0,
  level: 1,
  timeRemaining: 180, // 3 minutes in seconds
  bingoCard: [],
  markedSquares: new Set(),
  calledNumbers: [],
  currentCalledNumber: null,
  selectedRow: 2,
  selectedCol: 2,
  boosterMeter: 0,
  boosterMeterMax: 5,
  boosters: {
    instantMark: { available: false, active: false },
    scoreMultiplier: { available: false, active: false, endTime: 0 },
    freeMark: { available: false, active: false }
  },
  bingosAchieved: 0,
  lastMarkTime: 0,
  numberCallInterval: 3500,
  nextNumberCallTime: 0,
  luckyNumber: null,
  penaltyNumber: null,
  lastCalledNumberTime: 0,
  comboMultiplier: 1,
  comboEndTime: 0,
  recentBingos: [],
  framesSinceStart: 0
};

export const LEVEL_CONFIG = [
  { level: 1, targetScore: 5000, callSpeed: 3500, boosterCharge: 5, markPoints: 50, bingoPoints: 1000 },
  { level: 2, targetScore: 10000, callSpeed: 2500, boosterCharge: 7, markPoints: 60, bingoPoints: 1250 },
  { level: 3, targetScore: 18000, callSpeed: 1800, boosterCharge: 9, markPoints: 70, bingoPoints: 1500 },
  { level: 4, targetScore: 25000, callSpeed: 1200, boosterCharge: 12, markPoints: 80, bingoPoints: 1750 }
];

export function resetGameState() {
  gameState.score = 0;
  gameState.level = 1;
  gameState.timeRemaining = 180;
  gameState.bingoCard = [];
  gameState.markedSquares = new Set();
  gameState.calledNumbers = [];
  gameState.currentCalledNumber = null;
  gameState.selectedRow = 2;
  gameState.selectedCol = 2;
  gameState.boosterMeter = 0;
  gameState.boosterMeterMax = 5;
  gameState.boosters = {
    instantMark: { available: false, active: false },
    scoreMultiplier: { available: false, active: false, endTime: 0 },
    freeMark: { available: false, active: false }
  };
  gameState.bingosAchieved = 0;
  gameState.lastMarkTime = 0;
  gameState.numberCallInterval = 3500;
  gameState.nextNumberCallTime = 0;
  gameState.luckyNumber = null;
  gameState.penaltyNumber = null;
  gameState.lastCalledNumberTime = 0;
  gameState.comboMultiplier = 1;
  gameState.comboEndTime = 0;
  gameState.recentBingos = [];
  gameState.framesSinceStart = 0;
  gameState.entities = [];
  gameState.player = null;
}