// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;

export const GAME_PHASES = {
  START: "START",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER_WIN: "GAME_OVER_WIN",
  GAME_OVER_LOSE: "GAME_OVER_LOSE"
};

export const PLAY_MODES = {
  EXPLORATION: "EXPLORATION",
  COMBAT: "COMBAT",
  MENU: "MENU"
};

export const gameState = {
  player: null,
  entities: [],
  enemies: [],
  currentEnemy: null,
  score: 0,
  gamePhase: GAME_PHASES.START,
  playMode: PLAY_MODES.EXPLORATION,
  controlMode: "HUMAN",
  level: 1,
  exp: 0,
  expToNext: 100,
  combatTurn: "PLAYER",
  selectedAction: 0,
  selectedWeapon: 0,
  selectedSkill: 0,
  menuState: "MAIN",
  combatLog: [],
  waveNumber: 1,
  totalWaves: 3,
  enemiesDefeated: 0,
  playerPosition: { x: 300, y: 200 },
  inCombatTransition: false,
  transitionTimer: 0,
  combatVictory: false,
  victoryTimer: 0
};

// Window accessor for gameState
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}

export function resetGameState() {
  gameState.score = 0;
  gameState.level = 1;
  gameState.exp = 0;
  gameState.expToNext = 100;
  gameState.enemies = [];
  gameState.currentEnemy = null;
  gameState.combatTurn = "PLAYER";
  gameState.selectedAction = 0;
  gameState.selectedWeapon = 0;
  gameState.selectedSkill = 0;
  gameState.menuState = "MAIN";
  gameState.combatLog = [];
  gameState.waveNumber = 1;
  gameState.enemiesDefeated = 0;
  gameState.playerPosition = { x: 300, y: 200 };
  gameState.playMode = PLAY_MODES.EXPLORATION;
  gameState.inCombatTransition = false;
  gameState.transitionTimer = 0;
  gameState.combatVictory = false;
  gameState.victoryTimer = 0;
}