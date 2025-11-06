// globals.js - Global constants and game state

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const GRAVITY = 0.6;
export const PLAYER_SPEED = 3;
export const PLAYER_JUMP_FORCE = -12;
export const MAX_HEALTH = 3;

export const gameState = {
  player: null,
  entities: [],
  platforms: [],
  enemies: [],
  items: [],
  hazards: [],
  particles: [],
  currentLevel: 0,
  score: 0,
  gamePhase: "START", // "START", "PLAYING", "GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"
  controlMode: "HUMAN", // "HUMAN", "TEST_1", "TEST_2", etc.
  levelComplete: false,
  exitPortal: null,
  cameraX: 0,
  levelWidth: 2400,
  keys: {},
  framesSinceLastAction: 0
};

// Level design data
export const LEVELS = [
  {
    name: "Viking's Path",
    width: 2400,
    platforms: [
      { x: 0, y: 350, w: 400, h: 50, type: "ground" },
      { x: 500, y: 320, w: 200, h: 30, type: "platform" },
      { x: 800, y: 280, w: 150, h: 30, type: "platform" },
      { x: 1050, y: 240, w: 200, h: 30, type: "platform" },
      { x: 1350, y: 300, w: 250, h: 30, type: "platform" },
      { x: 1700, y: 350, w: 300, h: 50, type: "ground" },
      { x: 2100, y: 320, w: 300, h: 50, type: "ground" }
    ],
    enemies: [
      { x: 550, y: 270, type: "goblin" },
      { x: 850, y: 230, type: "goblin" },
      { x: 1400, y: 250, type: "troll" },
      { x: 1800, y: 300, type: "goblin" }
    ],
    items: [
      { x: 600, y: 280, type: "sword" },
      { x: 1100, y: 200, type: "health" },
      { x: 1450, y: 260, type: "shield" }
    ],
    hazards: [
      { x: 420, y: 360, w: 60, h: 20, type: "spikes" },
      { x: 1280, y: 310, w: 50, h: 20, type: "spikes" }
    ],
    exitPortal: { x: 2300, y: 250 }
  }
];

export function getGameState() {
  return gameState;
}

window.getGameState = getGameState;