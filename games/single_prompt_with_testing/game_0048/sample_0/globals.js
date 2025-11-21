// globals.js - Global game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASE = {
  START: "START",
  BOOK_SELECT: "BOOK_SELECT",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const COMBAT_STATE = {
  PLAYER_TURN: "PLAYER_TURN",
  ENEMY_TURN: "ENEMY_TURN",
  REWARD: "REWARD",
  TRANSITIONING: "TRANSITIONING"
};

export const gameState = {
  gamePhase: GAME_PHASE.START,
  controlMode: "HUMAN",
  
  // Player stats
  player: {
    maxHealth: 80,
    health: 80,
    maxMana: 3,
    mana: 3,
    x: 0,
    y: 0
  },
  
  // Deck and hand
  deck: [],
  hand: [],
  discardPile: [],
  
  // Combat state
  combatState: COMBAT_STATE.PLAYER_TURN,
  enemies: [],
  selectedCardIndex: -1,
  selectedEnemyIndex: 0,
  turnCounter: 0,
  
  // Progression
  currentBook: null,
  currentFloor: 1,
  maxFloor: 3,
  booksCompleted: [],
  resources: 0,
  
  // Rewards
  rewardCards: [],
  rewardRelics: [],
  selectedRewardIndex: 0,
  
  // Relics
  relics: [],
  
  // UI state
  menuSelection: 0,
  showCardDetail: false,
  
  // Entities for logging
  entities: [],
  
  score: 0
};

export const BOOKS = [
  {
    id: 1,
    name: "Crimson Chronicles",
    theme: "Fire",
    color: [220, 50, 50],
    enemyTypes: ["Flame Imp", "Fire Sprite", "Inferno Knight"],
    bossName: "Pyro Lord"
  },
  {
    id: 2,
    name: "Azure Codex",
    theme: "Ice",
    color: [50, 150, 220],
    enemyTypes: ["Frost Wisp", "Ice Golem", "Frozen Mage"],
    bossName: "Glacial Empress"
  },
  {
    id: 3,
    name: "Verdant Volume",
    theme: "Nature",
    color: [80, 200, 80],
    enemyTypes: ["Vine Crawler", "Thorn Beast", "Forest Guardian"],
    bossName: "Ancient Treant"
  },
  {
    id: 4,
    name: "Shadow Scriptorium",
    theme: "Dark",
    color: [120, 80, 180],
    enemyTypes: ["Shadow Lurker", "Dark Wraith", "Void Knight"],
    bossName: "Sealed Witch"
  }
];

export const CARD_TYPES = {
  ATTACK: "ATTACK",
  DEFEND: "DEFEND",
  SKILL: "SKILL"
};

// Base card library
export const CARD_LIBRARY = [
  // Basic attacks
  { id: "strike", name: "Strike", type: CARD_TYPES.ATTACK, cost: 1, damage: 6, description: "Deal 6 damage" },
  { id: "slash", name: "Slash", type: CARD_TYPES.ATTACK, cost: 1, damage: 8, description: "Deal 8 damage" },
  { id: "cleave", name: "Cleave", type: CARD_TYPES.ATTACK, cost: 2, damage: 5, description: "Deal 5 damage to ALL enemies", aoe: true },
  { id: "heavy_blow", name: "Heavy Blow", type: CARD_TYPES.ATTACK, cost: 2, damage: 14, description: "Deal 14 damage" },
  { id: "flurry", name: "Flurry", type: CARD_TYPES.ATTACK, cost: 2, damage: 4, hits: 3, description: "Deal 4 damage 3 times" },
  
  // Defensive cards
  { id: "defend", name: "Defend", type: CARD_TYPES.DEFEND, cost: 1, block: 5, description: "Gain 5 block" },
  { id: "fortify", name: "Fortify", type: CARD_TYPES.DEFEND, cost: 2, block: 10, description: "Gain 10 block" },
  
  // Skills
  { id: "focus", name: "Focus", type: CARD_TYPES.SKILL, cost: 0, drawCards: 1, description: "Draw 1 card" },
  { id: "prepare", name: "Prepare", type: CARD_TYPES.SKILL, cost: 1, drawCards: 2, description: "Draw 2 cards" },
  { id: "weaken", name: "Weaken", type: CARD_TYPES.SKILL, cost: 1, debuff: "weak", description: "Enemy deals 25% less damage next turn" },
  { id: "poison", name: "Poison Strike", type: CARD_TYPES.ATTACK, cost: 1, damage: 4, debuff: "poison", description: "Deal 4 damage. Apply 2 poison" },
  { id: "heal", name: "Bandage", type: CARD_TYPES.SKILL, cost: 1, heal: 5, description: "Heal 5 HP" }
];

export const RELIC_LIBRARY = [
  { id: "ring_strength", name: "Power Ring", description: "Start each combat with +1 mana", effect: "extraMana" },
  { id: "pendant_health", name: "Life Pendant", description: "+10 Max HP", effect: "maxHealth" },
  { id: "boots_speed", name: "Swift Boots", description: "Draw 1 extra card each turn", effect: "drawCard" },
  { id: "charm_regen", name: "Regeneration Charm", description: "Heal 2 HP at end of turn", effect: "regen" }
];

// Utility function to create a card instance
export function createCard(cardTemplate) {
  return {
    ...cardTemplate,
    id: cardTemplate.id + "_" + Math.random().toString(36).substr(2, 9)
  };
}