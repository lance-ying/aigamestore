// globals.js - Global constants and game state
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 400;
export const TARGET_FPS = 60;

// Game phases
export const PHASE_START = "START";
export const PHASE_PLAYING = "PLAYING";
export const PHASE_PAUSED = "PAUSED";
export const PHASE_GAME_OVER_WIN = "GAME_OVER_WIN";
export const PHASE_GAME_OVER_LOSE = "GAME_OVER_LOSE";

// Control modes
export const CONTROL_HUMAN = "HUMAN";
export const CONTROL_TEST_1 = "TEST_1";
export const CONTROL_TEST_2 = "TEST_2";

// Key codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_SHIFT = 16;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_R = 82;
export const KEY_Z = 90;

// Game state - central state object
export const gameState = {
  player: null,
  entities: [],
  interactables: [],
  items: [],
  inventory: [],
  currentFloor: 0,
  totalFloors: 3,
  score: 0,
  gamePhase: PHASE_START,
  controlMode: CONTROL_HUMAN,
  puzzlesSolved: [],
  requiredPuzzles: [],
  deathMessage: "",
  showInventory: false,
  selectedInventoryIndex: -1,
  dialogueActive: false,
  currentDialogue: null,
  checkpoints: [],
  traps: [],
  doors: [],
  ladders: [],
  framesSinceLastAction: 0
};

// Floor configurations
export const FLOOR_CONFIGS = [
  {
    floor: 0,
    name: "The Prison Floor",
    bgColor: [30, 20, 40],
    puzzles: ["find_key", "unlock_door", "activate_lever"],
    itemSpawns: [
      { type: "key", x: 150, y: 320, id: "prison_key" },
      { type: "lever_part", x: 450, y: 150, id: "lever_piece" }
    ],
    traps: [
      { x: 300, y: 350, width: 60, height: 20, type: "spike" }
    ],
    doors: [
      { x: 500, y: 280, width: 40, height: 80, locked: true, requiredItem: "prison_key" }
    ],
    ladders: [
      { x: 520, y: 100, width: 30, height: 150 }
    ]
  },
  {
    floor: 1,
    name: "The Industrial Floor",
    bgColor: [40, 30, 30],
    puzzles: ["combine_items", "deactivate_electricity", "open_vault"],
    itemSpawns: [
      { type: "wire_cutters", x: 100, y: 320, id: "cutters" },
      { type: "insulated_gloves", x: 400, y: 180, id: "gloves" },
      { type: "vault_code", x: 250, y: 320, id: "code_note" }
    ],
    traps: [
      { x: 200, y: 350, width: 80, height: 20, type: "electric" },
      { x: 350, y: 200, width: 60, height: 20, type: "electric" }
    ],
    doors: [
      { x: 550, y: 150, width: 40, height: 80, locked: true, requiresPuzzle: "open_vault" }
    ],
    ladders: [
      { x: 560, y: 50, width: 30, height: 120 }
    ]
  },
  {
    floor: 2,
    name: "The Exit Floor",
    bgColor: [20, 30, 40],
    puzzles: ["find_exit_key", "disable_alarm", "escape"],
    itemSpawns: [
      { type: "exit_key", x: 200, y: 150, id: "exit_key" },
      { type: "alarm_device", x: 400, y: 320, id: "alarm_remote" }
    ],
    traps: [
      { x: 150, y: 350, width: 100, height: 20, type: "pit" }
    ],
    doors: [
      { x: 500, y: 280, width: 50, height: 90, locked: true, requiredItem: "exit_key", isExit: true }
    ],
    ladders: []
  }
];

// Export function to get game state
export function getGameState() {
  return gameState;
}

// Attach to window
if (typeof window !== 'undefined') {
  window.getGameState = getGameState;
}