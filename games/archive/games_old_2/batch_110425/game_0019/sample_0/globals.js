// globals.js - Game state and constants

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const TILE_SIZE = 32;
export const DUNGEON_WIDTH = 15;
export const DUNGEON_HEIGHT = 10;

export const GAME_PHASES = {
  START: "START",
  PARTY_SELECT: "PARTY_SELECT",
  PLAYING: "PLAYING",
  COMBAT: "COMBAT",
  INVENTORY: "INVENTORY",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const HERO_CLASSES = {
  WARRIOR: { name: "Warrior", hp: 120, atk: 15, def: 12, spd: 8, color: [200, 50, 50] },
  MAGE: { name: "Mage", hp: 70, atk: 25, def: 5, spd: 10, color: [100, 100, 255] },
  CLERIC: { name: "Cleric", hp: 90, atk: 10, def: 8, spd: 9, color: [255, 255, 150] },
  ROGUE: { name: "Rogue", hp: 80, atk: 18, def: 7, spd: 14, color: [100, 200, 100] },
  PALADIN: { name: "Paladin", hp: 110, atk: 13, def: 15, spd: 7, color: [255, 215, 0] },
  RANGER: { name: "Ranger", hp: 85, atk: 16, def: 8, spd: 12, color: [150, 100, 50] },
  BERSERKER: { name: "Berserker", hp: 130, atk: 20, def: 6, spd: 6, color: [180, 0, 0] },
  NECROMANCER: { name: "Necromancer", hp: 75, atk: 22, def: 6, spd: 8, color: [120, 0, 120] },
  BARD: { name: "Bard", hp: 85, atk: 12, def: 9, spd: 11, color: [255, 150, 200] }
};

export const ITEM_TYPES = ["Weapon", "Armor", "Accessory"];
export const ITEM_STATS = ["hp", "atk", "def", "spd"];

export const gameState = {
  player: null,
  party: [],
  entities: [],
  dungeon: null,
  dungeonLevel: 1,
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  combat: null,
  selectedPartySlot: 0,
  selectedHeroClass: 0,
  partySize: 0,
  maxPartySize: 4,
  inventory: [],
  cursorX: 0,
  cursorY: 0,
  cameraX: 0,
  cameraY: 0,
  combatLog: [],
  turnQueue: [],
  currentTurnIndex: 0,
  combatMenuState: "main", // main, skills, target
  selectedSkillIndex: 0,
  selectedTargetIndex: 0,
  lastMoveTime: 0
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function getGameState() {
  return gameState;
}