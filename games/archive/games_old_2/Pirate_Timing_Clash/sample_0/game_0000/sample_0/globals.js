// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  LEVEL_TRANSITION: "LEVEL_TRANSITION",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const gameState = {
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  player: null,
  entities: [],
  enemies: [],
  currentLevel: 1,
  score: 0,
  highScore: 0,
  timingBar: null,
  isPlayerTurn: true,
  currentEnemyTurnIndex: 0,
  combatMessage: "",
  combatMessageTimer: 0,
  levelTransitionTimer: 0
};

// Level configurations
export const LEVELS = [
  {
    level: 1,
    name: "Rookie Encounter",
    enemies: [
      { type: "Sea Thug", hp: 50, maxHp: 50, attack: 10 },
      { type: "Sea Thug", hp: 50, maxHp: 50, attack: 10 }
    ],
    timingSpeed: 1.5,
    perfectZoneWidth: 30,
    greatZoneWidth: 50,
    goodZoneWidth: 70
  },
  {
    level: 2,
    name: "Pirate Scuffle",
    enemies: [
      { type: "Pirate Brute", hp: 75, maxHp: 75, attack: 15 },
      { type: "Pirate Brute", hp: 75, maxHp: 75, attack: 15 },
      { type: "Pirate Brute", hp: 75, maxHp: 75, attack: 15 }
    ],
    timingSpeed: 2.0,
    perfectZoneWidth: 25,
    greatZoneWidth: 45,
    goodZoneWidth: 65
  },
  {
    level: 3,
    name: "Marine Patrol",
    enemies: [
      { type: "Marine Captain", hp: 100, maxHp: 100, attack: 20 },
      { type: "Marine Captain", hp: 100, maxHp: 100, attack: 20 },
      { type: "Marine Captain", hp: 120, maxHp: 120, attack: 20 },
      { type: "Marine Captain", hp: 100, maxHp: 100, attack: 20 }
    ],
    timingSpeed: 2.5,
    perfectZoneWidth: 22,
    greatZoneWidth: 40,
    goodZoneWidth: 60
  },
  {
    level: 4,
    name: "Grand Line Challenge",
    enemies: [
      { type: "Warlord's Henchman", hp: 150, maxHp: 150, attack: 25 },
      { type: "Warlord's Henchman", hp: 150, maxHp: 150, attack: 25 }
    ],
    timingSpeed: 3.0,
    perfectZoneWidth: 20,
    greatZoneWidth: 35,
    goodZoneWidth: 55
  },
  {
    level: 5,
    name: "Emperor's Minion",
    enemies: [
      { type: "Yonko Commander", hp: 350, maxHp: 350, attack: 35, isBoss: true }
    ],
    timingSpeed: 3.5,
    perfectZoneWidth: 18,
    greatZoneWidth: 32,
    goodZoneWidth: 50
  }
];

// Load high score from localStorage
export function loadHighScore() {
  const saved = localStorage.getItem('pirateTimingClashHighScore');
  gameState.highScore = saved ? parseInt(saved) : 0;
}

// Save high score to localStorage
export function saveHighScore() {
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem('pirateTimingClashHighScore', gameState.highScore.toString());
  }
}