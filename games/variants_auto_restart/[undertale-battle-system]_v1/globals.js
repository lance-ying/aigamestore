// globals.js - Global game state and constants
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 450;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const BATTLE_PHASES = {
  MENU: "MENU",
  ATTACK_INPUT: "ATTACK_INPUT",
  ENEMY_TURN: "ENEMY_TURN",
  DIALOGUE: "DIALOGUE",
  VICTORY: "VICTORY"
};

export const gameState = {
  player: null,
  entities: [],
  score: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  battlePhase: BATTLE_PHASES.MENU,
  currentEnemy: null,
  enemyIndex: 0,
  menuSelection: 0,
  subMenuSelection: 0,
  inSubMenu: false,
  playerHP: 20,
  maxHP: 20,
  dodgeCooldown: 0,
  attackTiming: 0,
  isAttacking: false,
  dialogueQueue: [],
  currentDialogue: "",
  enemiesDefeated: 0,
  enemiesSpared: 0,
  totalEnemies: 9,
  damageFlash: 0,
  inventory: [], // Dynamic inventory
  tookDamageInTurn: false, // Track if player was hit during enemy turn
  autoRestartScheduled: false, // New: Flag to track if auto-restart is scheduled
  autoRestartTimeoutId: null // New: Stores the ID of the setTimeout for auto-restart
};

// Global function to get game state
export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;