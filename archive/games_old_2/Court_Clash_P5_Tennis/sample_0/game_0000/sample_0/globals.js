export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const COURT = {
  x: 50,
  y: 100,
  width: 500,
  height: 250,
  lineWidth: 3
};

export const NET = {
  x: COURT.x + COURT.width / 2,
  y: COURT.y,
  width: 4,
  height: COURT.height
};

export const PLAYER_SIZE = 20;
export const BALL_SIZE = 8;

export const SHOT_TYPES = {
  DROP: 'DROP',
  REGULAR: 'REGULAR',
  POWER: 'POWER'
};

export const gameState = {
  gamePhase: "START", // START, PLAYING, PAUSED, GAME_OVER_WIN, GAME_OVER_LOSE
  controlMode: "HUMAN",
  player: null,
  opponent: null,
  ball: null,
  entities: [],
  score: {
    player: 0,
    opponent: 0,
    total: 0
  },
  level: 1,
  maxLevel: 4,
  highScore: 0,
  currentServer: 'player',
  ballInPlay: false,
  pointScored: false,
  pointMessage: '',
  pointMessageTimer: 0,
  lastShotType: '',
  aimAssistActive: false,
  swipeStart: null,
  swipeEnd: null,
  isSwiping: false,
  levelIntroTimer: 0,
  showLevelIntro: false
};

export const LEVEL_CONFIG = {
  1: {
    name: "Practice Court",
    opponentSpeed: 2,
    opponentAccuracy: 0.6,
    opponentPowerChance: 0.1,
    aimAssistAngle: 25,
    aimAssistStrength: 0.6,
    ballSpeedMultiplier: 1.0
  },
  2: {
    name: "Novice League",
    opponentSpeed: 3,
    opponentAccuracy: 0.75,
    opponentPowerChance: 0.25,
    aimAssistAngle: 15,
    aimAssistStrength: 0.4,
    ballSpeedMultiplier: 1.2
  },
  3: {
    name: "Amateur Championship",
    opponentSpeed: 4.5,
    opponentAccuracy: 0.85,
    opponentPowerChance: 0.4,
    aimAssistAngle: 5,
    aimAssistStrength: 0.2,
    ballSpeedMultiplier: 1.4
  },
  4: {
    name: "Pro Circuit",
    opponentSpeed: 6,
    opponentAccuracy: 0.95,
    opponentPowerChance: 0.5,
    aimAssistAngle: 0,
    aimAssistStrength: 0,
    ballSpeedMultiplier: 1.6
  }
};

export function getGameState() {
  return gameState;
}

if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}