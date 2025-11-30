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
  totalEnemies: 18, // 6 levels * 3 battles
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

// Elemental Types
export const ELEMENTS = {
  NONE: { name: "None", color: [150, 150, 150], icon: "⚪" },
  FIRE: { name: "Fire", color: [220, 80, 40], icon: "🔥" },
  WATER: { name: "Water", color: [60, 120, 220], icon: "💧" },
  NATURE: { name: "Nature", color: [80, 180, 60], icon: "🌿" }
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
    element: ELEMENTS.NONE,
    energy: 1,
    description: "Deal 4 damage",
    effect: (target, player, card) => {
      target.takeDamage(4, card.element);
    }
  },
  {
    id: "defend",
    name: "Defend",
    type: CARD_TYPES.SKILL,
    element: ELEMENTS.NONE,
    energy: 1,
    description: "Gain 4 block",
    effect: (player, gameState, card) => {
      player.block += 4;
    }
  },
  {
    id: "bash",
    name: "Bash",
    type: CARD_TYPES.ATTACK,
    element: ELEMENTS.FIRE,
    energy: 2,
    description: "Deal 5 Fire dmg, apply 2 Vuln",
    effect: (target, player, card) => {
      target.takeDamage(5, card.element);
      target.vulnerable = (target.vulnerable || 0) + 2;
    }
  },
  {
    id: "cleave",
    name: "Cleave",
    type: CARD_TYPES.ATTACK,
    element: ELEMENTS.NATURE,
    energy: 1,
    description: "Deal 5 Nature damage",
    effect: (target, player, card) => {
      target.takeDamage(5, card.element);
    }
  },
  {
    id: "iron_wave",
    name: "Iron Wave",
    type: CARD_TYPES.ATTACK,
    element: ELEMENTS.NONE,
    energy: 1,
    description: "Deal 3 dmg, gain 4 block",
    effect: (target, player, card) => {
      target.takeDamage(3, card.element);
      player.block += 4;
    }
  },
  {
    id: "shrug_it_off",
    name: "Shrug It Off",
    type: CARD_TYPES.SKILL,
    element: ELEMENTS.NONE,
    energy: 1,
    description: "Gain 6 block, draw 1",
    effect: (player, gameState, card) => {
      player.block += 6;
      drawCard(gameState, 1);
    }
  },
  {
    id: "uppercut",
    name: "Uppercut",
    type: CARD_TYPES.ATTACK,
    element: ELEMENTS.WATER,
    energy: 2,
    description: "Deal 8 Water damage",
    effect: (target, player, card) => {
      target.takeDamage(8, card.element);
    }
  },
  {
    id: "inflame",
    name: "Inflame",
    type: CARD_TYPES.POWER,
    element: ELEMENTS.FIRE,
    energy: 1,
    description: "Gain 2 strength",
    effect: (player, gameState, card) => {
      player.strength = (player.strength || 0) + 2;
    }
  },
  {
    id: "true_grit",
    name: "True Grit",
    type: CARD_TYPES.SKILL,
    element: ELEMENTS.NONE,
    energy: 1,
    description: "Gain 5 block",
    effect: (player, gameState, card) => {
      player.block += 5;
    }
  },
  {
    id: "battle_trance",
    name: "Battle Trance",
    type: CARD_TYPES.SKILL,
    element: ELEMENTS.NONE,
    energy: 0,
    description: "Draw 3 cards",
    effect: (player, gameState, card) => {
      drawCard(gameState, 3);
    }
  },
  {
    id: "fireball",
    name: "Fireball",
    type: CARD_TYPES.ATTACK,
    element: ELEMENTS.FIRE,
    energy: 2,
    description: "Deal 12 Fire damage",
    effect: (target, player, card) => {
      target.takeDamage(12, card.element);
    }
  },
  {
    id: "tidal_wave",
    name: "Tidal Wave",
    type: CARD_TYPES.ATTACK,
    element: ELEMENTS.WATER,
    energy: 2,
    description: "Deal 10 Water damage",
    effect: (target, player, card) => {
      target.takeDamage(10, card.element);
    }
  },
  {
    id: "vine_whip",
    name: "Vine Whip",
    type: CARD_TYPES.ATTACK,
    element: ELEMENTS.NATURE,
    energy: 1,
    description: "Deal 6 Nature damage",
    effect: (target, player, card) => {
      target.takeDamage(6, card.element);
    }
  }
];

// Enemy templates
export const ENEMY_TEMPLATES = [
  {
    id: "slime",
    name: "Slime",
    element: ELEMENTS.WATER,
    health: 35,
    maxHealth: 35,
    intentions: ["ATTACK", "DEFEND", "ATTACK"],
    attackDamage: 8,
    blockAmount: 5,
    color: [120, 200, 255]
  },
  {
    id: "cultist",
    name: "Cultist",
    element: ELEMENTS.NATURE,
    health: 50,
    maxHealth: 50,
    intentions: ["BUFF", "ATTACK", "ATTACK"],
    attackDamage: 7,
    blockAmount: 0,
    color: [100, 200, 100]
  },
  {
    id: "jaw_worm",
    name: "Jaw Worm",
    element: ELEMENTS.FIRE,
    health: 90,
    maxHealth: 90,
    intentions: ["ATTACK", "DEFEND", "ATTACK", "BUFF"],
    attackDamage: 13,
    blockAmount: 6,
    color: [220, 100, 50]
  },
  {
    id: "thief",
    name: "Thief",
    element: ELEMENTS.NATURE,
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
    element: ELEMENTS.FIRE,
    health: 200,
    maxHealth: 200,
    intentions: ["DEFEND", "ATTACK", "ATTACK", "DEFEND", "HEAVY_ATTACK"],
    attackDamage: 12,
    heavyAttackDamage: 25,
    blockAmount: 15,
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