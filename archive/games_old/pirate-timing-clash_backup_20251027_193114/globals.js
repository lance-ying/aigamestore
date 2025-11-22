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

// Player abilities
export const ABILITIES = {
  QUICK_STRIKE: {
    id: "QUICK_STRIKE",
    name: "Quick Strike",
    key: "1",
    unlockLevel: 1,
    description: "Fast attack, easier timing",
    damage: 0.8,
    timingSpeedMod: 0.7,
    perfectWidthMod: 1.4,
    greatWidthMod: 1.4,
    goodWidthMod: 1.4,
    gaugeAdd: 15,
    multiTarget: false,
    healsPlayer: false
  },
  POWER_SLASH: {
    id: "POWER_SLASH",
    name: "Power Slash",
    key: "2",
    unlockLevel: 2,
    description: "High damage, harder timing",
    damage: 1.8,
    timingSpeedMod: 1.3,
    perfectWidthMod: 0.7,
    greatWidthMod: 0.7,
    goodWidthMod: 0.8,
    gaugeAdd: 25,
    multiTarget: false,
    healsPlayer: false
  },
  MULTI_STRIKE: {
    id: "MULTI_STRIKE",
    name: "Multi-Strike",
    key: "3",
    unlockLevel: 3,
    description: "Hits all enemies",
    damage: 0.6,
    timingSpeedMod: 1.0,
    perfectWidthMod: 1.0,
    greatWidthMod: 1.0,
    goodWidthMod: 1.0,
    gaugeAdd: 20,
    multiTarget: true,
    healsPlayer: false
  },
  HEALING_STRIKE: {
    id: "HEALING_STRIKE",
    name: "Healing Strike",
    key: "4",
    unlockLevel: 4,
    description: "Attack and restore HP",
    damage: 1.0,
    timingSpeedMod: 0.9,
    perfectWidthMod: 1.2,
    greatWidthMod: 1.2,
    goodWidthMod: 1.2,
    gaugeAdd: 15,
    multiTarget: false,
    healsPlayer: true,
    healAmount: 25
  }
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
    goodZoneWidth: 70,
    xpReward: 100
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
    goodZoneWidth: 65,
    xpReward: 150
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
    goodZoneWidth: 60,
    xpReward: 200
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
    goodZoneWidth: 55,
    xpReward: 300
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
    goodZoneWidth: 50,
    xpReward: 500
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