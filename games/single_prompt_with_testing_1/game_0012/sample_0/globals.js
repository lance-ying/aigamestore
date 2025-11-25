// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TILE_SIZE = 32;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Sub-phases during PLAYING
export const SUBPHASE_OVERWORLD = "OVERWORLD";
export const SUBPHASE_BATTLE = "BATTLE";
export const SUBPHASE_DIALOGUE = "DIALOGUE";
export const SUBPHASE_MENU = "MENU";

// Battle states
export const BATTLE_MENU = "BATTLE_MENU";
export const BATTLE_ANIMATING = "BATTLE_ANIMATING";
export const BATTLE_ENEMY_TURN = "BATTLE_ENEMY_TURN";
export const BATTLE_VICTORY = "BATTLE_VICTORY";
export const BATTLE_CAPTURE = "BATTLE_CAPTURE";

// Creo types
export const TYPE_FIRE = "FIRE";
export const TYPE_WATER = "WATER";
export const TYPE_GRASS = "GRASS";
export const TYPE_ELECTRIC = "ELECTRIC";
export const TYPE_NORMAL = "NORMAL";

// Type effectiveness chart
export const TYPE_CHART = {
  [TYPE_FIRE]: { [TYPE_GRASS]: 2, [TYPE_WATER]: 0.5, [TYPE_FIRE]: 0.5 },
  [TYPE_WATER]: { [TYPE_FIRE]: 2, [TYPE_GRASS]: 0.5, [TYPE_WATER]: 0.5 },
  [TYPE_GRASS]: { [TYPE_WATER]: 2, [TYPE_FIRE]: 0.5, [TYPE_GRASS]: 0.5 },
  [TYPE_ELECTRIC]: { [TYPE_WATER]: 2 },
  [TYPE_NORMAL]: {}
};

// Game state object
export const gameState = {
  gamePhase: PHASE_START,
  subPhase: SUBPHASE_OVERWORLD,
  controlMode: "HUMAN",
  
  // Player data
  player: null,
  playerTeam: [], // Array of Creo objects
  captureItems: 5,
  
  // World data
  entities: [],
  npcs: [],
  biome: "FOREST",
  storyProgress: 0,
  completedMissions: 0,
  
  // Battle data
  inBattle: false,
  battleState: BATTLE_MENU,
  playerCreo: null,
  enemyCreo: null,
  isWildBattle: true,
  currentEnemy: null,
  battleMenu: {
    mainMenu: 0, // 0: Attack, 1: Skills, 2: Items, 3: Switch
    skillMenu: 0,
    switchMenu: 0
  },
  battleMessage: "",
  battleAnimation: null,
  
  // Dialogue
  dialogue: null,
  dialogueIndex: 0,
  
  // Camera
  cameraX: 0,
  cameraY: 0,
  
  // Game stats
  totalBattles: 0,
  creosCaptured: 0,
  trainersDefeated: 0,
  
  // Frame tracking
  frameCount: 0
};

// Expose gameState getter
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}