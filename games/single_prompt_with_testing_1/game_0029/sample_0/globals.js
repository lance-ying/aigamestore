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

export const CULTIVATION_STAGES = [
  { name: "Mortal", qiRequired: 0, color: [150, 150, 150], maxHealth: 100 },
  { name: "Qi Condensation", qiRequired: 50, color: [100, 200, 255], maxHealth: 150 },
  { name: "Foundation Establishment", qiRequired: 150, color: [150, 100, 255], maxHealth: 250 },
  { name: "Golden Core", qiRequired: 300, color: [255, 215, 0], maxHealth: 400 },
  { name: "Nascent Soul", qiRequired: 500, color: [255, 100, 200], maxHealth: 600 },
  { name: "Immortal", qiRequired: 800, color: [255, 255, 255], maxHealth: 1000 }
];

export const gameState = {
  player: null,
  entities: [],
  qiOrbs: [],
  enemies: [],
  particles: [],
  score: 0,
  qi: 0,
  cultivationStage: 0,
  gamePhase: GAME_PHASES.START,
  controlMode: "HUMAN",
  frameCounter: 0,
  worldOffsetX: 0,
  worldOffsetY: 0,
  combatLog: [],
  lastBreakthroughTime: 0
};

// Make gameState accessible globally
if (typeof window !== 'undefined') {
  window.getGameState = () => gameState;
}