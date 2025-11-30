// Game constants
export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 650;
export const CARD_WIDTH = 110;
export const CARD_HEIGHT = 120;
export const MAX_ENERGY = 3;
export const STARTING_HAND_SIZE = 5;
export const MAX_HAND_SIZE = 10;
export const PLAYER_MAX_HEALTH = 50;

// Game state object
export const gameState = {
  gamePhase: "START",  // "START", "PLAYING", "PAUSED", "GAME_OVER_WIN", "GAME_OVER_LOSE"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", "TEST_3", etc.
  player: null,
  enemies: [],
  currentEnemy: null,
  currentEnemyIndex: 0,
  totalEnemies: 10,
  deck: [],
  hand: [],
  drawPile: [],
  discardPile: [],
  energy: MAX_ENERGY,
  turn: "PLAYER", // "PLAYER" or "ENEMY"
  selectedCardIndex: 0,
  viewingPile: null, // "DRAW" or "DISCARD" or null
  battleState: "SELECT_CARD", // "SELECT_CARD", "SELECT_TARGET", "ENEMY_TURN", "REWARD"
  availableRewards: [],
  selectedRewardIndex: 0,
  battleCount: 0,
  animations: [],
  keyStates: {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
    shift: false,
    z: false
  }
};

// Card types
export const CARD_TYPES = {
  ATTACK: {
    name: "Attack",
    color: [220, 60, 60]
  },
  SKILL: {
    name: "Skill",
    color: [60, 180, 220]
  },
  POWER: {
    name: "Power",
    color: [180, 100, 220]
  }
};

// Card templates
export const CARD_TEMPLATES = [
  {
    id: "strike",
    name: "Strike",
    type: CARD_TYPES.ATTACK,
    energy: 1,
    description: "Deal 4 damage",
    effect: (target) => {
      target.takeDamage(4);
    }
  },
  {
    id: "defend",
    name: "Defend",
    type: CARD_TYPES.SKILL,
    energy: 1,
    description: "Gain 4 block",
    effect: (player) => {
      player.block += 4;
    }
  },
  {
    id: "bash",
    name: "Bash",
    type: CARD_TYPES.ATTACK,
    energy: 2,
    description: "Deal 5 damage and apply 2 vulnerable",
    effect: (target) => {
      target.takeDamage(5);
      target.vulnerable = (target.vulnerable || 0) + 2;
    }
  },
  {
    id: "cleave",
    name: "Cleave",
    type: CARD_TYPES.ATTACK,
    energy: 1,
    description: "Deal 5 damage",
    effect: (target) => {
      target.takeDamage(5);
    }
  },
  {
    id: "iron_wave",
    name: "Iron Wave",
    type: CARD_TYPES.ATTACK,
    energy: 1,
    description: "Deal 3 damage and gain 4 block",
    effect: (target, player) => {
      target.takeDamage(3);
      player.block += 4;
    }
  },
  {
    id: "shrug_it_off",
    name: "Shrug It Off",
    type: CARD_TYPES.SKILL,
    energy: 1,
    description: "Gain 6 block and draw a card",
    effect: (player, gameState) => {
      player.block += 6;
      drawCard(gameState, 1);
    }
  },
  {
    id: "uppercut",
    name: "Uppercut",
    type: CARD_TYPES.ATTACK,
    energy: 2,
    description: "Deal 8 damage",
    effect: (target) => {
      target.takeDamage(8);
    }
  },
  {
    id: "inflame",
    name: "Inflame",
    type: CARD_TYPES.POWER,
    energy: 1,
    description: "Gain 2 strength",
    effect: (player) => {
      player.strength = (player.strength || 0) + 2;
    }
  },
  {
    id: "true_grit",
    name: "True Grit",
    type: CARD_TYPES.SKILL,
    energy: 1,
    description: "Gain 5 block",
    effect: (player) => {
      player.block += 5;
    }
  },
  {
    id: "battle_trance",
    name: "Battle Trance",
    type: CARD_TYPES.SKILL,
    energy: 0,
    description: "Draw 3 cards",
    effect: (player, gameState) => {
      drawCard(gameState, 3);
    }
  }
];

// Enemy templates
export const ENEMY_TEMPLATES = [
  {
    id: "slime",
    name: "Slime",
    health: 35,
    maxHealth: 35,
    intentions: ["ATTACK", "DEFEND", "ATTACK"],
    attackDamage: 8,
    blockAmount: 5,
    color: [120, 200, 100]
  },
  {
    id: "cultist",
    name: "Cultist",
    health: 50,
    maxHealth: 50,
    intentions: ["BUFF", "ATTACK", "ATTACK"],
    attackDamage: 7,
    blockAmount: 0,
    color: [150, 50, 200]
  },
  {
    id: "jaw_worm",
    name: "Jaw Worm",
    health: 90,
    maxHealth: 90,
    intentions: ["ATTACK", "DEFEND", "ATTACK", "BUFF"],
    attackDamage: 13,
    blockAmount: 6,
    color: [220, 120, 50]
  },
  {
    id: "thief",
    name: "Thief",
    health: 60,
    maxHealth: 60,
    intentions: ["ATTACK", "DEBUFF", "ATTACK"],
    attackDamage: 10,
    blockAmount: 0,
    color: [70, 130, 180]
  },
  {
    id: "boss",
    name: "The Guardian",
    health: 150,
    maxHealth: 150,
    intentions: ["DEFEND", "ATTACK", "ATTACK", "DEFEND", "HEAVY_ATTACK"],
    attackDamage: 10,
    heavyAttackDamage: 20,
    blockAmount: 9,
    color: [200, 60, 60]
  }
];

// Helper function to draw cards
export function drawCard(gameState, count = 1) {
  for (let i = 0; i < count; i++) {
    if (gameState.drawPile.length === 0) {
      // Shuffle discard pile into draw pile
      gameState.drawPile = [...gameState.discardPile];
      gameState.discardPile = [];
      shuffleArray(gameState.drawPile);
    }
    
    if (gameState.drawPile.length > 0 && gameState.hand.length < MAX_HAND_SIZE) {
      const card = gameState.drawPile.pop();
      gameState.hand.push(card);
    }
  }
}

// Shuffle array helper
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Function to get game state
export function getGameState() {
  return gameState;
}

// Expose the getGameState function globally
window.getGameState = getGameState;