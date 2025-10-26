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

export const TURN_PHASES = {
  PLAYER: 'PLAYER',
  ENEMY: 'ENEMY',
  LEVEL_CLEARED: 'LEVEL_CLEARED'
};

export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  gamePhase: GAME_PHASES.START,
  controlMode: 'HUMAN',
  currentTurnPhase: TURN_PHASES.PLAYER,
  currentLevel: 1,
  totalScore: 0,
  hand: [],
  selectedCardIndex: 0,
  turnAnimations: [],
  damageNumbers: [],
  framesSincePhaseChange: 0,
  enemyTurnIndex: 0,
  enemyTurnDelay: 0
};

export const CARD_TYPES = {
  STRIKE: {
    id: 'STRIKE',
    name: 'Strike',
    cost: 2,
    description: 'Deal 20 damage',
    effect: 'DAMAGE',
    value: 20
  },
  CLEAVE: {
    id: 'CLEAVE',
    name: 'Cleave',
    cost: 3,
    description: 'Deal 12 to all',
    effect: 'AOE_DAMAGE',
    value: 12
  },
  GUARD: {
    id: 'GUARD',
    name: 'Guard',
    cost: 2,
    description: 'Block 15 damage',
    effect: 'BLOCK',
    value: 15
  },
  HEAL: {
    id: 'HEAL',
    name: 'Heal',
    cost: 3,
    description: 'Restore 25 HP',
    effect: 'HEAL',
    value: 25
  },
  POWER_UP: {
    id: 'POWER_UP',
    name: 'Power Up',
    cost: 2,
    description: '+10 damage (2 turns)',
    effect: 'BUFF_DAMAGE',
    value: 10,
    duration: 2
  }
};

export const LEVEL_CONFIGS = [
  {
    level: 1,
    name: 'Training Grounds',
    playerHP: 100,
    playerAP: 5,
    deck: ['STRIKE', 'STRIKE', 'GUARD', 'GUARD', 'HEAL', 'HEAL'],
    enemies: [
      { type: 'GRUNT', hp: 50, damage: 5, x: 450, y: 150 },
      { type: 'GRUNT', hp: 50, damage: 5, x: 500, y: 250 }
    ]
  },
  {
    level: 2,
    name: 'Forest Outskirts',
    playerHP: 100,
    playerAP: 6,
    deck: ['STRIKE', 'STRIKE', 'CLEAVE', 'GUARD', 'GUARD', 'HEAL', 'HEAL'],
    enemies: [
      { type: 'GRUNT', hp: 70, damage: 8, x: 420, y: 120 },
      { type: 'GRUNT_RAGE', hp: 70, damage: 8, x: 480, y: 200 },
      { type: 'GRUNT', hp: 70, damage: 8, x: 520, y: 280 }
    ]
  },
  {
    level: 3,
    name: 'Mountain Pass',
    playerHP: 120,
    playerAP: 7,
    deck: ['STRIKE', 'STRIKE', 'CLEAVE', 'GUARD', 'GUARD', 'HEAL', 'POWER_UP', 'POWER_UP'],
    enemies: [
      { type: 'HEAVY', hp: 150, damage: 15, x: 480, y: 200 },
      { type: 'GRUNT', hp: 60, damage: 8, x: 420, y: 120 },
      { type: 'GRUNT', hp: 60, damage: 8, x: 520, y: 280 }
    ]
  },
  {
    level: 4,
    name: 'Cavern Depths',
    playerHP: 120,
    playerAP: 7,
    deck: ['STRIKE', 'STRIKE', 'CLEAVE', 'CLEAVE', 'GUARD', 'GUARD', 'HEAL', 'POWER_UP', 'POWER_UP'],
    enemies: [
      { type: 'HEAVY_DOUBLE', hp: 130, damage: 12, x: 440, y: 150 },
      { type: 'HEAVY_HEAL', hp: 130, damage: 12, x: 520, y: 250 },
      { type: 'GRUNT', hp: 50, damage: 7, x: 480, y: 320 }
    ]
  },
  {
    level: 5,
    name: 'Boss Lair',
    playerHP: 150,
    playerAP: 8,
    deck: ['STRIKE', 'STRIKE', 'CLEAVE', 'CLEAVE', 'GUARD', 'GUARD', 'HEAL', 'HEAL', 'POWER_UP', 'POWER_UP'],
    enemies: [
      { type: 'BOSS', hp: 300, damage: 20, x: 480, y: 200 }
    ]
  }
];